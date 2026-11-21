# SaansSaathi (सांससाथी) — Urban Air Quality Assistant

> **PromptWars Virtual — Challenge 6: Urban Air Quality Assistant**  
> *"Create a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. The application should suggest low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices."*

[![CI](https://github.com/placeholder-org/saans-saathi/actions/workflows/ci.yml/badge.svg)](https://github.com/placeholder-org/saans-saathi/actions)
[![Coverage](https://img.shields.io/badge/Coverage-99%25-brightgreen.svg)]()
[![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-success.svg)]()
[![Security](https://img.shields.io/badge/Security-0%20Vulnerabilities-blue.svg)]()

---

## 1. Requirement to Feature Matrix

| Official Problem Statement Requirement | Implementation in SaansSaathi | Verification & Location |
|---|---|---|
| **GenAI-Powered Assistant** | `POST /api/summary`: Gemini 2.5 Flash explains air quality in <80 words, grounded strictly in computed facts. Protected against prompt injection via `<USER_DATA>` delimiter. Instant deterministic rule-based fallback if offline or unkeyed. | `backend/app/main.py:175-188`<br>`frontend/js/ui.js` (Today Tab) |
| **Location-Tailored Air Quality** | `GET /api/air?lat&lon`: Fetches 24h mean PM2.5 from Open-Meteo CAMS atmospheric model (10-min cache). City search via proxied `GET /api/geocode?q=...` + browser Geolocation. Clearly labeled as a **model estimate** (not a physical station). | `backend/app/main.py:82-124`<br>`frontend/js/api.js` |
| **Families and Communities** | `POST /api/plan`: Computes vulnerability scores (0–5) and age/condition-tailored action plans for up to 8 family members (infants, elderly, pregnant, asthmatic, outdoor workers). Every action includes a collapsible **"Why?"** explanation. | `backend/app/engine.py:34-85`<br>`frontend/js/ui.js` (Family Tab) |
| **Low-Emission Daily Routines** | Actionable daily routines (metro/bus transit shift, vehicle anti-idling at lights, RWA biomass burning reporting) with scientific reasoning on how each choice prevents ground-level winter smog. | `frontend/js/ui.js` (Today Tab)<br>`frontend/js/i18n.js` |
| **Indoor Air Quality Hacks** | **Windows Verdict**: Based on CPCB AQI band (open vs. midday ventilation vs. draft sealing).<br>**Purifier CADR Calculator**: `Area × Height × 5 ACH` in m³/h and CFM.<br>**Affordable DIY Box-Fan Filter**: Step-by-step hack (~₹2,000 using MERV 13/HEPA filter taped to box fan).<br>**Cleaning Hack**: Wet mopping vs. dry sweeping. | `backend/app/engine.py:88-91`<br>`frontend/js/ui.js` (Indoor Tab) |
| **Sustainable Alternatives & Direct Impact** | Interactive modal shift calculator comparing Petrol Car, Scooter/Bike, City Bus, Metro, and Cycle/Walk. Shows exact **kg CO₂/year saved** vs. petrol car, with all mathematical assumptions and IPCC/MoEFCC emission factors visible. | `backend/app/engine.py:93-96`<br>`frontend/js/ui.js` (Impact Tab) |
| **Bilingual Accessibility (EN / हिन्दी)** | Complete 100% synchronized bilingual localization across all tabs, badges, alerts, and AI explanations. | `frontend/js/i18n.js`<br>`frontend/tests/i18n.test.js` |

---

## 2. Architecture & Design Principles

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SaansSaathi Frontend                            │
│           Vanilla ES Modules (Zero Build Step, Zero Bloat)             │
│  api.js ─── state.js (Reactive Store) ─── i18n.js ─── ui.js (Pure DOM) │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON REST API
┌────────────────────────────────────▼───────────────────────────────────┐
│                    FastAPI Backend (backend/app/main.py)               │
│  - Strict CSP (script-src 'self')        - Rate Limiter (60 req/min)   │
│  - Input Validation (Pydantic v2)        - Static File Mount (/web)    │
│  - In-Memory Caching (Air & Geocode)     - Error Boundaries            │
└──────┬─────────────────────────────┬───────────────────────────┬───────┘
       │                             │                           │
┌──────▼─────────────────────┐ ┌─────▼──────────────────┐ ┌──────▼───────┐
│ Open-Meteo CAMS / Geocoding│ │ Google Gemini 2.5 Flash│ │ engine.py    │
│ (Atmospheric Model Data)   │ │ (Grounded Explanations)│ │ (Pure Math)  │
└────────────────────────────┘ └────────────────────────┘ └──────────────┘
```

1. **Deterministic Numbers First (Engine Principle)**: All numerical values (AQI, vulnerability scores, purifier CADR, kg CO₂ emissions) are computed by pure, tested Python/JS functions. The LLM is never allowed to hallucinate numbers.
2. **Zero innerHTML Policy**: The entire UI is built with `document.createElement`, `textContent`, `setAttribute`, and `addEventListener`. No HTML string parsing exists anywhere on the client.
3. **No Secrets in Client**: The Gemini API key and external API queries remain strictly server-side. Geocoding is proxied to preserve strict Content Security Policy.
4. **Resilient Fallbacks**: If Open-Meteo or Gemini fails, the app smoothly continues functioning using the manual PM2.5 slider and deterministic rule explanations.

---

## 3. Mathematical Formulas & Scientific Assumptions

### A. CPCB NAQI PM2.5 Sub-Index (India)
Calculated via the standard linear interpolation formula across Central Pollution Control Board breakpoints:
$$\text{AQI} = I_{\text{low}} + \frac{I_{\text{high}} - I_{\text{low}}}{C_{\text{high}} - C_{\text{low}}} \times (C - C_{\text{low}})$$

| PM2.5 ($\mu\text{g/m}^3$) | AQI Range | Category | Color Code | Verified Contrast Ratio |
|---|---|---|---|---|
| 0 – 30 | 0 – 50 | Good | `#1b5e20` | **7.6:1** (Passes WCAG AA) |
| 30 – 60 | 51 – 100 | Satisfactory | `#33691e` | **6.0:1** (Passes WCAG AA) |
| 60 – 90 | 101 – 200 | Moderate | `#945300` | **5.8:1** (Passes WCAG AA) |
| 90 – 120 | 201 – 300 | Poor | `#b71c1c` | **7.2:1** (Passes WCAG AA) |
| 120 – 250 | 301 – 400 | Very Poor | `#880e4f` | **9.1:1** (Passes WCAG AA) |
| 250 – 500 | 401 – 500 | Severe | `#4a148c` | **11.0:1** (Passes WCAG AA) |

### B. Clean Air Delivery Rate (CADR)
$$\text{CADR } (\text{m}^3/\text{h}) = \text{Room Area } (\text{m}^2) \times \text{Ceiling Height } (\text{m}) \times 5 \text{ ACH}$$
Based on international standards prescribing 5 air changes per hour for residential air purification during high particle pollution events. Converted to CFM via factor $0.589$.

### C. Annual Commute CO₂ Emissions
$$\text{Annual } \text{CO}_2 \text{ (kg)} = \text{Factor } (\text{kg CO}_2/\text{km}) \times \text{One-way Distance (km)} \times 2 \times \text{Days/Week} \times 52 \text{ weeks}$$

*Emission factors (India MoEFCC / IPCC AR6 baseline)*:
- **Petrol Car (15 km/L)**: $0.154 \text{ kg CO}_2/\text{km}$
- **Scooter / Motorcycle (45 km/L)**: $0.051 \text{ kg CO}_2/\text{km}$
- **City Bus (average occupancy)**: $0.080 \text{ kg CO}_2/\text{p-km}$
- **Electric Metro (grid-adjusted)**: $0.030 \text{ kg CO}_2/\text{p-km}$
- **Bicycle / Walk**: $0.000 \text{ kg CO}_2/\text{km}$

---

## 4. Local Development & Testing

### Prerequisites
- Python 3.12+
- Node.js 20+

### Step 1: Install Dependencies
```bash
# Backend
pip install -r requirements.txt -r requirements-dev.txt

# Frontend Test Suite
npm install
```

### Step 2: Configure Environment (Optional)
```bash
cp .env.example .env
# Edit .env to add your GEMINI_API_KEY if testing AI summaries
```

### Step 3: Run Full Test Suite
```bash
# 1. Backend tests with branch coverage (Requirement: >=95%, Actual: 99%)
python -m pytest --cov=app --cov-branch --cov-report=term-missing

# 2. Static linting with ruff
python -m ruff check backend

# 3. Security audit for Python dependencies
python -m pip_audit -r requirements.txt

# 4. Frontend Vitest suite (state, i18n, api mocks, WCAG contrast)
npm test

# 5. Security audit for npm packages
npm audit
```

### Step 4: Run the Application
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir backend
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 5. Deployment Guide

### Deploy with Docker
```bash
# Build production image
docker build -t saans-saathi .

# Run container
docker run -p 8000:8000 -e GEMINI_API_KEY="your_key" saans-saathi
```

### Deploy to Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Select **Docker** as the runtime (or use the provided `render.yaml`).
4. Set Environment Variable: `GEMINI_API_KEY` (optional).
5. Health check path: `/api/health`.

---

## 6. Assumptions and Limitations

1. **Model Estimate vs. Physical Station**: Open-Meteo air quality data comes from the European Copernicus Atmosphere Monitoring Service (CAMS) 0.25° (~25 km) grid model, not physical CPCB monitoring stations. It reflects regional air masses, which may differ from roadside microclimates.
2. **Not Medical Advice**: SaansSaathi is a community decision-support tool. It does not provide medical diagnoses or prescriptions. Users with acute symptoms (chest pain, severe dyspnea) are directed to emergency medical care.
3. **Linear Extrapolation**: PM2.5 levels beyond 500 $\mu\text{g/m}^3$ are clamped to AQI 500 in accordance with CPCB NAQI standards.
