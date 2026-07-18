# System Architecture Documentation

> **Project:** Apex Training Dashboard — SDA Week 1  
> **Version:** 1.0.0  
> **Last Updated:** July 2026  

---

## Overview

The Apex Training Dashboard is a modular, client-side React application designed for real-time data visualization and telemetry monitoring. Built entirely in the browser using Vite + React 18, it demonstrates the full spectrum of Week 1 skills — from raw HTML/CSS to advanced React hooks, WebSocket integration, and production-ready API service layers.

---

## Architecture Principles

| Principle | Implementation |
|-----------|----------------|
| **Modularity** | Each day's codebase is isolated in its own Vite project. Cross-day patterns are shared conceptually, not via import chains |
| **Separation of Concerns** | Services (`ApiService`, `WebSocketService`) are purely functional classes. Hooks adapt them to React. Components only render. |
| **Performance-First** | `React.memo`, `useMemo`, `useCallback` applied where data recalculates on every render |
| **Graceful Degradation** | All API/WS failures fall back to deterministic mock data so the dashboard never shows blank states |
| **Documentation-Driven** | Every architectural decision is recorded before code is written |

---

## Technology Stack

### Frontend (Days 2–5)
| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Framework | **React 18** | Component tree, hooks, concurrent rendering |
| Build Tool | **Vite 4** | HMR dev server, ESM bundling |
| Language | **JavaScript ES2022+** | `?.`, `??`, async/await, modules |
| Styling | **Vanilla CSS + CSS Variables** | Themeable design tokens, no Tailwind dependency |
| Charts | **Native SVG** | Zero-dependency vector chart rendering |
| Real-Time | **WebSocket API** | Browser-native push connection |
| Fonts | **Google Fonts (Outfit)** | Premium, clean sans-serif typeface |

### Data Layer (Day 5)
| Service | Role |
|---------|------|
| `ApiService` | REST cache, retry backoff, rate limiter |
| `WebSocketService` | Connection lifecycle, heartbeat, offline queue |
| `useRealTimeData` | Orchestrates REST + WS, exposes React state |
| Mock fallback | Deterministic random data when backend is unavailable |

---

## Component Architecture

```
week1/day4/code/src/
├── components/
│   ├── Dashboard.jsx          ← Layout shell, sidebar nav, main wrapper
│   ├── DashboardHeader.jsx    ← Filter controls (date, status, search)
│   ├── MetricsGrid.jsx        ← 4-card KPI display
│   ├── ChartSection.jsx       ← Tab-switching SVG chart area
│   └── PerformanceLog.jsx     ← Web vitals panel
├── hooks/
│   ├── useDataFetching.js     ← useReducer-based fetch state machine
│   ├── usePerformance.js      ← PerformanceObserver + Navigation Timing
│   └── useFilters.js          ← Filter state + derived filtered datasets
├── context/
│   └── DataContext.jsx        ← React Context for cached telemetry data
└── services/
    └── (API layer in Day 5)

week1/day5/code/src/
├── services/
│   ├── ApiService.js          ← Fetch with retry, cache Map, rate limiter
│   └── WebSocketService.js    ← WS reconnect, heartbeat, message queue
├── hooks/
│   ├── useApiService.js       ← Singleton ApiService React hook
│   ├── useWebSocket.js        ← Shared WS instance by URL key
│   ├── useRealTimeData.js     ← Unified REST+WS data sync hook
│   └── usePerformance.js      ← Web Vitals hook
└── components/
    ├── RealTimeDashboard.jsx  ← Orchestrates all live feeds
    ├── MetricsCard.jsx        ← Memoized KPI card
    ├── ChartContainer.jsx     ← SVG Line/Bar/Donut renderer
    └── ConnectionStatus.jsx   ← WS badge with tooltip + reconnect
```

---

## Data Flow

### REST Request Lifecycle
```
User Action
    ↓
useRealTimeData(endpoint)
    ↓
ApiService.get(endpoint)
    ↓
checkRateLimit() → blocked? throw RateLimitError
    ↓
cache.has(key) && !expired? → return cached data
    ↓
fetchWithRetry(url, config, attempt=1)
    ↓
  fetch fails? → shouldRetry? → delay(retryDelay × 2^attempt ± jitter)
    ↓
Success → cache.set(key, { data, timestamp }) → return data
    ↓
Component state update → re-render
```

### WebSocket Lifecycle
```
enableRealTime = true
    ↓
WebSocketService.connect()
    ↓
ws.onopen → startHeartbeat() → processMessageQueue() → notify 'connected'
    ↓
ws.onmessage → handleMessage() → notifySubscribers('message', data)
    ↓
useRealTimeData: 'dataUpdate' events with matching endpoint → setData()
    ↓
ws.onclose (dirty) → stopHeartbeat() → handleReconnect()
    ↓
reconnectAttempts++ → delay(interval × 2^n ± jitter) → connect()
```

---

## Security Architecture

| Area | Approach |
|------|---------|
| **Rate Limiting** | Client-side sliding window (10 req / 5s) to prevent hammering |
| **Retry Safety** | AbortController timeouts prevent hanging requests |
| **Input Sanitization** | All WebSocket JSON parsed inside try/catch |
| **Error Leakage** | Catch blocks log to console only; UI shows generic messages |
| **No Secrets** | No API keys or credentials in frontend source |

---

## Performance Optimization

| Optimization | Location | Benefit |
|--------------|----------|---------|
| `React.memo` | `MetricsCard` | Skips re-render when props unchanged |
| `useMemo` | Chart path computation | Recalculates only when dataset changes |
| `useCallback` | `refresh`, `getLastUpdate` | Stable references for `useEffect` deps |
| Cache Map TTL | `ApiService` | Eliminates duplicate network requests |
| Simulated delta updates | `useRealTimeData` | Only updates changed values, not full re-fetch |
| SVG `viewBox` | `ChartContainer` | Scales natively — no canvas redraw |

---

## Deployment Architecture

| Environment | Setup |
|-------------|-------|
| **Development** | `npm run dev` — Vite HMR on `localhost:5173` |
| **Build Check** | `npm run build` — Vite bundles to `dist/` with tree-shaking |
| **Preview** | `npm run preview` — Serve production bundle locally |
| **CI (proposed)** | GitHub Actions → `npm ci && npm run build` on PR |
| **Production (proposed)** | Static hosting (Netlify / Vercel / S3+CloudFront) |

---

## Monitoring Strategy

| Signal | Tool |
|--------|------|
| Web Vitals (FP, FCP, LCP) | `usePerformance` hook via PerformanceObserver API |
| Network Timing | Navigation Timing API in `usePerformance` |
| WS Health | Heartbeat ping/pong every 30s in `WebSocketService` |
| Error Tracking | Console grouped logs with `%c` styling for severity |
| Reconnect Telemetry | `reconnectAttempts` counter exposed via `getConnectionState()` |
