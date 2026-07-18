# Documentation Templates

> **Project:** Apex Telemetry Dashboard — SDA Week 1  
> These templates are designed to be reused for every new component, hook, and API endpoint added to the project.

---

## Template 1: React Component

Use this template for any new JSX component added to `src/components/`.

---

```markdown
# ComponentName

## Overview
Brief description of what this component renders and why it exists.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | ✅ | — | Display label shown in header |
| `value` | number \| string | ✅ | — | Primary value to render |
| `onChange` | function | ❌ | `undefined` | Callback when user interacts |
| `loading` | boolean | ❌ | `false` | Show skeleton while data fetches |

## Usage

```jsx
import { ComponentName } from './ComponentName';

function ParentPage() {
  return (
    <ComponentName
      title="Revenue"
      value={47250}
      loading={false}
    />
  );
}
```

## Examples

### Loading State
```jsx
<ComponentName title="Revenue" value={0} loading={true} />
```

### Error State
```jsx
<ComponentName title="Revenue" value={0} error="Failed to load data" />
```

## CSS Classes

| Class | Element | Description |
|-------|---------|-------------|
| `.component-name` | Root `div` | Outer card container |
| `.component-name__header` | `div` | Header with icon and title |
| `.component-name__value` | `span` | Large primary value display |
| `.component-name--loading` | Modifier | Applied to root during loading |
| `.component-name--error` | Modifier | Applied to root on error |

## Performance Notes
- Wrap in `React.memo()` if parent re-renders frequently
- Use `useMemo` for any computed/derived values from props

## Accessibility
- [ ] Has `aria-label` on interactive elements
- [ ] Loading state has `aria-busy="true"`
- [ ] Keyboard navigable if interactive
- [ ] Color is not the only differentiator for states

## Testing Checklist
- [ ] Renders correctly with valid props
- [ ] Shows skeleton when `loading=true`
- [ ] Shows error message when `error` is set
- [ ] Snapshot does not change unexpectedly
```

---

## Template 2: Custom React Hook

Use this template for any new hook added to `src/hooks/`.

---

```markdown
# useHookName

## Overview
What problem this hook solves and when to use it.

## Signature

```typescript
function useHookName(endpoint: string, options?: Options): Result
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | string | ✅ | API endpoint path, e.g. `/revenue` |
| `options.enableRealTime` | boolean | ❌ | Whether to open WebSocket subscription |
| `options.cacheTTL` | number | ❌ | Cache lifetime in ms (default 300,000) |

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `data` | object \| null | Fetched/live data, null during first load |
| `loading` | boolean | True while initial fetch is in flight |
| `error` | string \| null | Error message if fetch fails, null otherwise |
| `isConnected` | boolean | Whether WebSocket channel is active |
| `latency` | number | Last measured round-trip time in ms |
| `refresh` | function | Manually re-fetch from source |

## Usage

```jsx
import { useHookName } from '../hooks/useHookName';

function MyComponent() {
  const { data, loading, error, refresh } = useHookName('/revenue', {
    enableRealTime: true
  });

  if (loading) return <Skeleton />;
  if (error) return <ErrorBanner message={error} onRetry={refresh} />;

  return <Chart data={data} />;
}
```

## Implementation Notes
- Uses `useCallback` on `refresh` to maintain stable reference
- Cleanup in `useEffect` returns unsubscribes WebSocket listeners
- Falls back to mock data if API fetch fails (no blank states)

## Edge Cases
- If `endpoint` changes, hook re-fetches automatically
- If component unmounts mid-fetch, state updates are suppressed
- If rate limit hit, error is set and loading becomes false
```

---

## Template 3: API Endpoint

Use this template when documenting a new REST endpoint in `docs/api-documentation.md`.

---

```markdown
# GET /endpoint-name

## Overview
One sentence: what data this endpoint returns and who uses it.

## Endpoint
```
GET /api/v1/endpoint-name
```

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `param1` | string | ✅ | — | Description |
| `param2` | number | ❌ | `10` | Description |

## Request Example

```bash
curl -X GET "http://localhost:5173/api/v1/endpoint-name?param1=value" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

## Success Response `200 OK`

```json
{
  "total": 1000,
  "change": 5.2,
  "labels": ["Mon", "Tue"],
  "values": [450, 550]
}
```

### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `total` | number | Aggregated value for period |
| `change` | number | % change from prior period |
| `labels` | string[] | X-axis labels |
| `values` | number[] | Data points matching labels |

## Error Responses

| Status | Code | Trigger |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid date range format |
| 401 | `UNAUTHORIZED` | Missing auth token |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Database failure |

## Caching
- Client-side TTL: 5 minutes
- Pass `{ cache: false }` to bypass
- Cache key: `url + JSON.stringify(options)`
```

---

## Template 4: Sprint User Story

Use this format when adding stories to `docs/sprint-planning.md`.

---

```markdown
**US-XXX: Story Title**

> As a [role], I want [capability] so that [benefit].

**Acceptance Criteria:**
- [ ] Criterion 1: specific, testable, unambiguous
- [ ] Criterion 2: includes edge case handling
- [ ] Criterion 3: includes mobile/responsive behaviour if UI

**Story Points:** [1 | 2 | 3 | 5 | 8 | 13 | 21]  
**Priority:** 🔴 High | 🟡 Medium | 🟢 Low  
**Dependencies:** US-XXX (if applicable)
```

---

## Template 5: Bug Report

Use this template when filing issues in GitHub or a tracking tool.

---

```markdown
**Bug Title:** [Short description of the issue]

**Environment:**
- Browser: Chrome 126 / Firefox 127 / Safari 17
- Viewport: 390px / 1440px
- OS: Windows 11 / macOS 14

**Steps to Reproduce:**
1. Open the dashboard at `localhost:5173`
2. Resize window to < 480px
3. Click "Revenue" tab in ChartContainer

**Expected Behavior:**
The chart should resize to fit the mobile viewport without horizontal overflow.

**Actual Behavior:**
The SVG chart overflows the card container and adds a horizontal scrollbar.

**Root Cause (if known):**
`min-width: 300px` on `.svg-chart-viewport` prevents `width: 100%` from collapsing it.

**Fix Applied:**
Remove `min-width` and set `width: 100%` in `@media (max-width: 480px)` block.

**Affected Files:**
- `src/components/Dashboard.css` — line 759
```
