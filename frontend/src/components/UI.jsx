/**
 * components/UI.jsx
 * Shared primitive components used across all pages.
 */

// ── Spinner ────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = "currentColor" }) {
  return (
    <svg
      className="animate-spin"
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.2" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── Icons ──────────────────────────────────────────────────────────
export const Icons = {
  Check: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8l4 4 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  X: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ArrowLeft: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Download: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Sparkle: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M10.5 3.5l-2 2M5.5 10.5l-2 2"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Upload: () => (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="var(--gold-dim)" />
      <path d="M22 28V16M16 22l6-6 6 6M13 33h18"
        stroke="var(--gold)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  FileDoc: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="var(--green-dim)" />
      <path d="M14 12h14l8 8v20H14V12z" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M28 12v8h8" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 24h12M18 29h12M18 34h8" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

// ── Score Ring ────────────────────────────────────────────────────
export function ScoreRing({ score }) {
  const r = 62;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 80 ? "var(--green)" :
      score >= 55 ? "var(--gold)" : "var(--red)";
  const label =
    score >= 80 ? "Excellent" :
      score >= 65 ? "Good" :
        score >= 45 ? "Fair" : "Needs Work";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 164, height: 164, flexShrink: 0 }}>
        <svg viewBox="0 0 148 148" width="164" height="164">
          <circle cx="74" cy="74" r={r} fill="none" stroke="var(--surface2)" strokeWidth="10" />
          <circle
            cx="74" cy="74" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 74 74)"
            style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1), stroke 0.5s" }}
          />
          <text x="74" y="68" textAnchor="middle" fill="var(--text)"
            style={{ fontFamily: "'DM Mono',monospace", fontSize: 30, fontWeight: 700 }}>
            {score}
          </text>
          <text x="74" y="85" textAnchor="middle" fill="var(--faint)"
            style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11 }}>
            / 100
          </text>
        </svg>
      </div>
      <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "0.09em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────
export function ProgressBar({ value, color = "gold" }) {
  const grad =
    color === "green" ? "linear-gradient(90deg,var(--green),#34d399)" :
      color === "red" ? "linear-gradient(90deg,var(--red),#fb7185)" :
        "linear-gradient(90deg,var(--gold),var(--gold2))";
  return (
    <div className="pbar-track">
      <div className="pbar-fill" style={{ width: `${value}%`, background: grad }} />
    </div>
  );
}

// ── Step Bar ──────────────────────────────────────────────────────
const STEPS = ["Upload", "Analyze", "Enhance", "Download"];

export function StepBar({ activeIdx }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 40, overflowX: "auto", paddingBottom: 4 }}>
      {STEPS.map((label, i) => {
        const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "todo";
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 600,
                background:
                  state === "done" ? "var(--green)" :
                    state === "active" ? "var(--gold)" : "var(--surface2)",
                color:
                  state !== "todo" ? "#09090b" : "var(--faint)",
                border: state === "todo" ? "1px solid var(--border)" : "none",
                transition: "all 0.3s",
              }}>
                {state === "done" ? <Icons.Check size={12} color="#09090b" /> : i + 1}
              </div>
              <span style={{
                fontSize: 12, fontWeight: 500,
                color: state === "done" ? "var(--green)" : state === "active" ? "var(--gold)" : "var(--faint)",
                whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, minWidth: 20, height: 1,
                background: state === "done" ? "var(--green)" : "var(--border)",
                margin: "0 10px", transition: "background 0.3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────
export function Navbar({ onBack, showBack }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 200,
      borderBottom: "1px solid var(--border)",
      background: "rgba(9,9,11,0.88)", backdropFilter: "blur(18px)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 58, padding: "0 24px", maxWidth: 1080, margin: "0 auto",
      }}>
        <a href="/" style={{
          fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700,
          color: "var(--text)", textDecoration: "none", display: "flex", alignItems: "center", gap: 2,
        }}>
          Resume<span style={{ color: "var(--gold)" }}>IQ</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {showBack ? (
            <button
              onClick={onBack}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "transparent", border: "none", color: "var(--muted)",
                cursor: "pointer", fontSize: 14, fontWeight: 500, padding: "6px 12px",
                borderRadius: 6, transition: "all 0.17s",
                fontFamily: "'DM Sans',sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface2)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
            >
              <Icons.ArrowLeft /> Back
            </button>
          ) : ''}
        </div>
      </div>
    </nav>
  );
}

// ── Generic Button ────────────────────────────────────────────────
export function Button({
  children, onClick, disabled, variant = "gold",
  size = "md", fullWidth = false, style = {},
}) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.42 : 1,
    transition: "all 0.17s ease", whiteSpace: "nowrap", textDecoration: "none",
    width: fullWidth ? "100%" : "auto",
    borderRadius: size === "lg" ? 10 : 8,
    padding:
      size === "lg" ? "14px 34px" :
        size === "sm" ? "7px 14px" : "11px 24px",
    fontSize: size === "lg" ? 15 : size === "sm" ? 12 : 14,
    letterSpacing: "0.01em",
    ...style,
  };

  const variants = {
    gold: { background: "var(--gold)", color: "#09090b" },
    success: { background: "var(--green)", color: "#09090b" },
    outline: { background: "transparent", color: "var(--muted)", border: "1px solid var(--border2)" },
    ghost: { background: "transparent", color: "var(--muted)" },
    danger: { background: "var(--red-dim)", color: "var(--red)", border: "1px solid var(--red-border)" },
  };

  return (
    <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}
