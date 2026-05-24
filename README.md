# 🌾 AgroTrust AI

**Privacy-First B2B Agricultural Supply Chain Verification Platform**

> Empowering smallholder farmers with AI-driven quality assurance and instant, transparent payment settlement — directly advancing **UN SDG 1 (No Poverty)** and **SDG 2 (Zero Hunger)**.

---

## 🎯 Problem Statement

Smallholder farmers across developing economies face systemic exploitation in agricultural supply chains:
- **Opaque grading**: Crop quality is assessed subjectively, leading to unfair pricing.
* **Delayed payments**: Settlement cycles of 30–90 days trap farmers in cyclical debt.
* **Privacy risks**: Sensitive farm geolocation metadata and personal bank details are routinely exposed.

---

## 💡 Solution

AgroTrust AI is a **zero-trust, privacy-first, full-stack platform** that:
1. **Analyzes crop quality** using on-device YOLOv8 computer vision (no cloud storage dependency).
2. **Extracts invoice data** via EasyOCR for automated verification.
3. **Computes trust scores** using a transparent weighted algorithm.
4. **Triggers instant payouts** when quality benchmarks are met.
5. **Protects grower privacy** by stripping GPS metadata in-browser and encrypting financial data client-side.

---

## 🏗️ Architecture

```
                 [Browser Client]
           (EXIF Stripping & Encryption)
                        │
                (Secure POST / CSRF)
                        ▼
           [Unified Django Full-Stack Server]
                        │
         (In-Memory io.BytesIO RAM Processing)
               /                 \
        [YOLOv8 Engine]     [EasyOCR Engine]
         (Preloaded RAM)     (Preloaded RAM)
               \                 /
             [Trust Score Calculation]
                        │
           [Pice Instant Settlement Ledger]
                        │
           [Built-In Django Admin Console]
```

### Data Lifecycle (Zero-Disk Footprint)

| Phase | Tool | Environment | Purpose |
|-------|------|-------------|---------|
| **Ingestion** | Canvas API | Browser | Strip GPS/EXIF metadata from crop images in-browser |
| **Transit** | CryptoJS AES-256 | Network | Encrypt sensitive bank metadata before network transit |
| **Inference** | `io.BytesIO` | RAM Memory | Feed YOLOv8 and EasyOCR strictly in RAM; no files are written to physical disk |
| **Cleanup** | Python Garbage Collector | Server | Explicitly destroy image buffers and clean memory post-response |

---

## 🛠️ Technology Stack

AgroTrust AI is engineered as a highly integrated **Django Full-Stack Application**, eliminating dual-server network latencies and CORS handshake failures:

* **Backend core**: Django 6.x (Session-based auth, secure middleware pipelines, CSRF token validation)
* **Frontend layout**: HTML5 & Tailwind CSS v3 (Custom CDN integration with geometric font hierarchies)
* **Design Language**: Warm-Cream Editorial System inspired by Zapier. Pairing coffee-ink (`#201515`) and warm off-white canvas (`#fffefb`) with vibrant saturated orange (`#ff4f00`) primary CTA highlights.
* **Dark Mode**: Dynamic "Warm Coffee/Espresso" dark theme. Configured with a class-based toggle selector, saved in `localStorage`, and runs FOUC-prevention scripts immediately inside `<head>`.
* **AI Computer Vision**: YOLOv8 preloaded into Django app memory at boot (loads exactly once in RAM).
* **Text Extraction**: EasyOCR visual character parser preloaded into Django RAM.
* **Database**: SQLite3 (housing Django `Profile`, `VerificationRecord`, and `DisbursementTransaction` tables).

---

## 🚀 Quick Start (Local Setup)

To run the unified full-stack application on your local machine:

### 1. Configure the Environment
Ensure you have Python 3.10+ installed. Activate the virtual environment and install all dependencies:
```bash
# Activate virtual environment
source venv/bin/activate

# Navigate to the Django root
cd agrotrust_django
```

### 2. Seed Database & Superuser
Prepare the database tables and create the built-in administration superuser account:
```bash
# Run Django database migrations
python manage.py migrate

# Seed simulated superuser (Username: admin / Password: admin123)
python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None"
```

### 3. Launch Development Server
Boot up the full-stack server (models will pre-load automatically into your system's RAM):
```bash
python manage.py runserver 8000
```

Open your browser and navigate to the local portals:
* **Landing Gateway**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* **Portal Selector Selection**: [http://127.0.0.1:8000/login/](http://127.0.0.1:8000/login/)
* **Farmer Access Page (Coming Soon)**: [http://127.0.0.1:8000/login/farmer/](http://127.0.0.1:8000/login/farmer/)
* **Admin Access Portal**: [http://127.0.0.1:8000/login/admin/](http://127.0.0.1:8000/login/admin/) (Sign in using `admin@agrotrust.co` / `admin123` or Nagpur Coop Admin mock Google Auth)
* **Interactive Manager Workspace**: [http://127.0.0.1:8000/dashboard/](http://127.0.0.1:8000/dashboard/)
* **Built-in Django Admin Panel**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) (Sign in using superuser `admin` / `admin123`)

---

## 🔒 Security Design

- **Client-side EXIF stripping** — Crop image coordinate metadata is destroyed inside the browser canvas before the payload transits.
- **AES-256 encryption** — Sensitive payout bank details are encrypted on the client side prior to dispatch.
- **In-Memory only pipeline** — Byte streams are analyzed dynamically in RAM buffer segments and explicitly scrubbed by the garbage collector, satisfying zero-disk storage parameters.
- **Django CSRF safeguards** — Every AJAX fetch handshake validates secure CSRF session tokens in DOM elements.

---

## 📊 Trust Score Algorithm

The transparent verification and automated settlement score is computed dynamically:

```
S = Q · w₁ + C · w₂

Where:
  Q = Crop quality score (0-100) calculated by YOLOv8 crop detections
  C = EasyOCR character recognition average confidence (0-100)
  w₁ = 0.6 (Crop quality weight)
  w₂ = 0.4 (Invoice confidence weight)
  
  Benchmark Threshold: S ≥ 70.0 → Payment eligible for instant disbursement
```

---

## 🏆 UN SDG Alignment

| Goal | Target | AgroTrust AI Contribution |
|-----|--------|--------------------------|
| **SDG 1** | No Poverty | Instant payment settlements eliminate delay traps, protecting smallholder growers. |
| **SDG 2** | Zero Hunger | Objective AI-driven quality grading motivates fair grower value and supports local crops. |

---

## 📁 Project Structure

```
AgroTrust-AI/
├── agrotrust_django/      # Unified Django Full-Stack Web Application
│   ├── agrotrust_django/  # Core project settings and URL configurations
│   ├── core/              # Views, preloaded YOLOv8 + EasyOCR models, and auth guards
│   ├── static/            # Stylesheets, preloaded crop/invoice demo samples
│   ├── templates/         # Warm-cream pages, dark switcher navbar, selection, and portals
│   ├── db.sqlite3         # SQLite3 local database
│   └── manage.py          # Django management execution script
├── venv/                  # Python virtual environment
├── DESIGN.md              # Premium brand style guideline
└── README.md              # This technical documentation manual
```

---

*Built for Hackathon 2026 — Pillars: Unified Web Platform, Preloaded Custom AI, Security & Privacy*
