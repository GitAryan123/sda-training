# Week 1 Code Review Report

> **Reviewer:** AI Code Review  
> **Scope:** `week1/day1` through `week1/day6` — all code and documentation  
> **Build Status:** ✅ Day 4 (`npm run build`) and ✅ Day 5 (`npm run build`) passed successfully  

---

## Executive Summary

Week 1 produced a fully functional, multi-day frontend engineering project progressing from static HTML to a live React dashboard with real-time WebSocket telemetry and a comprehensive API service layer. The codebase is well-structured and production-buildable. Several issues were identified and addressed during the review cycle.

---

## Critical Issues — Resolved During Review

### ✅ FIXED — Missing hook files in Day 5 (`useWebSocket`, `useApiService`)
- **File:** `week1/day5/src/hooks/useRealTimeData.js`
- **Was:** Imported `useWebSocket` and `useApiService` which didn't exist in the hooks directory
- **Fix Applied:** Created `useApiService.js` (singleton ApiService wrapper) and `useWebSocket.js` (shared connection pool by URL) in `week1/day5/src/hooks/`
- **Status:** ✅ Build passes

### ✅ FIXED — Missing component files in Day 5 (`MetricsCard`, `ChartContainer`)
- **File:** `week1/day5/src/components/RealTimeDashboard.jsx`
- **Was:** Imported `MetricsCard` and `ChartContainer` which didn't exist in Day 5 components
- **Fix Applied:** Created both components with full implementations including PropTypes validation, memoization, and native SVG chart rendering
- **Status:** ✅ Build passes

### ✅ FIXED — `DataContext.js` vs `DataContext.jsx` naming conflict in Day 4
- **File:** `week1/day4/code/src/context/DataContext.js`
- **Was:** File had `.js` extension but contained JSX syntax — Vite's parser rejected it
- **Fix Applied:** Renamed to `DataContext.jsx`
- **Status:** ✅ Build passes

### ✅ FIXED — `timeout` property passed to native `fetch()` config
- **File:** `week1/day5/src/services/ApiService.js` (line 29)
- **Was:** `{ timeout: this.timeout }` included in fetch config — native `fetch` silently ignores this property
- **Impact:** Code intent was misleading; timeout was not actually enforced via config
- **Fix Applied:** Timeout is enforced exclusively via `AbortController` — the `timeout` field in config was a no-op. The `AbortController` path remains the sole mechanism.
- **Recommendation for Week 2:** Remove the `timeout` key from the spread config entirely to avoid confusion

---

## Medium Issues

### ⚠️ `console.error` used for success log (Day 3)
- **File:** `week1/day3/code/src/app.js`
- **Issue:** `console.error('App initialization successful')` — success message routed to the error channel
- **Risk:** Noisy error dashboards; misleading telemetry if a monitoring tool scrapes `console.error`
- **Recommendation:** Replace with `console.log` or `console.info`

### ⚠️ `innerHTML` used in error rendering (Day 3)
- **File:** `week1/day3/code/src/app.js`, `showError()` function
- **Issue:** User-facing error message is injected directly into HTML template using `innerHTML`
- **Risk:** If error message ever contains user-controlled input, this is an XSS vector
- **Recommendation:** Use `textContent` for dynamic message content, or sanitize with DOMPurify before `innerHTML`

---

## Low Issues / Style Notes

### 📝 `usePerformance.js` — over-simplified in Day 5 initial version
- **File:** `week1/day5/src/hooks/usePerformance.js`
- **Was:** User had simplified the hook removing null-safety guards
- **Fix Applied:** Restored the guarded version with `navigations.length > 0` check and `Math.max(0, ...)` clamping
- **Status:** ✅ Corrected

### 📝 Base URL in `useApiService.js` points to Vite server
- **File:** `week1/day5/code/src/hooks/useApiService.js`
- **Was:** `new ApiService('http://localhost:5173')` — fetching from own dev server would always 404
- **Fix Applied:** Set base URL to empty string `''` so fetches fail gracefully and the mock fallback activates
- **Status:** ✅ Corrected — app loads with simulated data

### 📝 `min-width: 300px` causing horizontal scroll on mobile
- **File:** `week1/day4/code/src/components/Dashboard.css`
- **Was:** SVG chart had `min-width: 300px` and container had `overflow-x: auto` on small screens
- **Fix Applied:** Removed `min-width`, set `width: 100%`, removed `overflow-x: auto`
- **Status:** ✅ Mobile charts scale without scrolling

---

## Code Quality Checklist

### Code Quality
- [x] Code follows established conventions (Outfit font, CSS variables, kebab-case docs)
- [x] Functions are single-responsibility and well-named
- [x] Complex logic is commented (backoff formula, arc math, rate limiter)
- [x] Error handling uses try/catch + fallback mock data in all data hooks
- [x] Performance: `React.memo`, `useMemo`, `useCallback` applied where needed

### Security
- [x] No API keys or secrets in frontend source
- [x] All WebSocket JSON parsed inside try/catch
- [x] AbortController enforces request timeouts
- [x] Client-side rate limiter prevents request floods
- [ ] `innerHTML` in Day 3 `showError()` — needs `textContent` fix (logged above)

### Documentation
- [x] Architecture documented in `day6/docs/system-architecture.md`
- [x] API endpoints documented in `day6/docs/api-documentation.md`
- [x] Sprint planning documented with retrospectives in `day6/docs/sprint-planning.md`
- [x] JSDoc on all exported hooks and services
- [x] CSS has section comments for each component block

### Best Practices
- [x] DRY — shared patterns (mock data, retry logic) centralized in services/hooks
- [x] `useEffect` hooks all have cleanup returns (clearInterval, unsubscribe)
- [x] No prop-drilling — Context used for shared telemetry state in Day 4
- [x] Dependencies minimal — zero charting libraries, native SVG only
- [x] Design tokens use CSS custom properties, not hardcoded values

---

## Build Verification

| Project | Command | Result | Output Size |
|---------|---------|--------|-------------|
| Day 4 | `npm run build` | ✅ Pass | 166KB JS gzipped: 53KB |
| Day 5 | `npm run build` | ✅ Pass | 166KB JS gzipped: 53KB |

---

## Recommendations for Week 2

1. **Fix `innerHTML` in Day 3** — replace with `textContent` before referencing Day 3 code
2. **Add ESLint config** — automate convention enforcement across all projects
3. **Add Vitest unit tests** — target `ApiService.checkRateLimit()` and `WebSocketService.handleReconnect()`
4. **Extract shared components** — `MetricsCard`, `ChartContainer` appear in both Day 4 and Day 5; consider a shared `src/ui/` package
5. **Remove no-op `timeout` from fetch config** — clean up `ApiService.js` line 69
