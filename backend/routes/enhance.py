"""
POST /api/enhance-resume
Body (JSON):
  {
    "analysis_id"   : "uuid",
    "resume_text"   : "original resume plain text",
    "job_description": "optional JD text",
    "suggestions"   : [ { ...suggestion objects the user selected } ]
  }

Returns the AI-rewritten resume text and optionally generates
downloadable DOCX / TXT.
"""

import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Optional

from services.resume_enhancer import ResumeEnhancerService

logger   = logging.getLogger(__name__)
router   = APIRouter(tags=["Enhancement"])
enhancer = ResumeEnhancerService()


# ── Request / response schemas ─────────────────────────────────────

class Suggestion(BaseModel):
    id:        int
    category:  str
    priority:  str
    issue:     str
    fix:       str
    example:   Optional[str] = None


class EnhanceRequest(BaseModel):
    analysis_id:     str
    resume_text:     str
    job_description: str  = Field(default="")   # optional
    suggestions:     List[Suggestion]


# ── Route ──────────────────────────────────────────────────────────

@router.post("/enhance-resume")
async def enhance_resume(payload: EnhanceRequest, request: Request):
    """
    Rewrite the resume applying the user-selected suggestions.
    Persists the enhanced text back to the analysis document.
    """
    if not payload.suggestions:
        raise HTTPException(status_code=400, detail="No suggestions provided.")

    try:
        enhanced_text = await enhancer.enhance(
            resume_text=payload.resume_text,
            job_description=payload.job_description,
            suggestions=[s.model_dump() for s in payload.suggestions],
        )
    except Exception as e:
        logger.error("Enhancement error: %s", e)
        raise HTTPException(status_code=502, detail=f"AI enhancement failed: {e}")

    # Update MongoDB record
    try:
        await request.app.state.db.analyses.update_one(
            {"analysis_id": payload.analysis_id},
            {"$set": {"enhanced_text": enhanced_text}},
        )
    except Exception as e:
        logger.warning("MongoDB update failed (non-fatal): %s", e)

    return {
        "success":       True,
        "enhanced_text": enhanced_text,
    }


@router.post("/generate-docx")
async def generate_docx(payload: EnhanceRequest, request: Request):
    """
    Generate and stream back a DOCX file of the (already-enhanced) resume.
    The frontend sends enhanced_text inside resume_text for this endpoint.
    """
    from fastapi.responses import StreamingResponse
    import io

    try:
        docx_bytes = await enhancer.to_docx(payload.resume_text)
    except Exception as e:
        logger.error("DOCX generation error: %s", e)
        raise HTTPException(status_code=500, detail="DOCX generation failed.")

    filename = f"enhanced_resume_{payload.analysis_id[:8]}.docx"
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
