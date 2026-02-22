/**
 * pages/EnhancedPage.jsx
 * Side-by-side diff, confirmation modal, DOCX + TXT download.
 */

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { downloadDocx } from "../services/api.js";
import {
  StepBar, Spinner, Icons, Button,
} from "../components/UI.jsx";

// ── Confirmation Modal ─────────────────────────────────────────────
function ConfirmModal({ original, enhanced, applied, analysisId, jobDesc, onClose }) {
  const [tab,         setTab]         = useState("enhanced");
  const [downloading, setDownloading] = useState(false);
  const [downloaded,  setDownloaded]  = useState(false);

  const doDownloadTxt = () => {
    const blob = new Blob([enhanced], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `resume_enhanced_${analysisId?.slice(0,8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const doDownloadDocx = async () => {
    setDownloading(true);
    try {
      const url = await downloadDocx(analysisId, enhanced, jobDesc);
      const a   = document.createElement("a");
      a.href    = url;
      a.download= `resume_enhanced_${analysisId?.slice(0,8)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (e) {
      alert("DOCX download failed: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box animate-slideUp">
        <div className="modal-head">
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Review Enhanced Resume
          </h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
            {applied.length} improvement{applied.length !== 1 ? "s" : ""} applied.
            Review across all tabs, then download your preferred format.
          </p>
          <div className="tab-list">
            {["enhanced","original","changes"].map(t => (
              <button
                key={t}
                className={`tab-btn${tab === t ? " active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t === "enhanced" ? "Enhanced" : t === "original" ? "Original" : `Changes (${applied.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-body">
          {tab === "enhanced" && <div className="resume-preview">{enhanced}</div>}
          {tab === "original" && <div className="resume-preview">{original}</div>}
          {tab === "changes"  && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {applied.map((s, i) => (
                <div key={i} className="panel" style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 5 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: s.priority === "high" ? "var(--red)" : s.priority === "medium" ? "var(--gold)" : "var(--blue)",
                    }}/>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.issue}</span>
                    <span className="tag tag-muted" style={{ marginLeft: "auto" }}>{s.category}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>{s.fix}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}><Icons.X size={13}/> Close</Button>
          <Button variant="outline" onClick={doDownloadTxt}>
            <Icons.Download size={14}/> TXT
          </Button>
          <Button variant="success" onClick={doDownloadDocx} disabled={downloading}>
            {downloading
              ? <><Spinner size={16} color="#09090b"/> Generating…</>
              : <><Icons.Download size={14}/> DOCX</>
            }
          </Button>
        </div>

        {downloaded && (
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--green)", paddingBottom: 16 }}>
            ✓ Downloaded — open it in Word or Google Docs to apply final styling.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function EnhancedPage() {
  const { state }  = useLocation();
  const navigate   = useNavigate();

  if (!state?.enhancedText) {
    navigate("/analyze");
    return null;
  }

  const { resumeText, enhancedText, appliedSuggestions, analysisId, jobDesc } = state;

  const [showModal,  setShowModal]  = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleConfirmDownload = () => {
    // After modal downloads, we mark as done
    setDownloaded(true);
    setShowModal(false);
  };

  return (
    <>
      {showModal && (
        <ConfirmModal
          original={resumeText}
          enhanced={enhancedText}
          applied={appliedSuggestions}
          analysisId={analysisId}
          jobDesc={jobDesc}
          onClose={() => setShowModal(false)}
          onDownloaded={handleConfirmDownload}
        />
      )}

      <div className="container" style={{ paddingTop: 44, paddingBottom: 64 }}>
        <StepBar activeIdx={downloaded ? 3 : 2}/>

        {downloaded ? (
          /* ── Success state ── */
          <div className="animate-fadeUp" style={{ textAlign: "center", paddingTop: 48, paddingBottom: 48 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
            <h1 className="font-display" style={{ fontSize: 38, fontWeight: 700, marginBottom: 12 }}>
              Resume Downloaded!
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 15, maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}>
              Your ATS-optimized resume is saved. Open it in Microsoft Word, Google Docs, or any
              text editor to apply final formatting before submitting.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Button variant="outline" onClick={() => { setDownloaded(false); setShowModal(true); }}>
                <Icons.Download size={14}/> Download Again
              </Button>
              <Button onClick={() => navigate("/analyze")}>
                Analyze Another Resume
              </Button>
            </div>
          </div>
        ) : (
          /* ── Preview state ── */
          <>
            <div className="animate-fadeUp" style={{ marginBottom: 28 }}>
              <h1 className="font-display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>
                Enhanced Resume Ready
              </h1>
              <p style={{ color: "var(--muted)", fontSize: 14.5 }}>
                {appliedSuggestions.length} improvement{appliedSuggestions.length !== 1 ? "s" : ""} applied.
                Review the side-by-side diff, then confirm to download.
              </p>
            </div>

            {/* Applied changes summary */}
            <div className="panel animate-fadeUp delay-1" style={{ padding: "18px 24px", marginBottom: 22 }}>
              <div className="section-label">Applied Changes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {appliedSuggestions.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icons.Check size={13} color="var(--green)"/>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{s.issue}</span>
                    <span className="tag tag-muted" style={{ marginLeft: "auto" }}>{s.category}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Side-by-side preview */}
            <div
              className="animate-fadeUp delay-2 side-by-side"
              style={{ display: "flex", gap: 16, marginBottom: 24 }}
            >
              <div style={{ flex: 1 }}>
                <div className="section-label">Original</div>
                <div className="resume-preview" style={{ maxHeight: 420, overflowY: "auto", fontSize: 11.5, border: "1px solid var(--border)", borderRadius: 8 }}>
                  {resumeText}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="section-label" style={{ color: "var(--green)" }}>✨ Enhanced</div>
                <div className="resume-preview" style={{ maxHeight: 420, overflowY: "auto", fontSize: 11.5, border: "1px solid var(--green-border)", borderRadius: 8, boxShadow: "0 0 24px rgba(16,185,129,0.05)" }}>
                  {enhancedText}
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="animate-fadeUp delay-3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button variant="outline" onClick={() => navigate(-1)}>← Back</Button>
              <Button variant="success" fullWidth style={{ flex: 1 }} onClick={() => setShowModal(true)}>
                <Icons.Download size={15}/> Review & Download Enhanced Resume
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
