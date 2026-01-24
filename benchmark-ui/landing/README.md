# Q# RAG Benchmark - Landing Page (React)

A React-based landing page for the Q# RAG Benchmark project, designed with a Titan.com-inspired editorial aesthetic.

## Design Inspiration

Inspired by **titan.com** — clean, elegant, editorial feel:
- **White background**, black text
- Minimal color (tan/beige accents only)
- Elegant serif + sans-serif typography
- Magazine-like aesthetic
- Refined, premium — not "techy"

## How to View

### Option 1: As standalone entry point
```bash
cd benchmark-ui
# Temporarily change main.tsx to use landing
# Or set up routing (see Integration section)
```

### Option 2: Integrated with main app (recommended)
```tsx
// In src/main.tsx or your routing setup
import { Landing } from "../landing/Landing";
import { App as Dashboard } from "./App";
```

### Option 3: Test the component directly
```bash
cd benchmark-ui
npm run dev
# Update your App.tsx to import and render <Landing />
```

## Features

### Sections
1. **Hero** - Two-column layout with quantum circuit illustration
2. **Stats Row** - Clean metrics display (40+, +23pp, 50 tasks)
3. **How It Works** - 4-step RAG process explanation
4. **Results** - Minimal table showing Baseline vs RAG
5. **About** - Project information
6. **Footer** - Simple, minimal

### Design Elements
- Navigation with sticky backdrop blur
- Black line art SVG illustration
- Editorial typography (Faculty Glyphic + Zalando Sans)
- Subtle hover states
- Fully responsive
- Accessible (focus states, semantic HTML)

## Font Usage

| Element | Font | Weight |
|---------|-------|--------|
| Headings | Faculty Glyphic (serif) | 600, 700 |
| Body | Zalando Sans (sans) | 400, 500 |

## Color Palette

```css
Background: #ffffff (white)
Text: #000000 (black)
Neutral: #737373, #525252
Accent: #e8e0d5 (warm tan/beige)
Border: #e5e5e5
```

## Integration with Main App

To connect this landing page to the main dashboard:

### Simple state-based approach:
```tsx
// src/App.tsx
import { useState } from "react";
import { Landing } from "../landing/Landing";
import { Dashboard } from "./App";

export default function RootApp() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");

  return (
    <>
      {view === "landing" ? (
        <Landing />
      ) : (
        <Dashboard />
      )}
    </>
  );
}
```

### With React Router (recommended):
```bash
npm install react-router-dom
```

```tsx
// src/main.tsx or App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "../landing/Landing";
import { Dashboard } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>
);
```

## Files

| File | Description |
|------|-------------|
| `Landing.tsx` | Main React component |
| `landing.css` | Tailwind + custom styles |
| `main.tsx` | Entry point for standalone view |

## Notes

- This is a separate component from the main `App.tsx` dashboard
- Uses Tailwind CSS for styling
- Designed to be easily integrated with routing
- No data fetching — static showcase page
- Matches Titan.com's editorial aesthetic

## Old HTML Version

The previous `index.html`, `landing.css`, and `landing.js` files are still available
if you prefer a pure HTML/CSS implementation.
