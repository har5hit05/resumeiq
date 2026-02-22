"""Health check endpoint — used by Render/Railway to verify the service is up."""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health():
    return {"status": "ok", "service": "ResumeIQ API"}
