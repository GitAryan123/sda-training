# JavaScript Architecture Guide - Day 3

This document details the modular system design, communication patterns, and architecture rules applied to the Day 3 Dashboard application.

## 1. Modular ES6+ Structure
The application is partitioned into clear classes using ES modules:
- `DataManager.js`: The central data provider, responsible for networking operations.
- `ChartManager.js`: Decoupled component interface, handling Chart.js wrapper objects and DOM canvases.
- `PerformanceMonitor.js`: Instrumentation layer, listening to browser PerformanceObservers and custom metrics.
- `app.js`: The orchestrator, creating instances, setting up layout selectors, and binding events.

## 2. Design Patterns Applied

### Observer Pattern (Publish-Subscribe)
To prevent tight coupling:
- `DataManager` maintains a subscriber list. When data changes (during refreshes), it notifies all registered charts to trigger standard visual updates.
- `PerformanceMonitor` maintains an observer list. When memory usage or user interactions change, it notifies `app.js` to redraw dashboard sidebar metrics.

### Interceptor Fallback Pattern
To guarantee resilience in sandboxed/offline environments:
- When a `fetch()` call fails or returns non-200 states, `DataManager` intercepts execution to yield randomized mock telemetry with simulated network latency, bypassing server requirements.

## 3. Caching & Memory Management
- **Time-to-Live (TTL) Caching**: The data manager stores payloads in a local Map accompanied by dates. Subsequent requests check expiration and invalidate items after 30 seconds.
- **Cache Invalidation**: Explicit clearing triggers cache deletion.