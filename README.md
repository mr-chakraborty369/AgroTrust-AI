# 🌾 AgroTrust AI

**Privacy-First Agricultural Supply Chain Verification Platform**

> Empowering smallholder farmers with AI-driven quality assurance and instant, transparent payment settlement — directly advancing **UN SDG 1 (No Poverty)** and **SDG 2 (Zero Hunger)**.

---

## 🎯 Problem Statement

Smallholder farmers across developing economies face systemic exploitation in agricultural supply chains:
- **Opaque grading**: Crop quality is assessed subjectively, leading to unfair pricing
- **Delayed payments**: Settlement cycles of 30–90 days trap farmers in debt cycles
- **Privacy risks**: Sensitive farm location and financial data is routinely exposed

## 💡 Solution

AgroTrust AI is a **zero-trust, privacy-first** platform that:
1. **Analyzes crop quality** using on-device YOLOv8 computer vision (no cloud dependency)
2. **Extracts invoice data** via EasyOCR for automated verification
3. **Computes trust scores** using a transparent weighted algorithm
4. **Triggers instant payouts** when quality benchmarks are met
5. **Protects farmer privacy** by stripping GPS metadata and encrypting financial data client-side

## 🏗️ Architecture

```
[Next.js Frontend] --(AES-256 Payload)--> [FastAPI Backend]
        |                                       |
  (EXIF Stripping)                         (RAM-Only Processing)
        |                                   /         \
  [Dashboard UI] <---(JSON Response)--- [YOLOv8]   [EasyOCR]
                                           \         /
                                        [Trust Score Engine]
                                              |
                                     [Pice Payout Ledger]
```

### Data Lifecycle (Zero Footprint)

| Phase | Tool | Environment | Purpose |
|-------|------|-------------|---------|
| Ingestion | Canvas API | Browser | Strip GPS/EXIF metadata |
| Transit | CryptoJS AES-256 | Network | Encrypt financial data |
| Inference | io.BytesIO | RAM | Process without disk writes |
| Cleanup | Python GC | Server | Destroy data post-response |

## 🚀 Quick Start

### Frontend (Next.js)
```bash
cd client
npm install
npm run dev
# → http://localhost:3000
```

### Backend (FastAPI)
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

## 🔒 Security Design

- **Client-side EXIF stripping** — Farm GPS coordinates never leave the browser
- **AES-256 encryption** — Bank details encrypted before network transit
- **Ephemeral processing** — Images processed in RAM, never written to disk
- **Zero-trust architecture** — Every component validates independently

## 📊 Trust Score Algorithm

```
S = w₁ · Q + w₂ · C

Where:
  Q = Crop quality score (0-100) from YOLOv8 analysis
  C = OCR confidence (0-1) normalized to 0-100
  w₁ = 0.6 (quality weight)
  w₂ = 0.4 (confidence weight)
  Threshold: S ≥ 70 → Payment eligible
```

## 🏆 SDG Alignment

| SDG | Target | How AgroTrust Contributes |
|-----|--------|--------------------------|
| **SDG 1** | End poverty | Instant payouts eliminate debt cycles for smallholders |
| **SDG 2** | Zero hunger | Fair quality grading incentivizes crop production |

## 📁 Project Structure

```
AgroTrust-AI/
├── client/          # Next.js frontend (dashboard + privacy layer)
├── server/          # FastAPI backend (AI engines + payout sim)
└── README.md
```

---

*Built for Hackathon 2026 — Pillars: Web Platform, Custom AI, Security & Privacy*
