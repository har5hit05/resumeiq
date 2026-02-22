"""
FileParserService
-----------------
Extracts plain text from resume files entirely in-memory.
Supported: PDF, DOCX, DOC, TXT

Dependencies (see requirements.txt):
  PyPDF2, python-docx
"""

import io
import logging
from pathlib import Path

import PyPDF2
from docx import Document

logger = logging.getLogger(__name__)

# Allowed file extensions
ALLOWED = {".pdf", ".docx", ".doc", ".txt"}


class FileParserService:

    async def extract_text(self, file_bytes: bytes, filename: str) -> str:
        """
        Extract plain text from the uploaded file bytes.

        Args:
            file_bytes: raw bytes of the uploaded file
            filename:   original filename (used to detect format)

        Returns:
            Extracted text as a single string.

        Raises:
            ValueError: unsupported extension or extraction failure
        """
        ext = Path(filename).suffix.lower()

        if ext not in ALLOWED:
            raise ValueError(
                f'Unsupported format "{ext}". '
                f"Please upload a PDF, DOCX, DOC, or TXT file."
            )

        try:
            if ext == ".pdf":
                return self._from_pdf(file_bytes)
            elif ext in (".docx", ".doc"):
                return self._from_docx(file_bytes)
            elif ext == ".txt":
                return self._from_txt(file_bytes)
        except Exception as e:
            logger.error("Parse error for %s: %s", filename, e)
            raise ValueError(f"Could not parse file: {e}") from e

        return ""   # unreachable, keeps linters happy

    # ── Internal helpers ──────────────────────────────────────────

    @staticmethod
    def _from_pdf(data: bytes) -> str:
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        pages  = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n".join(pages).strip()

    @staticmethod
    def _from_docx(data: bytes) -> str:
        doc   = Document(io.BytesIO(data))
        lines = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(lines).strip()

    @staticmethod
    def _from_txt(data: bytes) -> str:
        # Try UTF-8, fall back to latin-1
        try:
            return data.decode("utf-8").strip()
        except UnicodeDecodeError:
            return data.decode("latin-1").strip()
