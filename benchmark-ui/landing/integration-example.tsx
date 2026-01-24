// Example: How to integrate Landing with Dashboard
// This shows multiple approaches for connecting the two pages

import React from "react";
import { Landing } from "../landing/Landing";
import { Dashboard } from "./App"; // Your existing App component

// ============================================================
// APPROACH 1: Simple State Switch (easiest)
// ============================================================

export function AppWithSimpleState() {
  const [view, setView] = React.useState<"landing" | "dashboard">("landing");

  return (
    <div>
      {view === "landing" ? (
        <Landing />
      ) : (
        <Dashboard />
      )}

      {/* Toggle button for demo purposes */}
      <button
        onClick={() => setView(view === "landing" ? "dashboard" : "landing")}
        className="fixed bottom-4 right-4 px-4 py-2 bg-black text-white rounded-md"
      >
        Toggle View
      </button>
    </div>
  );
}

// ============================================================
// APPROACH 2: With React Router (recommended)
// ============================================================
// Install: npm install react-router-dom

/*
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

export function AppWithRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

// Add navigation link in Landing.tsx:
<Link to="/dashboard" className="px-6 py-3 bg-[#e8e0d5] text-black font-medium rounded-md">
  See Results ▶
</Link>

// Add "Home" link in Dashboard:
<Link to="/" className="text-sm text-neutral-600 hover:text-black">
  ← Back to Home
</Link>
*/

// ============================================================
// APPROACH 3: Conditional based on environment/feature flag
// ============================================================

export function AppWithFeatureFlag() {
  const showLanding = import.meta.env.VITE_SHOW_LANDING === "true";

  return showLanding ? <Landing /> : <Dashboard />;
}
