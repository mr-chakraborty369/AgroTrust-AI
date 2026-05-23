"""
AgroTrust AI — FastAPI Backend Engine
Privacy-first agricultural supply chain verification with dual AI inference.

All image processing happens in RAM via io.BytesIO — zero disk writes.
Python GC reclaims memory immediately after response dispatch.
"""

import io
import base64
import json
import re
import gc
from datetime import datetime, timezone
from contextlib import asynccontextmanager

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# AI Engines
import easyocr
from ultralytics import YOLO

# Internal modules
from pice_simulator import process_payout


# ---------------------------------------------------------------------------
# Application lifespan — load models once at startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load AI models into memory on startup, clean up on shutdown."""
    print("🚀 Loading AI models into memory...")

    # EasyOCR Reader — English language, CPU mode
    app.state.ocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    print("✅ EasyOCR Reader loaded")

    # YOLOv8 Nano Segmentation model — lightweight, fast inference
    app.state.yolo_model = YOLO("yolov8n.pt")
    print("✅ YOLOv8 model loaded")

    yield  # Application runs

    # Cleanup on shutdown
    del app.state.ocr_reader
    del app.state.yolo_model
    gc.collect()
    print("🧹 Models unloaded, memory cleaned")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AgroTrust AI Engine",
    description="Privacy-first crop quality analysis and invoice verification",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Trust Score Algorithm
# ---------------------------------------------------------------------------
QUALITY_WEIGHT = 0.6
CONFIDENCE_WEIGHT = 0.4
TRUST_THRESHOLD = 70.0


def compute_trust_score(quality_score: float, ocr_confidence: float) -> dict:
    """
    Compute composite trust score: S = w1 * Q + w2 * C
    Q: crop quality (0-100), C: OCR confidence normalized to 0-100
    """
    c_normalized = ocr_confidence * 100  # Convert 0-1 → 0-100
    score = QUALITY_WEIGHT * quality_score + CONFIDENCE_WEIGHT * c_normalized
    score = round(min(max(score, 0), 100), 2)

    return {
        "value": score,
        "quality_component": round(quality_score, 2),
        "confidence_component": round(ocr_confidence, 4),
        "quality_weight": QUALITY_WEIGHT,
        "confidence_weight": CONFIDENCE_WEIGHT,
        "payment_eligible": score >= TRUST_THRESHOLD,
        "threshold": TRUST_THRESHOLD,
    }


# ---------------------------------------------------------------------------
# Image Processing Utilities (all in-memory)
# ---------------------------------------------------------------------------
def image_to_base64(image: Image.Image, format: str = "JPEG") -> str:
    """Convert PIL Image to base64 string — ephemeral buffer only."""
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    buffer.close()
    return b64


def draw_detections(image: Image.Image, detections: list) -> Image.Image:
    """Draw bounding boxes and labels on image copy."""
    annotated = image.copy()
    draw = ImageDraw.Draw(annotated)

    colors = {
        "good": "#22c55e",     # green
        "blemish": "#ef4444",  # red
        "overripe": "#f59e0b", # amber
        "underripe": "#3b82f6", # blue
        "default": "#a855f7",  # purple
    }

    for det in detections:
        bbox = det["bbox"]
        label = det["label"]
        conf = det["confidence"]
        color = colors.get(label, colors["default"])

        # Draw box
        draw.rectangle(bbox, outline=color, width=3)

        # Draw label
        label_text = f"{label} {conf:.0%}"
        text_bbox = draw.textbbox((bbox[0], bbox[1] - 20), label_text)
        draw.rectangle(text_bbox, fill=color)
        draw.text((bbox[0], bbox[1] - 20), label_text, fill="white")

    return annotated


# ---------------------------------------------------------------------------
# Crop Quality Analysis (YOLOv8)
# ---------------------------------------------------------------------------
def analyze_crop_quality(image_bytes: bytes, model) -> dict:
    """
    Run YOLOv8 inference on crop image in-memory.
    Returns quality score and detection details.
    """
    try:
        # Load image from bytes — NO DISK WRITE
        mem_buffer = io.BytesIO(image_bytes)
        pil_image = Image.open(mem_buffer).convert("RGB")

        # Run YOLOv8 inference
        results = model(pil_image, verbose=False)

        detections = []
        total_confidence = 0.0

        if results and len(results) > 0:
            result = results[0]
            if result.boxes is not None and len(result.boxes) > 0:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    label = result.names.get(cls_id, f"class_{cls_id}")

                    # Map COCO classes to agricultural quality indicators
                    quality_label = map_to_quality_label(label)

                    detections.append({
                        "label": quality_label,
                        "original_class": label,
                        "confidence": round(conf, 4),
                        "bbox": [round(x1), round(y1), round(x2), round(y2)],
                    })
                    total_confidence += conf

        # Calculate quality score
        # Higher confidence detections of "good" items = higher quality
        # Presence of blemishes/issues reduces score
        quality_score = calculate_quality_score(detections)

        # Draw annotations
        annotated_image = draw_detections(pil_image, detections)
        annotated_b64 = image_to_base64(annotated_image)

        # Cleanup — ephemeral lifecycle
        mem_buffer.close()
        del pil_image, annotated_image
        gc.collect()

        return {
            "quality_score": quality_score,
            "detections": detections,
            "detection_count": len(detections),
            "annotated_image": annotated_b64,
        }

    except Exception as e:
        return {
            "quality_score": 50.0,
            "detections": [],
            "detection_count": 0,
            "annotated_image": None,
            "error": str(e),
        }


def map_to_quality_label(coco_label: str) -> str:
    """Map COCO detection classes to agricultural quality indicators."""
    # For demo: map common objects to quality categories
    good_indicators = ["apple", "orange", "banana", "broccoli", "carrot"]
    blemish_indicators = ["sports ball", "frisbee"]  # Round dark spots
    size_indicators = ["bowl", "cup"]  # Reference sizing

    label_lower = coco_label.lower()
    if label_lower in good_indicators:
        return "good"
    elif label_lower in blemish_indicators:
        return "blemish"
    elif label_lower in size_indicators:
        return "sizing_ref"
    else:
        return label_lower


def calculate_quality_score(detections: list) -> float:
    """
    Calculate crop quality score (0-100) from detections.
    Good detections increase score, blemishes decrease it.
    """
    if not detections:
        return 75.0  # Default baseline for no detections

    base_score = 80.0
    good_bonus = 0
    blemish_penalty = 0

    for det in detections:
        conf = det["confidence"]
        if det["label"] == "good":
            good_bonus += conf * 10
        elif det["label"] == "blemish":
            blemish_penalty += conf * 15
        elif det["label"] == "overripe":
            blemish_penalty += conf * 10

    score = base_score + good_bonus - blemish_penalty
    return round(min(max(score, 0), 100), 2)


# ---------------------------------------------------------------------------
# OCR Invoice Processing (EasyOCR)
# ---------------------------------------------------------------------------
def process_invoice_ocr(image_bytes: bytes, reader) -> dict:
    """
    Extract text from invoice/delivery slip image using EasyOCR.
    All processing in-memory via BytesIO.
    """
    try:
        # Load image bytes — NO DISK WRITE
        mem_buffer = io.BytesIO(image_bytes)
        pil_image = Image.open(mem_buffer).convert("RGB")
        img_array = np.array(pil_image)

        # Run EasyOCR
        raw_results = reader.readtext(img_array)

        # Extract text and compute confidence
        extracted_lines = []
        total_confidence = 0.0

        for bbox, text, conf in raw_results:
            extracted_lines.append({
                "text": text.strip(),
                "confidence": round(conf, 4),
                "bbox": [
                    [int(p[0]), int(p[1])] for p in bbox
                ],
            })
            total_confidence += conf

        avg_confidence = (
            round(total_confidence / len(extracted_lines), 4)
            if extracted_lines
            else 0.0
        )

        # Parse structured fields from raw text
        full_text = " ".join([line["text"] for line in extracted_lines])
        parsed_fields = parse_invoice_fields(full_text)

        # Cleanup
        mem_buffer.close()
        del pil_image, img_array
        gc.collect()

        return {
            "confidence": avg_confidence,
            "raw_lines": extracted_lines,
            "extracted_fields": parsed_fields,
            "full_text": full_text,
        }

    except Exception as e:
        return {
            "confidence": 0.0,
            "raw_lines": [],
            "extracted_fields": {},
            "full_text": "",
            "error": str(e),
        }


def parse_invoice_fields(text: str) -> dict:
    """
    Parse common invoice fields from OCR text.
    Uses regex patterns to extract amounts, dates, IDs.
    """
    fields = {}

    # Extract monetary amounts (e.g., $1,250.00, ₹15000, 1250.50)
    amount_pattern = r"[\$₹€£]?\s*[\d,]+\.?\d*"
    amounts = re.findall(amount_pattern, text)
    if amounts:
        # Find the largest number as the likely total
        numeric_amounts = []
        for a in amounts:
            cleaned = re.sub(r"[^\d.]", "", a)
            try:
                numeric_amounts.append(float(cleaned))
            except ValueError:
                pass
        if numeric_amounts:
            fields["total_amount"] = max(numeric_amounts)

    # Extract dates (various formats)
    date_patterns = [
        r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}",
        r"\d{4}[/-]\d{1,2}[/-]\d{1,2}",
        r"\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{2,4}",
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            fields["date"] = match.group()
            break

    # Extract IDs (alphanumeric patterns like AG-4821, INV-001)
    id_pattern = r"[A-Z]{2,4}[-_]\d{3,}"
    ids = re.findall(id_pattern, text)
    if ids:
        fields["seller_id"] = ids[0]
        if len(ids) > 1:
            fields["invoice_id"] = ids[1]

    return fields


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "AgroTrust AI Engine",
        "status": "operational",
        "version": "1.0.0",
        "models": {
            "yolov8": "loaded",
            "easyocr": "loaded",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    encrypted_metadata: str = Form(default="{}"),
    analysis_type: str = Form(default="both"),
):
    """
    Main analysis endpoint.
    Accepts image file + optional encrypted metadata.
    Runs crop quality analysis (YOLOv8) and/or invoice OCR (EasyOCR).

    analysis_type: "crop", "invoice", or "both"
    """
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
        if file.content_type and file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid file type",
                    "allowed": allowed_types,
                    "received": file.content_type,
                },
            )

        # Read file into memory — EPHEMERAL, NO DISK
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file received")

        # Size limit: 10MB
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds 10MB limit")

        response = {
            "filename": file.filename,
            "file_size_bytes": len(image_bytes),
            "analysis_type": analysis_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        crop_result = None
        ocr_result = None

        # Run crop quality analysis
        if analysis_type in ("crop", "both"):
            crop_result = analyze_crop_quality(image_bytes, app.state.yolo_model)
            response["crop_analysis"] = crop_result

        # Run OCR invoice processing
        if analysis_type in ("invoice", "both"):
            ocr_result = process_invoice_ocr(image_bytes, app.state.ocr_reader)
            response["ocr_results"] = ocr_result

        # Compute trust score if both analyses ran
        quality_score = crop_result["quality_score"] if crop_result else 75.0
        ocr_confidence = ocr_result["confidence"] if ocr_result else 0.5

        trust = compute_trust_score(quality_score, ocr_confidence)
        response["trust_score"] = trust

        # Include encrypted metadata passthrough (for client-side decryption)
        if encrypted_metadata and encrypted_metadata != "{}":
            response["encrypted_metadata"] = encrypted_metadata

        # Force garbage collection — destroy image bytes from RAM
        del image_bytes
        gc.collect()

        return JSONResponse(content=response)

    except HTTPException:
        raise
    except Exception as e:
        # Catch-all: never expose internal stack traces
        gc.collect()
        return JSONResponse(
            status_code=500,
            content={
                "error": "Analysis failed",
                "detail": "An internal error occurred during processing. Please ensure the uploaded file is a valid image.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )


@app.post("/api/payout")
async def trigger_payout(
    trust_score: float = Form(...),
    invoice_amount: float = Form(default=0.0),
    seller_id: str = Form(default="UNKNOWN"),
    invoice_date: str = Form(default=None),
):
    """
    Trigger a simulated Pice payout based on trust score.
    Only processes if trust score meets compliance threshold.
    """
    try:
        if trust_score < 0 or trust_score > 100:
            raise HTTPException(
                status_code=400,
                detail="Trust score must be between 0 and 100",
            )

        if invoice_amount < 0:
            raise HTTPException(
                status_code=400,
                detail="Invoice amount must be non-negative",
            )

        result = process_payout(
            trust_score=trust_score,
            invoice_amount=invoice_amount if invoice_amount > 0 else 1000.0,
            seller_id=seller_id,
            invoice_date=invoice_date,
        )

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Payout processing failed",
                "detail": "An internal error occurred. Please try again.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )


# ---------------------------------------------------------------------------
# Run with: uvicorn main:app --reload --port 8000
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
