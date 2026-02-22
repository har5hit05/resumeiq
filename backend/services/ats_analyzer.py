"""
ATSAnalyzerService
------------------
Calls OpenAI API to produce a detailed structured JSON analysis of a resume.

Env vars required:
  OPENAI_API_KEY  — from https://platform.openai.com/api-keys
"""

import json
import logging
import os
import re

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

OPENAI_MODEL    = "gpt-4o-mini"
OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions"


class ATSAnalyzerService:

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        if not self.api_key:
            logger.warning("OPENAI_API_KEY is not set — analysis calls will fail.")

    async def analyze(self, resume_text: str, job_description: str) -> dict:
        has_jd = bool(job_description.strip())
        system = self._system_prompt(has_jd)
        user   = self._user_prompt(resume_text, job_description, has_jd)
        raw    = await self._call_openai(system, user)
        return self._parse_json(raw)

    # ── Prompt builders ───────────────────────────────────────────

    @staticmethod
    def _system_prompt(has_jd: bool) -> str:
        mode = (
            "against the provided job description (keyword-targeted mode). "
            "Focus heavily on keyword match rate, skill alignment, and how well "
            "the candidate's experience maps to the role requirements."
            if has_jd else
            "using general ATS best practices and industry standards. "
            "Focus on keyword density, formatting compliance, quantified achievements, "
            "action verb quality, and overall ATS readability."
        )
        return (
            "You are a senior ATS (Applicant Tracking System) specialist with 15+ years "
            "of experience as a certified professional resume writer and HR consultant. "
            "You have deep knowledge of how ATS systems like Workday, Taleo, Greenhouse, "
            "Lever, and iCIMS parse and score resumes. "
            f"Evaluate the resume {mode} "
            "Be thorough, specific, and brutally honest in your assessment. "
            "Your feedback should be detailed enough that the candidate knows EXACTLY "
            "what to fix and why it matters for ATS scoring. "
            "Return ONLY valid JSON — absolutely no markdown fences, no commentary, "
            "no explanatory text outside the JSON object. The response must be "
            "parseable by json.loads() directly."
        )

    @staticmethod
    def _user_prompt(resume_text: str, job_description: str, has_jd: bool) -> str:
        jd_block = (
            f"JOB DESCRIPTION TO MATCH AGAINST:\n"
            f"{'='*50}\n"
            f"{job_description}\n"
            f"{'='*50}\n\n"
            if has_jd else ""
        )

        kw_schema = (
            """
    "keyword_analysis": {
      "matched": [
        "<exact keyword or phrase from JD that appears in resume — list all matches>"
      ],
      "missing": [
        "<important keyword/skill/phrase from JD completely absent from resume>"
      ],
      "density_pct": <integer 0-100 representing what % of critical JD keywords appear in resume>,
      "notes": "<1-2 sentences explaining the keyword match situation and its ATS impact>"
    },"""
            if has_jd else
            """
    "keyword_analysis": {
      "matched": [
        "<strong action verbs, technical skills, and industry keywords already present>"
      ],
      "missing": [
        "<commonly expected keywords for this professional field that are absent>"
      ],
      "density_pct": <integer 0-100 representing keyword richness vs industry standard for this field>,
      "notes": "<1-2 sentences on overall keyword strategy and what areas need improvement>"
    },"""
        )

        sug_focus = (
            "For each suggestion, be very specific about which keywords are missing, "
            "which job requirements aren't addressed, and exactly what text to add or change."
            if has_jd else
            "For each suggestion, focus on universal ATS improvements: adding missing keywords, "
            "fixing formatting issues, quantifying achievements, and strengthening action verbs."
        )

        return f"""{jd_block}RESUME TO ANALYZE:
{'='*50}
{resume_text}
{'='*50}

Perform a comprehensive ATS analysis and return ONLY this exact JSON structure
(replace all placeholder text with real analysis — be specific and detailed):

{{
  "ats_score": <integer 0-100 — honest score reflecting real ATS pass likelihood. 
                Below 50 = likely rejected by ATS. 50-70 = borderline. 
                70-85 = good chance. 85+ = excellent ATS optimization>,

  "summary": "<Write 3-4 detailed sentences covering: (1) overall ATS compatibility, 
               (2) the biggest strength of this resume, (3) the most critical weakness 
               holding back the score, (4) overall recommendation. Be specific — 
               mention actual content from the resume.>",

  "score_breakdown": [
    {{
      "category": "Keywords & Terms",
      "score": <0-100>,
      "comment": "<specific observation about keyword usage — mention actual keywords 
                  present or missing, not generic feedback>"
    }},
    {{
      "category": "Formatting & Structure",
      "score": <0-100>,
      "comment": "<specific observation about ATS-friendliness of formatting — 
                  mention specific sections, headers, or formatting issues found>"
    }},
    {{
      "category": "Work Experience",
      "score": <0-100>,
      "comment": "<specific observation about how experience is presented — 
                  mention actual job titles, companies, or bullet point quality>"
    }},
    {{
      "category": "Skills Alignment",
      "score": <0-100>,
      "comment": "<specific observation about skills section — mention actual 
                  skills present or gaps identified>"
    }},
    {{
      "category": "Achievements & Impact",
      "score": <0-100>,
      "comment": "<specific observation about quantified achievements — mention 
                  actual metrics present or missing, e.g. percentages, numbers>"
    }},
    {{
      "category": "Education & Certs",
      "score": <0-100>,
      "comment": "<specific observation about education section completeness 
                  and relevant certifications>"
    }}
  ],

  "strengths": [
    "<strength 1 — specific and detailed, referencing actual resume content>",
    "<strength 2 — specific and detailed, referencing actual resume content>",
    "<strength 3 — specific and detailed, referencing actual resume content>"
  ],

  "weaknesses": [
    "<weakness 1 — specific and detailed, explaining the ATS impact>",
    "<weakness 2 — specific and detailed, explaining the ATS impact>",
    "<weakness 3 — specific and detailed, explaining the ATS impact>"
  ],
{kw_schema}

  "suggestions": [
    {{
      "id": <integer starting at 1>,
      "category": "<one of: Keywords | Formatting | Experience | Skills | Achievements | Education>",
      "priority": "<high | medium | low>",
      "issue": "<concise problem title — max 8 words>",
      "fix": "<detailed, actionable fix in 2-3 sentences. Be SPECIFIC — tell them 
              exactly what to write, add, or change. Not just 'add keywords' but 
              'Add these specific skills to your Skills section: X, Y, Z'>",
      "example": "<concrete before → after example showing exactly how to improve 
                  a specific bullet point, section, or phrase from their resume>"
    }}
  ]
}}

CRITICAL RULES:
1. ats_score must be brutally honest — most resumes score 40-70, reserve 80+ for truly optimized resumes.
2. Provide EXACTLY 10-12 suggestions. Sort them: all HIGH priority first, then MEDIUM, then LOW.
3. Every suggestion must reference SPECIFIC content from this resume — no generic advice.
4. The "example" field must show a real before/after using actual text from the resume.
5. {sug_focus}
6. Score each category independently and honestly — not every category needs to be high."""

    # ── OpenAI HTTP call ──────────────────────────────────────────

    async def _call_openai(self, system_instruction: str, user_prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type":  "application/json",
        }
        body = {
            "model":    OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user",   "content": user_prompt},
            ],
            "temperature":     0.3,
            "max_tokens":      4096,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(OPENAI_BASE_URL, headers=headers, json=body)
            if resp.status_code != 200:
                detail = resp.json().get("error", {}).get("message", resp.text)
                raise RuntimeError(f"OpenAI API {resp.status_code}: {detail}")
            data = resp.json()
        return data["choices"][0]["message"]["content"].strip()

    # ── JSON parser ───────────────────────────────────────────────

    @staticmethod
    def _parse_json(raw: str) -> dict:
        clean = re.sub(r"^```json\s*", "", raw.strip(), flags=re.IGNORECASE)
        clean = re.sub(r"^```\s*",     "", clean,       flags=re.IGNORECASE)
        clean = re.sub(r"\s*```$",     "", clean).strip()
        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", clean)
            if match:
                return json.loads(match.group(0))
            raise ValueError("Could not parse JSON from AI response.")
