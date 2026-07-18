# React Architecture Guide - Day 4

This document defines the custom state model, custom hooks, and layout rules utilized in the Day 4 Advanced React Dashboard.

## 1. Hierarchy & Component Data Flow
The dashboard operates with a strict unidirectional flow under a global data provider:
- **`DataProvider` (`DataContext.js`)**: Wraps the layout in a Context, exposing data synchronization routines, subscriber events, and cache clear controls.
- **`App.jsx`**: Main application container loading structural elements (sidebars, footer headers) and wrapping them in the data provider.
- **`Dashboard.jsx`**: Local reducer orchestrator, binding loading spinners, retry controls, error states, and layout modifiers.
- **`DashboardHeader.jsx` / `MetricsGrid.jsx` / `ChartContainer.jsx`**: Children components displaying stats and handling UI interactions.

## 2. Global State & Reducers
The dashboard's internal states are managed via two separate Reducers:
- **`dataContextReducer` (DataContext)**: Houses the cached resources map and updates loading parameters.
- **`dataReducer` (Dashboard)**: Houses current displayed metrics, dateRange filters, categories, and view modes.

## 3. Performance & Optimization Patterns
- **Responsive SVG Vector Visualizations**: By building interactive vector line charts, bar plots, and doughnut circles directly in React, we bypass external Chart.js bundle loadings and prevent CDN network timeouts.
- **Component Memoization (`React.memo`)**: The `MetricsCard` uses memoization. It only re-renders when inputs (like values or trend metrics) alter.
- **Value Caches (`useMemo`)**: Extracted computations (like string locale conversions or trend indicator formatting) are cached in `useMemo` blocks to avoid unnecessary execution.
