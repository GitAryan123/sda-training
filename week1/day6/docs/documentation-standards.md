# Documentation Standards

> **Project:** Apex Telemetry Dashboard — SDA Week 1  
> These standards apply to all markdown files, inline code comments, and JSDoc in this repository.

---

## 1. Writing Guidelines

### Tone and Voice
- Write for a developer who is unfamiliar with this specific file
- Prefer **active voice**: "The hook fetches data" not "Data is fetched by the hook"
- Avoid filler phrases: "basically", "simply", "just", "obviously"
- Use second person for instructions: "Run `npm run dev`" not "The developer runs..."

### Clarity Rules
- **One idea per sentence** — break long sentences into bullets
- **Define acronyms** on first use: "Core Web Vitals (CWV)"
- **Avoid jargon** unless it is the industry standard term
- **Link to references** for non-obvious concepts (MDN, RFC, etc.)
- **Use examples** — code without a usage example is incomplete

### Code Examples
- All code blocks must specify a language for syntax highlighting
  - ✅ ` ```jsx ` 
  - ❌ ` ``` ` (unlabelled)
- Code examples must be **runnable** or clearly marked as pseudo-code
- Show both the import and the usage in component examples

---

## 2. Markdown Structure Standards

### File Headers
Every documentation file must start with:
```markdown
# Document Title

> **Project:** Project Name  
> **Version:** x.x  
> **Last Updated:** Month Year  
```

### Heading Hierarchy
- Use one `# H1` per file (file title only)
- Use `## H2` for major sections
- Use `### H3` for subsections
- Never skip levels (no H4 without a parent H3)

### Tables
- All tables must have headers
- Align content columns consistently
- Use `✅` / `❌` for boolean fields
- Use `—` for N/A or empty required fields

### Alerts (GitHub Markdown)
Use GitHub-flavoured alert blockquotes for callouts:
```markdown
> **Note:** Background or helpful context

> **Warning:** Potential gotcha or common mistake

> **Important:** Critical step that must not be skipped
```

---

## 3. Code Comment Standards

### JavaScript / JSX Comments

**File-level comment** (top of every service or hook file):
```javascript
/**
 * ApiService — REST client with memory caching, exponential retry backoff,
 * and sliding-window rate limiting.
 *
 * @module ApiService
 * @version 1.0.0
 */
```

**Function-level JSDoc** (for all exported functions):
```javascript
/**
 * Fetches data from the given endpoint with cache and retry logic.
 *
 * @param {string} endpoint - API path, e.g. '/revenue'
 * @param {Object} [options={}] - Optional fetch config
 * @param {boolean} [options.cache=true] - Whether to use cache
 * @param {number} [options.cacheTTL=300000] - Cache TTL in ms
 * @returns {Promise<Object>} Resolved response data
 * @throws {Error} On rate limit exceeded or all retries exhausted
 */
async request(endpoint, options = {}) { ... }
```

**Inline comments** — use for non-obvious logic only:
```javascript
// Exponential backoff: wait longer with each failed attempt
const delay = retryDelay * Math.pow(2, attempt - 1);

// Jitter prevents synchronized retries (thundering herd problem)
const jitter = Math.random() * 200 - 100;
```

### CSS Comments
```css
/* ===== COMPONENT: MetricsCard ===== */

/* Primary metric value — use large font for visual hierarchy */
.card-value {
  font-size: 1.65rem;
  font-weight: 700;
}

/* Positive/negative badges use semantic colors — never plain red/green */
.card-change.positive { background: #ecfdf5; color: #065f46; }
.card-change.negative { background: #fef2f2; color: #991b1b; }
```

---

## 4. File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React Component | PascalCase.jsx | `MetricsCard.jsx` |
| Custom Hook | camelCase.js | `useRealTimeData.js` |
| Service Class | PascalCase.js | `ApiService.js` |
| CSS Module | PascalCase.css | `Dashboard.css` |
| Documentation | kebab-case.md | `api-documentation.md` |
| Utility | camelCase.js | `helpers.js` |

---

## 5. Git Commit Standards

Follow **Conventional Commits** format:
```
type(scope): short description (max 72 chars)

Optional body: why this change was made, not what.
```

| Type | When to Use |
|------|------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no feature/fix |
| `perf` | Performance improvement |
| `chore` | Build process, dependency updates |

**Examples:**
```bash
feat(day5): add WebSocketService with exponential reconnection backoff
fix(dashboard): remove horizontal scroll on mobile chart viewport
docs(day6): add system architecture and UML diagrams
style(dashboard): align filter labels vertically using align-items: center
```

---

## 6. Review Process Checklist

Before marking a PR as ready for review:

**Code Quality:**
- [ ] `npm run build` exits with code 0
- [ ] No `console.log` left in production paths (only `console.warn/error`)
- [ ] No hardcoded strings that should be constants
- [ ] All `useEffect` hooks have proper cleanup returns

**Documentation:**
- [ ] New components have JSDoc on their props
- [ ] New hooks are documented in `docs/`
- [ ] `CHANGELOG.md` updated with brief description

**Design:**
- [ ] Mobile tested at 390px viewport width
- [ ] Desktop tested at 1440px viewport width
- [ ] Uses `Outfit` font and project CSS variables (`--primary`, `--border`, etc.)
- [ ] No hardcoded colors — use tokens or semantic CSS classes

**Accessibility:**
- [ ] Images have `alt` attributes
- [ ] Interactive elements are keyboard accessible
- [ ] Color is not the only signal for status (also use text or icon)
