# CSS Architecture Guide

## Overview
This page uses a single stylesheet with a token-first, component-based structure.
The architecture is organized from global foundations to page sections, then responsive and animation rules.

## 1) Design Tokens (`:root`)
Global CSS custom properties define colors, spacing behavior, radius, shadow, and transitions.

- Colors:
	- `--primary-color`: brand blue
	- `--secondary-color`: slate secondary tone
	- `--success-color`, `--warning-color`, `--error-color`: status colors
	- `--background-color`: app background
	- `--text-color`: primary text
- Shape and effects:
	- `--border-radius`: shared corner rounding
	- `--shadow`: default elevation
	- `--transition`: shared motion timing

Using these tokens keeps visual consistency across header, sidebar, cards, and footer.

## 2) Global Foundation
- Universal reset on `*`:
	- clears default margin/padding
	- enforces `box-sizing: border-box`
- `body` sets typography, line-height, foreground color, and page background.

## 3) Layout Architecture
The page uses a two-level layout:

1. Top-level header bar (`.header` + `.nav`)
2. Main content grid (`.main`) with:
	 - fixed-width sidebar column (`250px`)
	 - flexible content column (`1fr`)

### Main container details
- `.main` uses CSS Grid
- constrained by `max-width: 1200px`
- centered with `margin: 0 auto`
- balanced spacing via `gap` and `padding`

## 4) Component Structure

### Header and Navigation
- `.header`: sticky top surface with elevation
- `.nav`: flex container for brand + menu alignment
- `.nav-brand h1`: token-based brand styling
- `.nav-menu`: horizontal flex list
- `.nav-menu a`:
	- hover color transition
	- animated underline via `::after`

### Sidebar
- `.sidebar`: card-like surface using shared radius and shadow
- `.sidebar-nav ul`: list reset
- `.sidebar-nav a`: block-level clickable items
- hover state swaps to primary background and white text

### Content and Cards
- `.content`: white container panel with shadow/radius
- `.dashboard-grid`: responsive grid using `repeat(auto-fit, minmax(250px, 1fr))`
- `.card`:
	- gradient background
	- overlay sweep effect through `.card::before`
	- hover lift (`translateY`) and stronger shadow
- `.metric`: emphasized numeric scale for KPIs

### Footer
- `.footer` uses high-contrast surface (`--text-color`) with centered text.

## 5) Responsive Strategy
Single breakpoint at `max-width: 768px` adapts layout for smaller screens:

- `.main` collapses to one column
- `.nav` stacks vertically
- `.nav-menu` becomes vertical
- `.dashboard-grid` becomes single-column

This keeps navigation and dashboard cards readable on mobile.

## 6) Motion and Animation
- Shared transition timing is tokenized with `--transition`.
- Entry animation:
	- `@keyframes fadeInUp` moves from lower + transparent to final position
	- `.card` applies this animation on load
	- staggered delays on `.card:nth-child(2)` and `.card:nth-child(3)`

## 7) Naming Conventions Used
This stylesheet follows semantic class naming by section/component (for example: `.nav-menu`, `.sidebar-nav`, `.dashboard-grid`) rather than strict BEM syntax.

## 8) Maintenance Notes
- Add new reusable values to `:root` first.
- Keep component rules grouped by section to preserve readability.
- Reuse existing tokens (`--shadow`, `--border-radius`, `--transition`) before introducing new visual patterns.