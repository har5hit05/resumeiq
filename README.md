# ResumeIQ — AI-Powered ATS Resume Analyzer & Enhancer

> **Live Demo:** [your-app.vercel.app](https://your-app.vercel.app) &nbsp;|&nbsp;
> **API Docs:** [your-backend.onrender.com/docs](https://your-backend.onrender.com/docs)

An end-to-end web application that analyses resumes for ATS (Applicant Tracking System) compatibility, provides a detailed score breakdown, and uses AI to rewrite the resume with targeted improvements — all downloadable as DOCX or TXT.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **Multi-format upload** | PDF, DOCX, DOC, TXT — parsed server-side |
| **ATS Score (0–100)** | Six-dimension breakdown with per-category comments |
| **Targeted or General mode** | Paste a job description for keyword-matched analysis, or leave blank for general ATS best practices |
| **Keyword analysis** | Matched keywords, missing keywords, density percentage |
| **Improvement suggestions** | 10–12 prioritised (HIGH/MED/LOW) with actionable fixes and examples |
| **Checkbox confirmation** | User selects exactly which improvements to apply |
| **AI Enhancement** | Gemini rewrites the resume applying selected changes only |
| **Side-by-side diff** | Review original vs enhanced before downloading |
| **Download** | DOCX (python-docx) or TXT — no watermarks |
| **MongoDB persistence** | All analyses stored for future history feature |

---

## 🏗 Architecture

```
resumeiq/
├── backend/                 # FastAPI (Python)
│   ├── main.py              # App entry point, CORS, DB lifecycle
│   ├── routes/
│   │   ├── analyze.py       # POST /api/analyze-resume
│   │   ├── enhance.py       # POST /api/enhance-resume, /api/generate-docx
│   │   └── health.py        # GET  /api/health
│   ├── services/
│   │   ├── file_parser.py   # PyPDF2 + python-docx text extraction
│   │   ├── ats_analyzer.py  # Gemini API → structured JSON analysis
│   │   └── resume_enhancer.py  # Gemini API → rewritten text + DOCX gen
│   ├── requirements.txt
│   ├── render.yaml          # Render.com deployment config
│   └── .env.example
│
└── frontend/                # React + Vite
    ├── src/
    │   ├── main.jsx          # Entry point
    │   ├── App.jsx           # Router
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── AnalyzePage.jsx   # Upload + optional JD
    │   │   ├── ResultsPage.jsx   # Score, breakdown, suggestions
    │   │   └── EnhancedPage.jsx  # Diff, confirm modal, download
    │   ├── components/
    │   │   └── UI.jsx        # Shared components (ScoreRing, StepBar, etc.)
    │   ├── services/
    │   │   ├── api.js        # axios client for all backend calls
    │   │   └── fileParser.js # Client-side PDF.js + mammoth parsing
    │   └── styles/
    │       └── global.css    # Full design system (tokens, panels, etc.)
    ├── vercel.json           # Vercel SPA routing config
    └── .env.example
```

---

## 🚀 Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or [Atlas free tier](https://www.mongodb.com/cloud/atlas))
- Google Gemini API key — **free** at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/resumeiq.git
cd resumeiq
```

### 2. Backend setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — fill in GEMINI_API_KEY, MONGO_URL, DB_NAME, CORS_ORIGINS

uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### 3. Frontend setup
```bash
cd ../frontend
npm install

cp .env.example .env
# For local dev, leave VITE_API_BASE_URL blank — Vite proxy handles it

npm run dev
# App: http://localhost:5173
```

---

## ☁️ Deployment

### Backend → Render.com (free tier)

1. Push your code to GitHub.
2. Go to [render.com](https://render.com) → New → Web Service → connect repo.
3. Set **Root Directory** to `backend`.
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables in the Render dashboard:
   - `GEMINI_API_KEY` — your key
   - `MONGO_URL` — MongoDB Atlas connection string
   - `DB_NAME` — `resumeiq`
   - `CORS_ORIGINS` — `https://your-frontend.vercel.app`
7. Deploy. Your backend URL will be `https://resumeiq-backend.onrender.com`.

> **Note:** Render free tier spins down after 15 min of inactivity. First request after sleep takes ~30s. Upgrade to Starter ($7/mo) for always-on.

### Frontend → Vercel (free tier)

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub.
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `VITE_API_BASE_URL` = `https://resumeiq-backend.onrender.com`
4. Deploy. Done.

### MongoDB → Atlas (free tier)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a database user with read/write access.
3. Whitelist all IPs (`0.0.0.0/0`) for Render compatibility.
4. Copy the connection string into `MONGO_URL`.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `MONGO_URL` | ✅ | MongoDB connection string |
| `DB_NAME` | ✅ | Database name (e.g. `resumeiq`) |
| `CORS_ORIGINS` | ✅ | Comma-separated frontend origins |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ prod | Backend base URL (blank = Vite proxy in dev) |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Vite |
| Styling | Custom CSS design system (no Tailwind) |
| File parsing (client) | mammoth (DOCX), PDF.js CDN (PDF) |
| Backend | FastAPI, Uvicorn |
| File parsing (server) | PyPDF2, python-docx |
| AI | Google Gemini 2.0 Flash (free tier) |
| Database | MongoDB via Motor (async) |
| HTTP client | httpx (backend), axios (frontend) |
| Deployment | Render (backend), Vercel (frontend), MongoDB Atlas (DB) |

---

## 📁 API Reference

### `POST /api/analyze-resume`
Multipart form upload.
| Field | Type | Required |
|-------|------|----------|
| `resume_file` | File | ✅ |
| `job_description` | string | ❌ (empty = general mode) |

Returns full analysis JSON with `ats_score`, `summary`, `score_breakdown`, `strengths`, `weaknesses`, `keyword_analysis`, `suggestions`.

### `POST /api/enhance-resume`
JSON body.
| Field | Type |
|-------|------|
| `analysis_id` | string |
| `resume_text` | string |
| `job_description` | string |
| `suggestions` | array of selected suggestion objects |

Returns `{ enhanced_text: string }`.

### `POST /api/generate-docx`
Same body as enhance. Returns a streaming DOCX file download.

### `GET /api/health`
Returns `{ status: "ok" }`. Used by Render health checks.

---

## 📄 License

MIT — free to use, modify, and deploy.

---

## 🙋 About

Built as a full-stack portfolio project demonstrating:
- FastAPI REST API with async MongoDB (Motor)
- Google Gemini AI integration (structured JSON + free-text generation)
- React SPA with client-side file parsing
- Multi-environment deployment (Render + Vercel + Atlas)
- Clean separation of concerns across services
