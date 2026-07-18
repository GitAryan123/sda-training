# Week 1 Summary: Advanced Frontend & Full-Stack Foundations

> **Training Program:** Software Development Acceleration (SDA)  
> **Duration:** 7 Days  
> **Trainee:** Aryan  
> **Outcome:** ✅ Week 1 Complete — All objectives met  

---

## 🎯 Objectives Achieved

| Objective | Status |
|-----------|--------|
| Master Git workflow and GitHub collaboration | ✅ |
| Build responsive, premium-grade web interfaces | ✅ |
| Implement advanced JavaScript patterns (modules, async, performance) | ✅ |
| Create complex React applications with hooks, context, and reducers | ✅ |
| Build a production-grade API service layer with retry and caching | ✅ |
| Implement real-time data with WebSocket integration | ✅ |
| Write comprehensive system documentation and Agile artifacts | ✅ |

---

## 📅 Day-by-Day Achievements

### Day 1 — SDLC & GitHub Mastery
- Established repository structure under `sda-training/` with weekly and daily organization
- Learned Git branching strategy: `main` → `feature/dayX-*` → PR → merge
- Set up PR templates and review workflows
- Learned conflict resolution and rebase fundamentals

### Day 2 — HTML5 & Advanced CSS
- Built a multi-section telemetry dashboard with pure HTML5 and CSS3
- Implemented CSS Grid and Flexbox layouts with responsive breakpoints
- Used CSS custom properties (`--primary`, `--bg`, etc.) as a design token system
- Added micro-animations: hover lifts, gradient shimmer, fade-in transitions
- Applied the `Outfit` Google Font for a premium feel

### Day 3 — Advanced JavaScript
- Wrote modular ES6+ JavaScript: `import/export`, template literals, destructuring, optional chaining
- Implemented async data loading with `fetch()`, `async/await`, and `try/catch` error handling
- Built native SVG chart generators — line, bar, and donut charts without any charting library
- Created a live performance monitoring system using the `PerformanceObserver` API
- Identified and noted an `innerHTML` XSS surface in the error renderer (logged for fix)

### Day 4 — React Advanced
- Scaffolded a Vite + React 18 project and migrated the vanilla dashboard to React
- Implemented a `useReducer` state machine for the data fetching lifecycle (`idle → loading → success/error`)
- Created React Context (`DataContext.jsx`) to distribute cached telemetry across the component tree
- Built 5+ custom hooks: `useDataFetching`, `useFilters`, `usePerformance`
- Resolved the `.jsx` extension requirement in Vite for JSX-containing files
- Fixed mobile layouts — implemented a fixed bottom tab bar at `≤ 480px` and collapsed sidebar at `≤ 1024px`
- Fixed filter label vertical alignment with `align-items: center` on `.filter-group`

### Day 5 — API & Real-Time Data
- Wrote a bespoke `ApiService` class featuring:
  - In-memory response caching with configurable TTL
  - Exponential backoff with random jitter on retries
  - Sliding-window rate limiter (10 req / 5s client-side)
  - `AbortController` for request timeouts
- Wrote a `WebSocketService` class featuring:
  - Auto-reconnect with capped exponential backoff + jitter
  - Heartbeat ping/pong every 30 seconds
  - Offline message buffer that flushes on reconnect
- Implemented `useRealTimeData` hook orchestrating REST + WebSocket with mock fallback
- Built `ConnectionStatus.jsx` badge with tooltip, latency indicator, and force-reconnect button
- Created native SVG Line/Bar/Donut chart visualizer in `ChartContainer.jsx`
- Scaffolded a full `week1/day5/code/` Vite project with `npm run build` passing clean

### Day 6 — Documentation & Agile
- Created 6 documentation files in `week1/day6/docs/`:
  - `system-architecture.md` — full architecture spec with data flow sequences
  - `uml-diagrams.md` — 5 Mermaid diagrams (component graph, sequence, state machine, class, burndown)
  - `api-documentation.md` — endpoint schemas, error codes, WebSocket events, cache behaviour
  - `sprint-planning.md` — 3 sprint backlogs, retrospectives, DoD checklist, capacity table
  - `documentation-templates.md` — 5 reusable templates (component, hook, API, user story, bug)
  - `documentation-standards.md` — writing guide, naming conventions, git commit format, PR checklist

---

## 🔧 Technical Implementation Stats

| Metric | Value |
|--------|-------|
| Projects built | 4 (Day 2, Day 3, Day 4, Day 5) |
| React components created | 10+ |
| Custom hooks written | 6 |
| Service classes written | 2 (`ApiService`, `WebSocketService`) |
| Documentation files created | 8 |
| Successful production builds | 2 (`npm run build`) |
| Bundle size (Day 5, gzipped) | ~53 KB JS |
| CSS design system | 1 shared token system |
| Bugs identified and fixed | 7 (see `code-review.md`) |

---

## 📈 Performance Metrics (Day 5 Build)

| Metric | Value |
|--------|-------|
| Build output JS | 166 KB |
| Gzipped JS | 53 KB |
| Build output CSS | 4.81 KB |
| Gzipped CSS | 1.48 KB |
| Vite build time | ~933ms |
| Total modules transformed | 48 |

---

## 🎓 Key Learnings

### What Clicked
- **CSS Variables** as design tokens — one change cascades everywhere; made theme consistency trivial
- **`useReducer` for async states** — explicit state machine eliminates boolean-flag soup (`isLoading && !isError && data !== null`)
- **Exponential backoff with jitter** — without jitter, all retry clients fire simultaneously on server recovery (thundering herd)
- **Mock data fallback pattern** — decouples frontend from backend availability; enables parallel development
- **`.jsx` extension in Vite** — Vite's `esbuild` parser only applies JSX transform to `.jsx` files by default

### Unexpected Challenges
- **`DataContext.js` parse failure** — learned that file extension matters to Vite's transformer
- **Intermediate viewport squish (768–1024px)** — collapsing at `768px` wasn't enough; `1024px` was the right breakpoint
- **`min-width` blocking mobile scale** — explicit minimum widths fight browser's natural layout flexibility
- **`timeout` in fetch config** — native `fetch` silently ignores unknown config keys; `AbortController` is the actual mechanism

---

## 🔍 Challenges Overcome

| Challenge | Resolution |
|-----------|-----------|
| JSX file parse error in Vite | Renamed `DataContext.js` → `DataContext.jsx` |
| Mobile layout squishing at tablet widths | Moved breakpoint from `768px` to `1024px` |
| Horizontal chart scroll on phones | Removed `min-width` from SVG viewport, set `width: 100%` |
| SVG donut arc calculation | Used polar-to-Cartesian conversion with `Math.cos`/`Math.sin` and `largeArcFlag` |
| Missing hook files breaking Day 5 build | Created `useApiService.js` and `useWebSocket.js` |
| API calls hitting Vite dev server | Set `ApiService` base URL to `''` so fallback mock activates |

---

## 🎯 Week 2 Preparation

### Focus Areas
- **Node.js + Express.js** — Build the actual backend API that Day 5's services are designed to call
- **MongoDB** — Implement the data layer implied by the API documentation
- **JWT Authentication** — Implement the `Authorization: Bearer` header flow documented in `api-documentation.md`
- **Socket.io** — Replace the browser WebSocket client with a full-duplex server

### Carry-Forward Items from Week 1
- Fix `innerHTML` XSS surface in Day 3 `showError()`
- Remove no-op `timeout` field from `ApiService` fetch config
- Add ESLint config to enforce no-`console.log` in production builds
- Write Vitest unit tests for `ApiService.checkRateLimit()` and retry logic

---

## 🎉 Week 1 Conclusion

Week 1 built a full arc from static markup to a live, production-buildable telemetry dashboard. The most important outcomes are:

1. **Architecture discipline** — Each day's code is isolated in its own Vite project. Services are pure classes. Hooks adapt them to React. Components only render. This separation will scale to a backend.

2. **Graceful degradation** — Every data fetch has a mock fallback. The app never shows a blank state. This pattern transfers directly to backend integration — replace mocks with real API calls when the backend is ready.

3. **Documentation as code** — Day 6 docs were written with the same care as code. The UML diagrams, API schemas, and sprint retrospectives serve as the handoff to Week 2.
