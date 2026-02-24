"""
ResumeIQ — FastAPI Backend
============================
Entry point. Wires up middleware, routers, and DB lifecycle.

Start locally:
    uvicorn main:app --reload --port 8000
"""

import os
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from routes.analyze import router as analyze_router
from routes.enhance import router as enhance_router
from routes.health  import router as health_router

# ── Load .env ──────────────────────────────────────────────────────
load_dotenv(Path(__file__).parent / ".env")

# ── Logging ────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── FastAPI app ────────────────────────────────────────────────────
app = FastAPI(
    title="ResumeIQ API",
    description="AI-powered resume ATS analysis and enhancement",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────
# In production set CORS_ORIGINS in .env, e.g.:
#   CORS_ORIGINS=https://your-frontend.vercel.app
raw_origins = os.getenv("https://resumeiq-backend-gvj0.onrender.com", "http://localhost:5173,http://localhost:3000")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MongoDB lifecycle ──────────────────────────────────────────────
@app.on_event("startup")
async def startup_db():
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name   = os.getenv("DB_NAME",   "resumeiq")
    app.state.mongo  = AsyncIOMotorClient(mongo_url)
    app.state.db     = app.state.mongo[db_name]
    logger.info("MongoDB connected → %s / %s", mongo_url, db_name)

@app.on_event("shutdown")
async def shutdown_db():
    app.state.mongo.close()
    logger.info("MongoDB connection closed")

# ── Routers ────────────────────────────────────────────────────────
app.include_router(health_router,  prefix="/api")
app.include_router(analyze_router, prefix="/api")
app.include_router(enhance_router, prefix="/api")
