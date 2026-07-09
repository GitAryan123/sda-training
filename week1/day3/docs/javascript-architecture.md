# JavaScript Architecture Guide

## Architecture Overview
This dashboard uses a modular ES6 class architecture with a single app coordinator.

Flow:
1. `DashboardApp` initializes UI and services.
2. `ChartManager` loads Chart.js, fetches API data, and renders charts.
3. `PerformanceMonitor` tracks runtime/browser performance metrics.
4. `DataManager` handles API requests, caching, and data subscriptions.

## Module Responsibilities

### DashboardApp (`src/app.js`)
- Creates and injects dashboard markup into `.content`.
- Initializes `ChartManager` with a shared `DataManager`.
- Adds UI controls:
  - Refresh Data
  - Toggle Performance Monitor
- Subscribes to performance metrics and renders recent metric items.
- Handles initialization failure with a fallback error UI.

### DataManager (`src/modules/DataManager.js`)
- Centralized data access layer for API requests.
- Uses `fetch` with optional request overrides.
- Caches responses using a `Map` keyed by endpoint and options.
- Publishes updates to subscribers when new data arrives.
- Supports cache reset via `clearCache()`.

### ChartManager (`src/modules/ChartManager.js`)
- Dynamically loads Chart.js from CDN.
- Fetches users, revenue, and orders data concurrently with `Promise.all`.
- Creates chart types:
  - Line (revenue)
  - Bar (users)
  - Doughnut (orders)
  - Mixed (users + revenue)
- Subscribes to `DataManager` updates for chart refresh.
- Uses debounced resize handling to reduce redraw overhead.

### PerformanceMonitor (`src/modules/PerformanceMonitor.js`)
- Observes Web Vitals:
  - LCP
  - FID
  - CLS
- Collects memory metrics (when browser supports `performance.memory`).
- Tracks interaction events (`click`, `keydown`, `scroll`, `touchstart`).
- Stores recent metrics in memory and localStorage.
- Generates summary statistics (count, avg, min, max).

## Design Patterns Used
- Observer pattern:
  - `DataManager.subscribe()` for data updates.
  - `PerformanceMonitor.subscribe()` for metric events.
- Dependency injection:
  - `DashboardApp` provides shared `DataManager` to `ChartManager`.
- Modular encapsulation:
  - Each class has a single focused responsibility.

## Performance-Focused Decisions
- Concurrent data fetch for faster chart initialization.
- API response caching to reduce redundant requests.
- Debounced window resize listener for chart updates.
- Limited metric rendering in UI to avoid DOM growth.
- Bounded localStorage metric history.

## Current Constraints and Risks
- `ChartManager` expects a container by ID, while dashboard markup defines `charts-grid` as a class.
- API base path plus endpoint path currently risks duplicate `/api` segments depending on endpoint usage.
- Button insertion expects `.content-header`; missing element causes runtime failure.
- Metric rendering assumes numeric values (`toFixed(2)`), which can fail for non-number metrics.

## Recommended Next Refactors
- Add a `destroy()` lifecycle to clean intervals/listeners/observers.
- Normalize API endpoint strategy (base path vs full path).
- Align chart container selector contract (class or ID, one standard).
- Add null-guarded UI hooks for optional layout regions.
- Add unit tests for:
  - Data cache behavior
  - Chart update routing
  - Metric formatting safety