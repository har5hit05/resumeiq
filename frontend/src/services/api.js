/**
 * api.js  —  centralised HTTP client
 *
 * All calls go through the `api` axios instance.
 * Base URL is read from VITE_API_BASE_URL env var.
 *   - Dev:  leave blank → Vite proxy forwards /api → localhost:8000
 *   - Prod: set to https://your-backend.onrender.com
 */

import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: BASE,
  timeout: 120_000,   // 2-min timeout for AI calls
});

// ── Response interceptor for global error normalisation ───────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Unexpected error — please try again.";
    return Promise.reject(new Error(msg));
  }
);

// ── API methods ───────────────────────────────────────────────────

/**
 * Analyse a resume.
 * @param {File}   file            — uploaded resume file
 * @param {string} jobDescription  — optional; empty string = general mode
 */
export async function analyzeResume(file, jobDescription = "") {
  const form = new FormData();
  form.append("resume_file",     file);
  form.append("job_description", jobDescription.trim());

  const { data } = await api.post("/api/analyze-resume", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Enhance a resume with selected suggestions.
 * @param {string}   analysisId    — returned by analyzeResume
 * @param {string}   resumeText    — original extracted text
 * @param {string}   jobDesc       — original JD (may be empty)
 * @param {object[]} suggestions   — array of selected suggestion objects
 */
export async function enhanceResume(analysisId, resumeText, jobDesc, suggestions) {
  const { data } = await api.post("/api/enhance-resume", {
    analysis_id:     analysisId,
    resume_text:     resumeText,
    job_description: jobDesc,
    suggestions,
  });
  return data;
}

/**
 * Download enhanced resume as DOCX.
 * Returns a Blob URL the caller can trigger a download from.
 * @param {string}   analysisId
 * @param {string}   enhancedText  — the rewritten resume text
 * @param {string}   jobDesc
 */
export async function downloadDocx(analysisId, enhancedText, jobDesc = "") {
  const resp = await api.post(
    "/api/generate-docx",
    {
      analysis_id:     analysisId,
      resume_text:     enhancedText,
      job_description: jobDesc,
      suggestions:     [],   // already applied; just generating file
    },
    { responseType: "blob" }
  );

  const blob = new Blob(
    [resp.data],
    { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
  );
  return URL.createObjectURL(blob);
}

export default api;
