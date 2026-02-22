/**
 * pages/LandingPage.jsx
 * Hero section, feature grid, and CTAs.
 */

import { useNavigate } from "react-router-dom";
import { Button, Icons } from "../components/UI.jsx";

const FEATURES = [
  {
    icon: "📄",
    title: "Multi-Format Upload",
    desc: "Drop in PDF, DOCX, DOC, or TXT. Parsed on the server using PyPDF2 and python-docx — no third-party SaaS involved.",
  },
  {
    icon: "🎯",
    title: "ATS Score (0–100)",
    desc: "Six-dimension analysis: keywords, formatting, experience, skills, achievements, and education — each with a score and comment.",
  },
  {
    icon: "🔍",
    title: "Targeted or General Mode",
    desc: "Paste a job description for keyword-matched analysis, or leave it blank for a general ATS best-practices review. Completely optional.",
  },
  {
    icon: "✨",
    title: "AI Enhancement & Download",
    desc: "Select the improvements you want, confirm the side-by-side preview, then download your rewritten resume as a DOCX or TXT file.",
  },
];

const STATS = [
  { v: "Free", u: "API Tier", d: "Open AI, no credit card" },
  { v: "6", u: "Dimensions", d: "Detailed score breakdown" },
  { v: "PDF+", u: "Formats", d: "DOCX · DOC · TXT" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ position: "relative", overflow: "hidden", flex: 1 }}>
      {/* Background */}
      <div className="hero-glow" />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.45, pointerEvents: "none" }} />

      <div className="container" style={{ position: "relative", paddingTop: 80, paddingBottom: 80 }}>

        {/* AI badge */}
        <div className="animate-fadeUp" style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
          <span className="tag tag-gold" style={{ fontSize: 11, padding: "4px 14px" }}>
            Powered by OpenAI
          </span>
        </div>

        {/* Headline */}
        <div className="animate-fadeUp delay-1" style={{ textAlign: "center", marginBottom: 28 }}>
          <h1
            className="font-display hero-h1"
            style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.025em", marginBottom: 20 }}
          >
            Beat the ATS.<br />
            <span style={{ color: "var(--gold)" }}>Land the Interview.</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 520, margin: "0 auto", lineHeight: 1.75 }}>
            Upload your resume, optionally paste a job description, and get an instant AI-powered
            ATS score with actionable suggestions — all free, no login required.
          </p>
        </div>

        {/* CTAs */}
        <div className="animate-fadeUp delay-2" style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 72 }}>
          <Button size="lg" onClick={() => navigate("/analyze")}>
            <Icons.Sparkle size={17} /> Analyze My Resume
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}>
            How it works
          </Button>
        </div>

        {/* Stats strip */}
        <div className="panel animate-fadeUp delay-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", marginBottom: 80, textAlign: "center", overflow: "hidden" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: "26px 16px", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div className="font-display" style={{ fontSize: 34, fontWeight: 900, color: "var(--gold)", letterSpacing: "-0.02em" }}>{s.v}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.u}</div>
              <div style={{ fontSize: 11, color: "var(--faint)" }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* Feature grid */}
        <div id="features">
          <div className="section-label animate-fadeUp delay-3" style={{ marginBottom: 24 }}>How it works</div>
          <div className="two-col animate-fadeUp delay-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: 72 }}>
          <p className="font-mono" style={{ color: "var(--faint)", fontSize: 12, marginBottom: 18 }}>
            No sign-up · Resumes parsed on the server · 100% privacy guranteed
          </p>
          <Button size="lg" onClick={() => navigate("/analyze")}>Get Started →</Button>
        </div>
      </div>
    </div>
  );
}
