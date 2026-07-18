# Week 1 Demo Presentation

> **Program:** SDA Training — Week 1 Review  
> **Duration:** 30 minutes  
> **Format:** Live code walkthrough + feature demo  
> **Audience:** Instructor / Technical Reviewer  

---

## 🎯 Demo Objectives

1. Show all 4 runnable projects and verify they build clean
2. Walk through the progression from Day 2 static HTML → Day 5 live React dashboard
3. Highlight the specific architectural decisions made at each day
4. Present metrics (bundle size, build time, Web Vitals)
5. Discuss challenges encountered and how they were resolved

---

## 📋 Demo Agenda (30 minutes)

| Slot | Duration | Topic |
|------|----------|-------|
| 1 | 3 min | Opening — goals and structure of Week 1 |
| 2 | 5 min | Repository tour — organization and Git workflow |
| 3 | 8 min | Day 2 & 3 live demo — HTML/CSS/JS dashboards |
| 4 | 8 min | Day 4 & 5 live demo — React + Real-Time dashboard |
| 5 | 4 min | Architecture & code quality walkthrough |
| 6 | 2 min | Week 2 preview + Q&A |

---

## 🗂️ Repository Tour (Slot 2)

**Show in terminal:**
```bash
cd week1
ls -la
```

**Points to highlight:**
- Each day has its own isolated directory — `day1/` through `day7/`
- Days with runnable apps have a `code/` subdirectory with a complete Vite project
- Documentation lives alongside code — `docs/`, `README.md`, `learnings.md` per day
- Day 6 produced standalone documentation in `day6/docs/` covering the whole week

**Git log:**
```bash
git log --oneline -15
```

---

## 🖥️ Day 2 & 3 Demo (Slot 3)

### Day 2 — HTML5 + CSS3 Dashboard
**Open:** `week1/day2/code/index.html` in browser (double-click or Live Server)

**Show:**
- Responsive 2-column grid layout that collapses on mobile
- CSS custom properties panel — toggle `:root` variables in DevTools to show theming
- Micro-animations: card hover lift (`transform: translateY(-2px)`)
- Google Fonts `Outfit` loaded via `<link>` in `<head>`

**Demo script:**
> "Day 2 focused on building a premium HTML/CSS dashboard with no JavaScript. The goal was to show how far pure CSS can take you — responsive layouts, design tokens via CSS variables, and smooth hover animations all without a single line of JS."

### Day 3 — Advanced JavaScript
**Open:** `week1/day3/code/index.html` in browser

**Show:**
- Native SVG charts rendered in JavaScript — point to `visualizations.js`
- Live performance metrics (FP, FCP, DOM loaded) in the performance panel
- Filter controls updating chart data in real time
- Module system — open DevTools and show the ES module network requests

**Demo script:**
> "Day 3 added the brain behind the dashboard. The charts are drawn in pure SVG — no Chart.js dependency. Every bar and line is a calculated `<path>` element. The performance monitor uses the PerformanceObserver API to read real browser timing data."

---

## ⚛️ Day 4 & 5 Demo (Slot 4)

### Day 4 — React Advanced Dashboard

**Start dev server:**
```bash
cd week1/day4/code
npm run dev
# → http://localhost:5173
```

**Show in browser:**
- Dashboard header with 3 filter controls (date range, status, search)
- 4 KPI cards — all data driven from `DataContext` (React Context)
- SVG chart that updates when filter tabs are clicked
- Performance Log panel with live Web Vitals

**Show in code (VS Code):**
- `Dashboard.jsx` — the orchestrating component
- `DataContext.jsx` — how Context replaces prop-drilling
- `hooks/useDataFetching.js` — the `useReducer` state machine with `idle → loading → success/error` transitions

**Show DevTools → Application → open React DevTools if installed:**
- Context tree showing shared `DataContext` value
- Component re-render optimization via `React.memo`

**Mobile demo:**
- Open DevTools → Device toolbar → iPhone 14 (390px)
- Show bottom sticky tab bar navigation
- Show cards stacking vertically with full-width layout

**Demo script:**
> "Day 4 is where vanilla JavaScript became React. The key architectural decision was `useReducer` for async state — instead of three separate boolean flags, the hook moves through explicit states like a state machine. React Context means any component in the tree can access the cached telemetry without props being threaded through every layer."

### Day 5 — Real-Time Telemetry Dashboard

**Start dev server (or switch if already running):**
```bash
cd week1/day5/code
npm run dev
# → http://localhost:5173
```

**Show in browser:**
- 3 metric cards: Revenue, Users, Orders
- Watch them update every 4 seconds (simulated delta ticks)
- ConnectionStatus badge — show the tooltip by clicking it (latency displayed)
- Chart tabs — switch Revenue (line) → Users (bar) → Orders (donut)
- Web Vitals panel (FP, FCP, DOM timing from real browser data)

**Show in code:**
- `services/ApiService.js` — point out `checkRateLimit()` and `fetchWithRetry()` with backoff formula comment
- `services/WebSocketService.js` — point out `handleReconnect()` and jitter calculation
- `hooks/useRealTimeData.js` — explain the three layers: REST fetch → WS subscription → simulation fallback

**Demo script:**
> "Day 5 is the capstone of Week 1's frontend work. The `ApiService` has a sliding-window rate limiter, exponential backoff with random jitter, and an in-memory cache. The `WebSocketService` manages reconnection with its own backoff. The `useRealTimeData` hook wires both together — and if the backend is unreachable, it generates deterministic mock data so the UI never goes blank. You're seeing that mock data right now, updating every 4 seconds."

---

## 🏗️ Architecture Walkthrough (Slot 5)

**Open:** `week1/day6/docs/system-architecture.md` in preview

**Show:**
- Component architecture tree — explain the separation of Services / Hooks / Components
- Data flow sequence — REST cache → retry → fallback
- WebSocket state machine — `IDLE → CONNECTING → OPEN → DISCONNECTED → RECONNECTING`

**Open:** `week1/day6/docs/uml-diagrams.md`

**Show Mermaid diagrams:**
- Component dependency graph — visual of Day 4 and Day 5 combined
- Class diagram — `ApiService` and `WebSocketService` methods laid out

**Open:** `week1/day7/code-review.md`

**Highlight:**
- Issues that were identified and fixed during review
- Build verification table — both `npm run build` calls passed

---

## 📊 Demo Metrics

| Metric | Value |
|--------|-------|
| Projects built and running | 4 |
| Production builds passing | 2 (Day 4, Day 5) |
| Day 5 bundle size (gzipped) | 53 KB JS |
| Custom hooks written | 6 |
| Service classes (no dependencies) | 2 |
| Documentation files created | 8 |
| Bugs found and fixed in review | 7 |
| Days with mobile-responsive layout | 3 (Day 2, 4, 5) |

---

## ✅ Demo Success Criteria

### Technical
- [x] Day 4 `npm run build` exits 0
- [x] Day 5 `npm run build` exits 0  
- [x] Day 5 dashboard shows live metric updates every ~4 seconds
- [x] ConnectionStatus badge renders with correct icon
- [x] Chart toggles between Line / Bar / Donut correctly
- [x] Mobile layout at 390px shows bottom tab bar with no horizontal overflow

### Presentation
- [x] Each day's work is framed with a "why" (motivation) before the "what" (demo)
- [x] Code is shown — not just the running app
- [x] Architecture diagram is used to explain relationships
- [x] Challenges are acknowledged honestly, with resolutions explained

---

## 🔮 Week 2 Preview

> "The architecture I've built in Week 1 is designed to plug into a real backend. `ApiService` already structures requests with proper headers — including `Authorization`. `WebSocketService` already speaks the server-push protocol. Next week, we build the server side: Express routes, MongoDB models, and Socket.io to replace the mock data with real persistence."

**Three things to build in Week 2:**
1. REST API in Express matching the schemas in `day6/docs/api-documentation.md`
2. MongoDB collections for users, revenue, orders
3. Socket.io server emitting `dataUpdate` events to replace the 4-second simulation timer

---

## Q&A Notes

> Open for stakeholder questions. Key talking points ready:
> - Why native SVG over Chart.js? → Zero dependency, full control, smaller bundle
> - Why `useReducer` instead of `useState`? → Explicit state transitions prevent impossible states
> - Why mock data fallback? → Decouples frontend from backend availability during development
> - Why client-side rate limiting? → Prevents accidental request storms during development and edge network conditions
