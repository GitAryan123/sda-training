# Sprint Planning Documentation

> **Project:** Apex Telemetry Dashboard — SDA Week 1  
> **Framework:** Agile Scrum  
> **Sprint Duration:** 1 week (5 working days)  
> **Team Size:** 1 developer (solo training sprint)  

---

## Sprint 1 Summary: Foundation & Core UI

**Duration:** Day 1 – Day 3  
**Goal:** Establish Git workflow, build semantic HTML/CSS dashboard, and implement advanced JavaScript patterns.

### Sprint Backlog

| ID | User Story | Points | Priority | Status |
|----|-----------|--------|----------|--------|
| US-001 | As a developer, I want a Git workflow so I can track changes and collaborate | 3 | 🔴 High | ✅ Done |
| US-002 | As a user, I want a semantic HTML dashboard so content is accessible | 5 | 🔴 High | ✅ Done |
| US-003 | As a user, I want responsive CSS so the layout works on all screen sizes | 8 | 🔴 High | ✅ Done |
| US-004 | As a developer, I want ES6+ modules so my code is organized and reusable | 5 | 🔴 High | ✅ Done |
| US-005 | As a user, I want live chart visualizations so I can understand trends | 8 | 🟡 Med | ✅ Done |
| US-006 | As a developer, I want fetch-based data loading so the dashboard is data-driven | 5 | 🟡 Med | ✅ Done |

**Sprint Velocity:** 34 story points  
**Completion:** 100% ✅

---

## Sprint 2 Summary: React Advanced

**Duration:** Day 4  
**Goal:** Refactor vanilla JS dashboard into a production-quality React 18 application with hooks, context, and custom data-fetching state machines.

### Sprint Backlog

| ID | User Story | Points | Priority | Status |
|----|-----------|--------|----------|--------|
| US-007 | As a developer, I want a Vite + React scaffolded project so I have a modern build pipeline | 3 | 🔴 High | ✅ Done |
| US-008 | As a developer, I want a `useReducer` data fetching hook so state transitions are predictable | 8 | 🔴 High | ✅ Done |
| US-009 | As a developer, I want React Context so component data-sharing avoids prop-drilling | 5 | 🔴 High | ✅ Done |
| US-010 | As a user, I want filter controls so I can narrow dashboard results | 5 | 🟡 Med | ✅ Done |
| US-011 | As a developer, I want `usePerformance` hook so I can monitor Core Web Vitals | 3 | 🟡 Med | ✅ Done |
| US-012 | As a user, I want a responsive mobile layout with bottom tab bar so I can use the dashboard on a phone | 8 | 🟡 Med | ✅ Done |

**Sprint Velocity:** 32 story points  
**Completion:** 100% ✅

---

## Sprint 3 Summary: API & Real-Time Data

**Duration:** Day 5  
**Goal:** Implement a full API service layer with retry/caching, a WebSocket service with reconnection logic, and a live-updating telemetry dashboard.

### Sprint Backlog

| ID | User Story | Points | Priority | Status |
|----|-----------|--------|----------|--------|
| US-013 | As a developer, I want an ApiService class so REST calls have retry, cache, and rate limiting | 13 | 🔴 High | ✅ Done |
| US-014 | As a developer, I want a WebSocketService so real-time data is handled with reconnection logic | 13 | 🔴 High | ✅ Done |
| US-015 | As a developer, I want a `useRealTimeData` hook so components get live telemetry with fallback | 8 | 🔴 High | ✅ Done |
| US-016 | As a user, I want a ConnectionStatus badge so I know the live sync state | 3 | 🟡 Med | ✅ Done |
| US-017 | As a user, I want native SVG charts so I see data without third-party chart libraries | 8 | 🟡 Med | ✅ Done |
| US-018 | As a developer, I want mock data fallback so the app works without a backend | 5 | 🟢 Low | ✅ Done |

**Sprint Velocity:** 50 story points  
**Completion:** 100% ✅

---

## Definition of Done

For a story to be considered complete:

- [ ] Code is implemented according to acceptance criteria
- [ ] No console errors or warnings in production build
- [ ] `npm run build` passes with 0 errors
- [ ] Code uses `Outfit` font and consistent design tokens
- [ ] Mobile layout is functional (tested at 390px viewport)
- [ ] Component is `React.memo`-wrapped if it renders frequently
- [ ] Any custom hook includes proper cleanup in `useEffect` return
- [ ] Documentation or inline comments explain non-obvious logic

---

## Sprint Review Agenda Template

**Duration:** 30 minutes

1. **Live Demo** (10 min)  
   - Walk through the running application at `localhost:5173`
   - Show completed user story flows end-to-end

2. **Metrics Review** (5 min)  
   - Story points completed vs planned
   - Build size delta
   - Lighthouse/Core Web Vitals scores

3. **Code Walkthrough** (10 min)  
   - Highlight architectural decisions and tradeoffs
   - Show interesting patterns implemented this sprint

4. **Retrospective** (5 min)  
   - What went well?
   - What would you do differently?
   - What is carried forward?

---

## Sprint Retrospectives

### Sprint 1 Retrospective

| What Went Well | What Could Be Improved |
|----------------|----------------------|
| Clean semantic HTML from Day 1 made CSS easier | JS chart rendering was manual — SVG paths are verbose |
| CSS variables for design tokens made theming trivial | Fetch error handling was bolted on, not planned upfront |
| Git commit discipline from Day 1 paid off | Should have planned mobile-first from Day 2, not after |

**Action Items:**
- ✅ Apply mobile-first CSS in Day 4 from the start (breakpoint at 1024px)
- ✅ Design error states alongside happy-path when building components

### Sprint 2 Retrospective

| What Went Well | What Could Be Improved |
|----------------|----------------------|
| `useReducer` made loading/error/success states clear | DataContext.js needed renaming to DataContext.jsx for Vite |
| Responsive bottom tab bar worked smoothly | Filter labels needed explicit vertical alignment fix |
| Context eliminated prop-drilling across 4 layers | Could have extracted chart SVG into its own pure component sooner |

**Action Items:**
- ✅ Always use `.jsx` extension for files containing JSX syntax in Vite
- ✅ Plan component extraction boundaries before starting — avoid god components

### Sprint 3 Retrospective

| What Went Well | What Could Be Improved |
|----------------|----------------------|
| Mock fallback data made frontend testable without backend | Doughnut chart SVG arc math needed extra debugging time |
| Exponential backoff with jitter is production-grade | useApiService base URL initially pointed at dev server |
| Rate limiter prevents runaway re-renders from hammering API | Prop-types dependency was missing from package.json initially |

**Action Items:**
- ✅ Check dependency list completeness before first build
- ✅ Document SVG arc math inline for future maintainers
- ✅ Add integration test stubs for ApiService in Day 7 review

---

## Capacity Planning

| Sprint | Developer | Hours Available | Story Points | Velocity |
|--------|-----------|-----------------|--------------|---------|
| Sprint 1 | Solo | 24h (Days 1–3) | 34 pts | 11.3 pts/day |
| Sprint 2 | Solo | 8h (Day 4) | 32 pts | 32 pts/day |
| Sprint 3 | Solo | 8h (Day 5) | 50 pts | 50 pts/day |
| **Total** | | **40h** | **116 pts** | |
