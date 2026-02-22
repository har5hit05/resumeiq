"""
POST /api/analyze-resume
Accepts a multipart form with:
  - resume_file  : PDF / DOCX / DOC / TXT
  - job_description : string (optional — empty string = general mode)

Returns a full JSON analysis object and persists it to MongoDB.
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from services.file_parser  import FileParserService
from services.ats_analyzer import ATSAnalyzerService

logger  = logging.getLogger(__name__)
router  = APIRouter(tags=["Analysis"])
parser  = FileParserService()
analyzer= ATSAnalyzerService()


@router.post("/analyze-resume")
async def analyze_resume(
    request:          Request,
    resume_file:      UploadFile = File(...),
    job_description:  str        = Form(default=""),   # ← OPTIONAL: empty string OK
):
    """
    Analyse a resume against an optional job description.

    - With job_description → keyword-targeted ATS analysis
    - Without             → general ATS best-practices analysis
    """
    analysis_id = str(uuid.uuid4())

    # 1 ── Extract text from uploaded file ─────────────────────────
    try:
        file_bytes = await resume_file.read()
        resume_text = await parser.extract_text(
            file_bytes=file_bytes,
            filename=resume_file.filename or "resume",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("File parse error: %s", e)
        raise HTTPException(status_code=422, detail="Could not extract text from file.")

    if not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No text could be extracted. Try a different file format.",
        )

    # 2 ── AI analysis ─────────────────────────────────────────────
    has_jd = bool(job_description.strip())
    try:
        result = await analyzer.analyze(
            resume_text=resume_text,
            job_description=job_description.strip() if has_jd else "",
        )
    except Exception as e:
        logger.error("AI analysis error: %s", e)
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    # 3 ── Persist to MongoDB ───────────────────────────────────────
    doc = {
        "analysis_id":    analysis_id,
        "filename":        resume_file.filename,
        "has_jd":          has_jd,
        "resume_text":     resume_text,
        "job_description": job_description.strip(),
        "timestamp":       datetime.now(timezone.utc).isoformat(),
        **result,
    }
    try:
        await request.app.state.db.analyses.insert_one(doc)
    except Exception as e:
        logger.warning("MongoDB insert failed (non-fatal): %s", e)

    # 4 ── Return ───────────────────────────────────────────────────
    return {
        "success":     True,
        "analysis_id": analysis_id,
        "has_jd":      has_jd,
        "resume_text": resume_text,
        **result,
    }
