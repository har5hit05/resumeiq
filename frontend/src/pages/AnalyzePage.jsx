/**
 * pages/AnalyzePage.jsx
 * File upload zone + optional job description textarea.
 * Calls the backend /api/analyze-resume endpoint.
 */

import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { validateFile } from "../services/fileParser.js";
import { analyzeResume  } from "../services/api.js";
import { StepBar, Spinner, Icons, Button } from "../components/UI.jsx";

export default function AnalyzePage() {
  const navigate = useNavigate();

  const [file,       setFile]      = useState(null);
  const [jobDesc,    setJobDesc]   = useState("");
  const [dragging,   setDragging]  = useState(false);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState("");
  const inputRef = useRef();

  // ── File validation ──────────────────────────────────────────
  const acceptFile = (f) => {
    try {
      validateFile(f);
      setFile(f);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) acceptFile(e.dataTransfer.files[0]);
  }, []);

  // ── Submit ───────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) return setError("Please upload a resume file first.");
    setError("");
    setLoading(true);
    try {
      // jobDesc is empty string when user leaves textarea blank → general mode
      const result = await analyzeResume(file, jobDesc);
      // Pass result via router state to ResultsPage
      navigate("/results", { state: { analysis: result } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const hasJD   = Boolean(jobDesc.trim());
  const modeLabel = hasJD ? "Targeted Mode" : "General Mode";

  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 64 }}>
      <StepBar activeIdx={0}/>

      {/* Page header */}
      <div className="animate-fadeUp" style={{ marginBottom: 36 }}>
        <h1 className="font-display" style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Upload Your Resume
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14.5 }}>
          Supports PDF, DOCX, DOC, TXT · Max 10 MB
        </p>
      </div>

      {/* Two-column form */}
      <div className="two-col animate-fadeUp delay-1"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

        {/* ── Left: Resume file ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="section-label">Resume File</div>

          <div
            className={`upload-zone${dragging ? " drag" : ""}${file ? " filled" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: "none" }}
              onChange={(e) => e.target.files[0] && acceptFile(e.target.files[0])}
            />

            {file ? (
              <>
                <Icons.FileDoc/>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--green)", marginBottom: 4, wordBreak: "break-all" }}>
                    {file.name}
                  </p>
                  <p className="font-mono" style={{ fontSize: 11, color: "var(--faint)" }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="danger" size="sm"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setError(""); }}
                >
                  <Icons.X size={12}/> Remove
                </Button>
              </>
            ) : (
              <>
                <Icons.Upload/>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop your resume here</p>
                  <p style={{ fontSize: 13, color: "var(--faint)" }}>
                    or <span style={{ color: "var(--gold)", textDecoration: "underline", cursor: "pointer" }}>
                      browse files
                    </span>
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {["PDF","DOCX","DOC","TXT"].map(t => (
                    <span key={t} className="tag tag-gold">{t}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: Job Description (OPTIONAL) ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/*
           * OPTIONAL label — clearly communicates to the user
           * that leaving this blank triggers "general mode".
           */}
          <div className="section-label" style={{ alignItems: "center" }}>
            Job Description
            <span className="opt-badge">Optional</span>
          </div>

          <textarea
            rows={12}
            placeholder={
              "Paste the job description here for a targeted keyword analysis.\n\n" +
              "If you leave this blank, your resume will be analyzed against general ATS best practices instead.\n\n" +
              "Both modes provide a full score, breakdown, strengths, weaknesses, and suggestions."
            }
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            style={{ flex: 1 }}
          />

          {/* Dynamic hint explaining the current mode */}
          <p className="font-mono" style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.6 }}>
            {hasJD
              ? `✓ Job description provided (${jobDesc.length} chars) — analysis will be keyword-targeted.`
              : "ℹ No job description — analysis will use general ATS best practices."}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && <div className="error-box" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      {/* Analyze CTA */}
      <Button
        size="lg" fullWidth disabled={loading || !file}
        onClick={handleAnalyze}
      >
        {loading ? (
          <><Spinner size={18} color="#09090b"/> Analyzing with Gemini…</>
        ) : (
          <><Icons.Sparkle size={17}/> Analyze Resume ({modeLabel})</>
        )}
      </Button>
    </div>
  );
}
