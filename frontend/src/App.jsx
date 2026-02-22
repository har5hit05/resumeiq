/**
 * App.jsx — root component
 * Sets up React Router and wraps all pages with the Navbar.
 */

import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "./components/UI.jsx";
import LandingPage  from "./pages/LandingPage.jsx";
import AnalyzePage  from "./pages/AnalyzePage.jsx";
import ResultsPage  from "./pages/ResultsPage.jsx";
import EnhancedPage from "./pages/EnhancedPage.jsx";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const isLanding  = location.pathname === "/";
  const showBack   = !isLanding;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar
        showBack={showBack}
        onBack={() => navigate(-1)}
      />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"         element={<LandingPage/>}  />
          <Route path="/analyze"  element={<AnalyzePage/>}  />
          <Route path="/results"  element={<ResultsPage/>}  />
          <Route path="/enhanced" element={<EnhancedPage/>} />
          {/* Catch-all — redirect unknown routes to home */}
          <Route path="*"         element={<LandingPage/>}  />
        </Routes>
      </main>

      <footer style={{
        borderTop:   "1px solid var(--border)",
        padding:     "18px 24px",
        textAlign:   "center",
        fontSize:    11.5,
        color:       "var(--faint)",
        fontFamily:  "'DM Mono', monospace",
      }}>
        ResumeIQ · OpenAI · FastAPI + MongoDB · MIT License
      </footer>
    </div>
  );
}
