# CSS Architecture Guide - Apex Metrics Dashboard

This guide outlines the CSS architecture and design tokens implemented in the Apex Metrics Dashboard.

## Methodology
We use a clean, semantic CSS architecture centered around design tokens and responsive containers. This keeps the codebase highly readable and maintainable at under 250 lines.

### 1. Design Tokens (CSS Custom Properties)
We define all design system attributes as CSS custom properties in the `:root` pseudo-class:
- **Application Context**: `--bg-app` for primary workspace backdrops; `--bg-surface` for cards and panels.
- **Brand Colors**: Custom color pairs like `--indigo`, `--violet`, and `--emerald` with matching light backgrounds (`--indigo-bg`, etc.) to represent metrics distinctively.
- **Spacing & Radius**: Standardized borders (`--border`), corners (`--radius: 0.75rem`), and soft drop shadows (`--shadow`).
- **Timing Curves**: Fast and smooth ease transitions (`--transition`) for hover response.

### 2. Component Structures
We use semantic layout classes to format components uniquely:
- **Cards Grid**: The `.dashboard-grid` layout controls the distribution of metrics using automated column fitting.
- **Metric Cards**: The `.card` class handles padding, hover translation, shadows, and opacity transitions. Subclasses (`.card-indigo`, `.card-violet`, `.card-emerald`) define contextual indicator background highlights.
- **Activity Log Feed**: The `.logs-panel` controls log container paddings, borders, list item margins, and visual timestamp styles.

### 3. Responsive Web Design
- **Flexbox & Grid Layouts**: We structure page layouts using flexible grid grids.
- **Columns Wrapping**: Card lists automatically wrap to the next row using `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))`.
- **Media Queries**: Responsive rules target viewport boundaries below `768px` to collapse sidebar layouts into clean single-column formats.

### 4. Interactive Micro-Animations
We introduce low-overhead animations using CSS keyframes:
- `slideUp`: Delays card opacity fades to render soft entry transitions.
- `rotateSymbol`: Spines brand icons continuously to denote activity.
- `blink`: Pulses the status feed dot indicator in real-time.