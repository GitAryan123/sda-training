# JavaScript Performance Guide - Day 3

This document outlines the optimization mechanisms and best practices verified in the Day 3 Telemetry Dashboard.

## 1. Instrumentation and Performance Tracking
Core Web Vitals are monitored dynamically through the `PerformanceObserver` API:
- **Largest Contentful Paint (LCP)**: Observes load speed milestones.
- **First Input Delay (FID)**: Captures responsiveness delay during initial input clicks.
- **Cumulative Layout Shift (CLS)**: Validates visual layout stability.
- **Used JS Heap Size**: Queries `performance.memory` at regular intervals to monitor memory leaks.

## 2. API Latency & Network Monitoring
To measure round-trip communication costs:
- Data retrieval delays are calculated by checking `performance.now()` values around fetch commands.
- Results are logged into the telemetry panel, providing a visual profile of latency.

## 3. DOM Rendering & Event Optimization
- **Event Delegation**: Active links are highlighted using event listeners bound to lists.
- **Passive Event Observers**: Event triggers (scrolls, touches) use `{ passive: true }` parameter settings, avoiding main-thread blockings.
- **Window Resize Debouncing**: Window resize updates are throttled using custom debouncers, reducing layout recalcs during resizing.