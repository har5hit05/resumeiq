/**
 * pages/ResultsPage.jsx
 * Displays the AI analysis result and lets the user select which
 * improvements to apply before triggering the enhancement.
 */

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { enhanceResume } from "../services/api.js";
import {
  StepBar, ScoreRing, ProgressBar,
  Spinner, Icons, Button,
} from "../components/UI.jsx";

// Priority visual config
const PRIORITY_META = {
  high:   { cls: "selected-high",   tag: "tag-red",   label: "HIGH"  },
  medium: { cls: "selected-medium", tag: "tag-gold",  label: "MED"   },
  low:    { cls: "selected-low",    tag: "tag-blue",  label: "LOW"   },
};

// Map score → color key
const scoreColor = (v) => v >= 80 ? "green" : v >= 55 ? "gold" : "red";

export default function ResultsPage() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const analysis   = state?.analysis;

  // Redirect if arrived without data
  if (!analysis) {
    navigate("/analyze");
    return null;
  }

  // Pre-select all HIGH priority suggestions
  const [sel, setSel] = useState(() => {
    const init = {};
    (analysis.suggestions || []).forEach((s, i) => {
      if (s.priority === "high") init[i] = true;
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState("");

  const selectedCount = Object.values(sel).filter(Boolean).length;
  const toggleSel = (i) => setSel(prev => ({ ...prev, [i]: !prev[i] }));
  const selectAll = () => { const a = {}; (analysis.suggestions || []).forEach((_, i) => (a[i] = true)); setSel(a); };
  const clearAll  = () => setSel({});

  const handleEnhance = async () => {
    const chosen = (analysis.suggestions || []).filter((_, i) => sel[i]);
    if (!chosen.length) return;
    setLoading(true);
    setError("");
    try {
      const result = await enhanceResume(
        analysis.analysis_id,
        analysis.resume_text,
        analysis.job_description || "",
        chosen,
      );
      navigate("/enhanced", {
        state: {
          resumeText:          analysis.resume_text,
          enhancedText:        result.enhanced_text,
          appliedSuggestions:  chosen,
          analysisId:          analysis.analysis_id,
          jobDesc:             analysis.job_description || "",
        },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 64 }}>
      <StepBar activeIdx={1}/>

      {/* Analysis mode badge */}
      <div className="animate-fadeUp" style={{ marginBottom: 10 }}>
        <span className={`tag ${analysis.has_jd ? "tag-gold" : "tag-muted"}`}>
          {analysis.has_jd
            ? "🎯 Targeted analysis — matched against job description"
            : "📋 General analysis — ATS best practices"}
        </span>
      </div>

      {/* ── Score hero ── */}
      <div className="panel-gold animate-fadeUp"
        style={{ display: "flex", gap: 36, alignItems: "flex-start", padding: "28px 32px", marginBottom: 22, flexWrap: "wrap" }}>
        <ScoreRing score={analysis.ats_score}/>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Overall Assessment</div>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.72, marginBottom: 22 }}>
            {analysis.summary}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {(analysis.score_breakdown || []).map(item => (
              <div key={item.category}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{item.category}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "var(--faint)", fontStyle: "italic", textAlign: "right", maxWidth: 220 }}>
                      {item.comment}
                    </span>
                    <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                      {item.score}
                    </span>
                  </div>
                </div>
                <ProgressBar value={item.score} color={scoreColor(item.score)}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Strengths + Weaknesses ── */}
      <div className="two-col animate-fadeUp delay-1"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="panel" style={{ padding: "22px 26px" }}>
          <div className="section-label" style={{ color: "var(--green)" }}>✓ Strengths</div>
          {(analysis.strengths || []).map((s, i) => (
            <div key={i} className="list-row">
              <div className="list-dot" style={{ background: "var(--green)" }}/>
              {s}
            </div>
          ))}
        </div>
        <div className="panel" style={{ padding: "22px 26px" }}>
          <div className="section-label" style={{ color: "var(--red)" }}>✗ Areas to Improve</div>
          {(analysis.weaknesses || []).map((w, i) => (
            <div key={i} className="list-row">
              <div className="list-dot" style={{ background: "var(--red)" }}/>
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* ── Keyword analysis ── */}
      <div className="panel animate-fadeUp delay-2" style={{ padding: "22px 26px", marginBottom: 20 }}>
        <div className="section-label">
          {analysis.has_jd ? "Keyword Match Analysis" : "Keyword Richness"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {analysis.has_jd ? "JD keyword density" : "Keyword richness score"}
          </span>
          <span className="font-mono" style={{ fontSize: 13 }}>
            {analysis.keyword_analysis?.density_pct ?? 0}%
          </span>
        </div>
        <ProgressBar
          value={analysis.keyword_analysis?.density_pct ?? 0}
          color={scoreColor(analysis.keyword_analysis?.density_pct ?? 0)}
        />
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--green)", marginBottom: 10 }}>
              {analysis.has_jd ? "✓ Matched Keywords" : "✓ Present Keywords"}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(analysis.keyword_analysis?.matched || []).length > 0
                ? analysis.keyword_analysis.matched.map(k => <span key={k} className="tag tag-green">{k}</span>)
                : <span style={{ fontSize: 12, color: "var(--faint)" }}>None found</span>}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--red)", marginBottom: 10 }}>
              {analysis.has_jd ? "✗ Missing Keywords" : "✗ Recommended to Add"}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(analysis.keyword_analysis?.missing || []).length > 0
                ? analysis.keyword_analysis.missing.map(k => <span key={k} className="tag tag-red">{k}</span>)
                : <span style={{ fontSize: 12, color: "var(--faint)" }}>All covered ✓</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Improvement suggestions with checkboxes ── */}
      <div className="panel animate-fadeUp delay-3" style={{ padding: "22px 26px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 2 }}>Improvement Suggestions</div>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--faint)" }}>
              {selectedCount} of {analysis.suggestions?.length || 0} selected
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline" size="sm" onClick={selectAll}>All</Button>
            <Button variant="outline" size="sm" onClick={clearAll}>None</Button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {(analysis.suggestions || []).map((s, i) => {
            const meta = PRIORITY_META[s.priority] || PRIORITY_META.low;
            const isOn = !!sel[i];
            return (
              <label
                key={i}
                className={`suggestion-card${isOn ? ` ${meta.cls}` : ""}`}
                onClick={() => toggleSel(i)}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggleSel(i)}
                  onClick={e => e.stopPropagation()}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 5 }}>
                    <span className={`tag ${meta.tag}`}>{meta.label}</span>
                    <span className="tag tag-muted">{s.category}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.issue}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{s.fix}</p>
                  {s.example && (
                    <div style={{
                      marginTop: 8, padding: "7px 12px",
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: 6, fontFamily: "'DM Mono',monospace",
                      fontSize: 11.5, color: "var(--gold)", lineHeight: 1.5,
                    }}>
                      💡 {s.example}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && <div className="error-box" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      {/* Enhance CTA */}
      <Button
        size="lg" fullWidth
        disabled={loading || selectedCount === 0}
        onClick={handleEnhance}
      >
        {loading ? (
          <><Spinner size={18} color="#09090b"/> Rewriting resume…</>
        ) : (
          <><Icons.Sparkle size={17}/> Apply {selectedCount} Change{selectedCount !== 1 ? "s" : ""} & Enhance</>
        )}
      </Button>
      {selectedCount === 0 && (
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--faint)", marginTop: 10 }}>
          Select at least one suggestion above to enable enhancement.
        </p>
      )}
    </div>
  );
}
