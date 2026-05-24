import io
import base64
import json
import re
import gc
import uuid
from datetime import datetime, timezone

# pyrefly: ignore [missing-import]
import numpy as np
from PIL import Image, ImageDraw

from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Profile, VerificationRecord, DisbursementTransaction
from .apps import CoreConfig

# ---------------------------------------------------------------------------
# Trust Score Config & Calculation
# ---------------------------------------------------------------------------
QUALITY_WEIGHT = 0.6
CONFIDENCE_WEIGHT = 0.4
TRUST_THRESHOLD = 70.0

def compute_trust_score(quality_score: float, ocr_confidence: float) -> dict:
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
# Image Processing & AI Inference Helpers
# ---------------------------------------------------------------------------
def image_to_base64(image: Image.Image, format: str = "JPEG") -> str:
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    buffer.close()
    return b64

def draw_detections(image: Image.Image, detections: list) -> Image.Image:
    annotated = image.copy()
    draw = ImageDraw.Draw(annotated)

    colors = {
        "good": "#22c55e",
        "blemish": "#ef4444",
        "overripe": "#f59e0b",
        "underripe": "#3b82f6",
        "default": "#a855f7",
    }

    for det in detections:
        # Use absolute coordinates for server-side drawing
        bbox = det.get("absolute_bbox") or det.get("bbox")
        label = det["label"]
        conf = det["confidence"]
        color = colors.get(label, colors["default"])

        draw.rectangle(bbox, outline=color, width=3)
        label_text = f"{label} {conf:.0%}"
        
        try:
            text_bbox = draw.textbbox((bbox[0], bbox[1] - 20), label_text)
            draw.rectangle(text_bbox, fill=color)
            draw.text((bbox[0], bbox[1] - 20), label_text, fill="white")
        except:
            # Fallback if text drawing issues arise
            pass

    return annotated

def map_to_quality_label(coco_label: str) -> str:
    good_indicators = ["apple", "orange", "banana", "broccoli", "carrot"]
    blemish_indicators = ["sports ball", "frisbee"]
    size_indicators = ["bowl", "cup"]

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
    if not detections:
        return 75.0

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

def analyze_crop_quality(image_bytes: bytes, model) -> dict:
    try:
        mem_buffer = io.BytesIO(image_bytes)
        pil_image = Image.open(mem_buffer).convert("RGB")

        if model is None:
            # Fallback offline mock detections
            raise Exception("YOLOv8 Model not fully loaded in RAM")

        results = model(pil_image, verbose=False)
        detections = []

        if results and len(results) > 0:
            result = results[0]
            if result.boxes is not None and len(result.boxes) > 0:
                width, height = pil_image.size
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    label = result.names.get(cls_id, f"class_{cls_id}")

                    quality_label = map_to_quality_label(label)
                    
                    # Convert to responsive percentages [x, y, w, h] for client canvas overlays
                    x_pct = round((x1 / width) * 100, 2) if width else 0.0
                    y_pct = round((y1 / height) * 100, 2) if height else 0.0
                    w_pct = round(((x2 - x1) / width) * 100, 2) if width else 0.0
                    h_pct = round(((y2 - y1) / height) * 100, 2) if height else 0.0

                    detections.append({
                        "label": quality_label,
                        "original_class": label,
                        "confidence": round(conf, 4),
                        "bbox": [x_pct, y_pct, w_pct, h_pct],
                        "absolute_bbox": [round(x1), round(y1), round(x2), round(y2)],
                    })

        quality_score = calculate_quality_score(detections)
        annotated_image = draw_detections(pil_image, detections)
        annotated_b64 = image_to_base64(annotated_image)

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

def parse_invoice_fields(text: str) -> dict:
    fields = {}

    # Extract currency amounts
    amount_pattern = r"[\$₹€£]?\s*[\d,]+\.?\d*"
    amounts = re.findall(amount_pattern, text)
    if amounts:
        numeric_amounts = []
        for a in amounts:
            cleaned = re.sub(r"[^\d.]", "", a)
            try:
                numeric_amounts.append(float(cleaned))
            except ValueError:
                pass
        if numeric_amounts:
            fields["total_amount"] = max(numeric_amounts)

    # Dates
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

    # IDs
    id_pattern = r"[A-Z]{2,4}[-_]\d{3,}"
    ids = re.findall(id_pattern, text)
    if ids:
        fields["seller_id"] = ids[0]
        if len(ids) > 1:
            fields["invoice_id"] = ids[1]

    return fields

def process_invoice_ocr(image_bytes: bytes, reader) -> dict:
    try:
        mem_buffer = io.BytesIO(image_bytes)
        pil_image = Image.open(mem_buffer).convert("RGB")
        img_array = np.array(pil_image)

        if reader is None:
            raise Exception("EasyOCR Reader not loaded in RAM")

        raw_results = reader.readtext(img_array)
        extracted_lines = []
        total_confidence = 0.0

        for bbox, text, conf in raw_results:
            conf_float = float(conf)
            extracted_lines.append({
                "text": text.strip(),
                "confidence": round(conf_float, 4),
                "bbox": [[int(p[0]), int(p[1])] for p in bbox],
            })
            total_confidence += conf_float

        avg_confidence = (
            round(total_confidence / len(extracted_lines), 4)
            if extracted_lines
            else 0.0
        )

        full_text = " ".join([line["text"] for line in extracted_lines])
        parsed_fields = parse_invoice_fields(full_text)

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


# ---------------------------------------------------------------------------
# View Controllers
# ---------------------------------------------------------------------------
def home_view(request):
    session_user = None
    if request.user.is_authenticated:
        try:
            session_user = {
                "name": request.user.first_name or request.user.username,
                "role": request.user.profile.role,
            }
        except:
            pass
    return render(request, "index.html", {"session": session_user})


def login_view(request):
    if request.user.is_authenticated:
        if request.user.profile.role == 'admin':
            return redirect("/dashboard/")
        else:
            logout(request)
            return redirect("/login/farmer/")
    return render(request, "login.html")


def admin_login_view(request):
    if request.user.is_authenticated:
        if request.user.profile.role in ('admin', 'superadmin'):
            return redirect("/dashboard/")
        else:
            logout(request)
            return redirect("/login/farmer/")
        
    error = ""
    if request.method == "POST":
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "").strip()
        
        try:
            user_obj = User.objects.get(email__iexact=email)
            user = authenticate(username=user_obj.username, password=password)
            if user is not None:
                if user.profile.role in ('admin', 'superadmin'):
                    login(request, user)
                    return redirect("/dashboard/")
                else:
                    error = "Access denied: This login is reserved for Cooperative Administrators."
            else:
                error = "Invalid credentials. Try: admin@agrotrust.co / admin123"
        except User.DoesNotExist:
            error = "No Admin account found with this email."

    return render(request, "admin_login.html", {"error": error, "is_register": False})


def farmer_login_view(request):
    if request.user.is_authenticated:
        logout(request)
    return render(request, "farmer_coming_soon.html")


def register_view(request):
    return redirect("/login/")


def admin_register_view(request):
    """Public admin self-registration is DISABLED.
    Only a superuser can create admin accounts via /superadmin/create-admin/
    """
    return redirect("/login/admin/")


@login_required
def create_admin_view(request):
    """Superuser-only view to create new Cooperative Admin accounts."""
    if not request.user.is_superuser:
        return redirect("/dashboard/")

    error = ""
    success = ""
    admins = User.objects.filter(profile__role="admin").select_related("profile").order_by("-date_joined")

    if request.method == "POST":
        action = request.POST.get("action", "create")

        if action == "create":
            name = request.POST.get("name", "").strip()
            coop_name = request.POST.get("coop_name", "").strip()
            email = request.POST.get("email", "").strip().lower()
            password = request.POST.get("password", "").strip()

            if not name or not coop_name or not email or not password:
                error = "All fields are required."
            elif User.objects.filter(email=email).exists():
                error = f"An account with email '{email}' already exists."
            elif len(password) < 8:
                error = "Password must be at least 8 characters."
            else:
                username = f"admin_{uuid.uuid4().hex[:6]}"
                new_user = User.objects.create_user(username=username, email=email, password=password)
                new_user.first_name = name
                new_user.save()
                new_user.profile.role = "admin"
                new_user.profile.coop_name = coop_name
                new_user.profile.save()
                success = f"Admin account created for {name} ({email})."
                admins = User.objects.filter(profile__role="admin").select_related("profile").order_by("-date_joined")

        elif action == "revoke":
            target_id = request.POST.get("user_id")
            try:
                target = User.objects.get(id=target_id)
                # Prevent revoking own superuser account
                if target.id != request.user.id:
                    target.profile.role = "farmer"
                    target.is_active = False
                    target.profile.save()
                    target.save()
                    success = f"Admin access revoked for {target.first_name or target.username}."
                    admins = User.objects.filter(profile__role="admin").select_related("profile").order_by("-date_joined")
                else:
                    error = "You cannot revoke your own account."
            except User.DoesNotExist:
                error = "User not found."

    return render(request, "create_admin.html", {
        "error": error,
        "success": success,
        "admins": admins,
        # Platform-wide data
        "all_users": User.objects.select_related("profile").order_by("-date_joined")[:50],
        "recent_verifications": VerificationRecord.objects.select_related("user").order_by("-created_at")[:20],
        "recent_transactions": DisbursementTransaction.objects.select_related(
            "verification_record__user"
        ).order_by("-created_at")[:20],
        # Aggregate stats
        "stats": {
            "total_admins": User.objects.filter(profile__role="admin").count(),
            "total_farmers": User.objects.filter(profile__role="farmer").count(),
            "total_verifications": VerificationRecord.objects.count(),
            "total_transactions": DisbursementTransaction.objects.count(),
            "total_settled": DisbursementTransaction.objects.filter(status="SETTLED").count(),
            "total_net_settled": DisbursementTransaction.objects.filter(
                status="SETTLED"
            ).values_list("net_settlement", flat=True),
        },
    })


def logout_view(request):
    logout(request)
    return redirect("/login/")


@csrf_exempt
def google_auth_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            account_type = data.get("account_type", "farmer")
            
            if account_type == "farmer":
                # Look for existing seed farmer first to avoid constraint clashes
                user_obj = User.objects.filter(username="AG-4821").first()
                if not user_obj:
                    user_obj = User.objects.filter(email="harpreet.singh.google@gmail.com").first()
                    
                if not user_obj:
                    # Create new simulated Google farmer with a unique farmer ID
                    user_obj = User.objects.create_user(
                        username="AG-GOOGLE-FARMER",
                        email="harpreet.singh.google@gmail.com"
                    )
                    user_obj.first_name = "Harpreet Singh"
                    user_obj.save()
                    
                    user_obj.profile.role = "farmer"
                    user_obj.profile.farmer_id = "AG-GOOGLE-4821"
                    user_obj.profile.passcode = "4821"
                    user_obj.profile.save()
                else:
                    # Sync and secure role setting on existing user
                    user_obj.profile.role = "farmer"
                    if not user_obj.profile.farmer_id:
                        user_obj.profile.farmer_id = "AG-4821"
                    user_obj.profile.save()
            else:
                # Look for existing seed admin first
                user_obj = User.objects.filter(username="admin_demo").first()
                if not user_obj:
                    user_obj = User.objects.filter(email="coop.admin.google@gmail.com").first()
                    
                if not user_obj:
                    user_obj = User.objects.create_user(
                        username="ADM-GOOGLE-COOP",
                        email="coop.admin.google@gmail.com"
                    )
                    user_obj.first_name = "Cooperative Administrator"
                    user_obj.save()
                    
                    user_obj.profile.role = "admin"
                    user_obj.profile.coop_name = "Google Farmers Cooperative"
                    user_obj.profile.save()
                else:
                    user_obj.profile.role = "admin"
                    if not user_obj.profile.coop_name:
                        user_obj.profile.coop_name = "Google Farmers Cooperative"
                    user_obj.profile.save()
                
            login(request, user_obj)
            return JsonResponse({"status": "success"})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)
    return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)


@login_required
def dashboard_view(request):
    profile = request.user.profile
    if profile.role not in ('admin', 'superadmin'):
        logout(request)
        return redirect("/login/farmer/")
        
    session_user = {
        "name": request.user.first_name or request.user.username,
        "role": profile.role,
        "id": "ADM-COOP",
        "coop_name": profile.coop_name
    }
    
    # Render previous transaction logs
    transactions = DisbursementTransaction.objects.filter(
        verification_record__user=request.user
    ).order_by('-created_at')
    
    return render(request, "dashboard.html", {
        "session": session_user,
        "transactions": transactions,
    })


# ---------------------------------------------------------------------------
# API View Endpoints
# ---------------------------------------------------------------------------
@csrf_exempt
@login_required
def analyze_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    try:
        image_file = request.FILES.get("file")
        analysis_type = request.POST.get("analysis_type", "both")
        encrypted_metadata = request.POST.get("encrypted_metadata", "{}")
        
        if not image_file:
            return JsonResponse({"error": "No file uploaded"}, status=400)
            
        image_bytes = image_file.read()
        file_size = len(image_bytes)

        # Verify image integrity before feeding to AI models
        try:
            mem_buffer = io.BytesIO(image_bytes)
            pil_image = Image.open(mem_buffer)
            pil_image.verify()
            mem_buffer.close()
        except Exception:
            return JsonResponse({
                "error": "An internal error occurred during processing. Please ensure the uploaded file is a valid image."
            }, status=400)

        crop_analysis = None
        ocr_analysis = None

        if analysis_type in ("crop", "both"):
            crop_analysis = analyze_crop_quality(image_bytes, CoreConfig.yolo_model)

        if analysis_type in ("invoice", "both"):
            ocr_analysis = process_invoice_ocr(image_bytes, CoreConfig.ocr_reader)

        # Build results
        quality_score = crop_analysis["quality_score"] if crop_analysis else 75.0
        ocr_confidence = ocr_analysis["confidence"] if ocr_analysis else 0.5
        trust = compute_trust_score(quality_score, ocr_confidence)

        # Persist Verification in DB
        record = VerificationRecord.objects.create(
            user=request.user,
            filename=image_file.name,
            file_size_bytes=file_size,
            analysis_type=analysis_type,
            quality_score=quality_score,
            ocr_confidence=ocr_confidence,
            trust_score=trust["value"],
            payment_eligible=trust["payment_eligible"],
            extracted_amount=ocr_analysis["extracted_fields"].get("total_amount", 0.0) if ocr_analysis else 0.0,
            extracted_date=ocr_analysis["extracted_fields"].get("date", "") if ocr_analysis else "",
            extracted_seller_id=ocr_analysis["extracted_fields"].get("seller_id", "") if ocr_analysis else "",
            extracted_invoice_id=ocr_analysis["extracted_fields"].get("invoice_id", "") if ocr_analysis else "",
            raw_ocr_lines=json.dumps(ocr_analysis["raw_lines"]) if ocr_analysis else '[]',
            detections=json.dumps(crop_analysis["detections"]) if crop_analysis else '[]',
            annotated_image_base64=crop_analysis.get("annotated_image") if crop_analysis else None
        )

        response = {
            "record_id": record.id,
            "filename": record.filename,
            "file_size_bytes": record.file_size_bytes,
            "analysis_type": record.analysis_type,
            "timestamp": record.created_at.isoformat() if record.created_at else datetime.now(timezone.utc).isoformat(),
            "trust_score": trust,
        }

        if crop_analysis:
            response["crop_analysis"] = crop_analysis

        if ocr_analysis:
            response["ocr_results"] = ocr_analysis

        if encrypted_metadata and encrypted_metadata != "{}":
            response["encrypted_metadata"] = encrypted_metadata

        del image_bytes
        gc.collect()

        return JsonResponse(response)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@login_required
def payout_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    try:
        record_id = request.POST.get("record_id")
        trust_score = float(request.POST.get("trust_score", 0.0))
        invoice_amount = float(request.POST.get("invoice_amount", 0.0))
        seller_id = request.POST.get("seller_id", "UNKNOWN")
        invoice_date = request.POST.get("invoice_date", "")

        if not record_id:
            return JsonResponse({"error": "Verification record ID is required"}, status=400)

        record = VerificationRecord.objects.get(id=record_id, user=request.user)

        if trust_score < 70.0:
            return JsonResponse({
                "status": "REJECTED",
                "transaction_id": None,
                "eligibility": {
                    "eligible": False,
                    "trust_score": trust_score,
                    "threshold": 70.0,
                    "reason": f"Trust score {trust_score:.1f} below minimum compliance standard."
                }
            })

        # Calculate Fees
        fee_percent = 1.5
        fee_amount = round(invoice_amount * (fee_percent / 100), 2)
        net_settlement = round(invoice_amount - fee_amount, 2)
        
        # Pice details
        tx_id = f"PICE-AG-{uuid.uuid4().hex[:12].upper()}"
        ref = f"REF-{uuid.uuid4().hex[:8].upper()}"
        hsh = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex[:8]}"

        debit_ac = "AGROTRUST_ESCROW"
        credit_ac = f"SELLER_{seller_id}"
        narration = f"Crop supply auto-settlement - Trust Score: {trust_score:.1f}"

        # Persist transaction
        tx = DisbursementTransaction.objects.create(
            verification_record=record,
            transaction_id=tx_id,
            status="SETTLED",
            gross_amount=invoice_amount,
            fee_percent=fee_percent,
            fee_amount=fee_amount,
            net_settlement=net_settlement,
            reference=ref,
            immutable_hash=hsh,
            debit_account=debit_ac,
            credit_account=credit_ac,
            narration=narration
        )

        return JsonResponse({
            "status": tx.status,
            "transaction_id": tx.transaction_id,
            "eligibility": {
                "eligible": True,
                "trust_score": trust_score,
                "threshold": 70.0,
            },
            "settlement": {
                "gross_amount": tx.gross_amount,
                "fee_percent": tx.fee_percent,
                "fee_amount": tx.fee_amount,
                "net_settlement": tx.net_settlement,
                "method": "PICE_B2B_INSTANT",
                "reference": tx.reference,
                "immutable_hash": tx.immutable_hash,
            },
            "ledger_entry": {
                "debit_account": tx.debit_account,
                "credit_account": tx.credit_account,
                "amount": tx.net_settlement,
                "narration": tx.narration,
            }
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
