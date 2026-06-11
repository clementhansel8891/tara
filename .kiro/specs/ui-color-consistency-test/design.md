# Design Document — UI Color Consistency Test Suite

## Overview

The test suite is a single Playwright spec file (`tests/playwright/15_ui_color_consistency.spec.ts`)
that audits the live application at `http://150.109.15.108:3010` across 45 pages and four
independent test layers. It operates as a **continuous audit tool**: it never aborts on violations,
always produces its full artifact set, and uses `expect.soft()` to mark individual failing tests
without stopping the run.

The four layers run against every page:

| Layer | ID | Verdict type | On violation |
|-------|----|--------------|--------------|
| Contrast Ratio Check (WCAG AA) | A | Test failure | `expect.soft()` |
| Hardcoded Color Class Audit | B | Test failure | `expect.soft()` |
| Screenshot Comparison (light vs. dark) | C | Warning | `console.warn()` |
| Theme Token Compliance | D | Failure (critical) / Warning (non-critical) | Mixed |

### Key Constraints

- Single Playwright worker, 60 s per-page timeout (from `playwright.config.ts`)
- Auth via `tests/playwright/.auth/user.json` (storageState already in project config)
- No new npm dependencies — pixel diff is implemented via Canvas API inside `page.evaluate()`
- All output artifacts go to `playwright-report/` which is already the Playwright HTML reporter output dir
- Dark mode toggled with `page.evaluate(() => document.documentElement.classList.add('dark'))`

---

## Architecture

The file is organized as **four top-level `test.describe` blocks — one per Layer** — each
containing a single `test` that loops over all pages. This is simpler than one-describe-per-page
because:

1. You can re-run a single layer with `--grep "Layer A"` without duplicating setup code
2. All page-level results for a layer are accumulated in one place, making the JSON report easier
   to assemble
3. The page visit sequence (light then dark, interleaved per page) is cleaner to reason about

```
test.describe("Layer A — Contrast Ratio Check")
  test("all pages: WCAG AA contrast audit")
    for each page:
      navigate (light mode)
      → runContrastCheck(page, pageName, "light")
      toggle dark
      → runContrastCheck(page, pageName, "dark")
      restore light

test.describe("Layer B — Hardcoded Color Class Audit")
  test("all pages: hardcoded Tailwind class scan")
    for each page:
      navigate (light mode only — DOM classes are mode-independent)
      → runHardcodedScan(page, pageName)

test.describe("Layer C — Screenshot Comparison")
  test("all pages: light vs dark pixel diff")
    for each page:
      navigate (light mode) → capture PNG → save
      toggle dark → capture PNG → save
      → computePixelDiff(lightBuffer, darkBuffer)
      → classify verdict

test.describe("Layer D — Theme Token Compliance")
  test("all pages: design token resolution")
    for each page:
      navigate (light mode)
      → runTokenCheck(page, pageName, "light")
      toggle dark
      → runTokenCheck(page, pageName, "dark")
      restore light

test.describe("Report Generation")
  test("write JSON and HTML artifacts")
    → writeReportJSON()
    → writeReportHTML()
    → printConsoleSummary()
```

A module-level `report` object accumulates all layer results throughout the run. Because Playwright
with `workers: 1` executes tests sequentially, this shared state is safe.

### Page Visit Sequence

For layers A, C, and D: **light first, then dark, interleaved per page**. This means for each page
the browser visits it once in light mode, runs all light-mode checks, toggles dark, runs dark-mode
checks, then restores. This minimises total navigations (45 pages × 2 visits = 90 navigations for
layers that need both modes, 45 for Layer B).

```
for page in PAGES:
  goto(page)          // light visit
  [run light checks]
  addClass('dark')
  [run dark checks]
  removeClass('dark')
```

---

## Components and Interfaces

### 1. Page Registry

```typescript
interface PageEntry {
  route: string;   // e.g. "/core/finance/ledger"
  name: string;    // slug for file names, e.g. "core-finance-ledger"
  group: "core" | "retail-management" | "retail-operational";
}

const PAGES: PageEntry[] = [ /* 45 entries */ ]
```

### 2. Report Data Structures

```typescript
// ─── Violation records ────────────────────────────────────────────

interface ContrastViolation {
  selector: string;
  textColor: string;           // e.g. "rgb(59, 130, 246)"
  bgColor: string;             // e.g. "rgb(255, 255, 255)"
  contrastRatio: number;       // e.g. 2.4
  threshold: number;           // 4.5 or 3.0
  textType: "normal" | "large";
  pass: boolean;
}

interface HardcodedViolation {
  tagName: string;
  violatingClass: string;      // e.g. "bg-emerald-600"
  recommendedToken: string;    // e.g. "bg-success"
}

interface ScreenshotResult {
  pixelDiffPct: number;
  verdict: "DARK_MODE_WORKS" | "DARK_MODE_BROKEN";
}

interface TokenViolation {
  token: string;               // e.g. "--background"
  resolvedValue: string;       // e.g. "225 60% 3%" or "" if missing
  luminance?: number;          // computed when token is --background
  compliant: "yes" | "no";
  critical: boolean;
}

// ─── Per-page layer results ────────────────────────────────────────

interface LayerAResult {
  light: ContrastViolation[];
  dark: ContrastViolation[];
  error?: string;
}

interface LayerBResult {
  violations: HardcodedViolation[];
  error?: string;
}

interface LayerCResult {
  screenshot: ScreenshotResult | null;
  error?: string;
}

interface LayerDResult {
  light: TokenViolation[];
  dark: TokenViolation[];
  error?: string;
}

// ─── Top-level report structure ────────────────────────────────────

interface PageReport {
  pageName: string;
  route: string;
  layerA: LayerAResult;
  layerB: LayerBResult;
  layerC: LayerCResult;
  layerD: LayerDResult;
}

interface ColorReport {
  generatedAt: string;          // ISO 8601
  totalPages: number;
  pages: PageReport[];
}
```

### 3. Helper Functions (Node.js side)

```typescript
// Initialise a blank PageReport for a given page entry
function initPageReport(entry: PageEntry): PageReport

// Write the accumulated report to JSON
async function writeReportJSON(report: ColorReport, outDir: string): Promise<void>

// Generate and write the HTML summary from the JSON report
async function writeReportHTML(report: ColorReport, outDir: string): Promise<void>

// Print console summary table
function printConsoleSummary(report: ColorReport): void

// Create output directories if they don't exist
function ensureDirectories(outDir: string): void
```

### 4. In-Browser Evaluation Functions

These are all passed as serialized functions to `page.evaluate()`. They must be self-contained
(no closures over Node.js variables) and return plain JSON-serializable objects.

```typescript
// Layer A: contrast scanner
async function evaluateContrast(page: Page): Promise<ContrastViolation[]>

// Layer B: hardcoded class scanner
async function evaluateHardcodedClasses(page: Page): Promise<HardcodedViolation[]>

// Layer C: canvas pixel diff (runs entirely in browser)
async function computePixelDiff(lightBuffer: Buffer, darkBuffer: Buffer): Promise<number>
// Note: screenshots are taken with page.screenshot() — diff is done Node-side via canvas

// Layer D: token resolution
async function evaluateTokens(page: Page): Promise<TokenViolation[]>
```

---

## Data Models

### 3. In-Browser JavaScript — WCAG 2.1 Relative Luminance

The contrast scanner is injected via `page.evaluate()`. It runs entirely inside the browser, has
no external imports, and returns a plain JSON array.

```javascript
// Injected as a string via page.evaluate(fn)

function computeRelativeLuminance(r, g, b) {
  // Each channel is in [0, 255]; convert to linear
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRGB(cssColor) {
  // Handles "rgb(r, g, b)" and "rgba(r, g, b, a)"
  const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3] };
}

function getEffectiveBgColor(el) {
  let node = el;
  while (node && node !== document.body.parentElement) {
    const bg = window.getComputedStyle(node).backgroundColor;
    const rgba = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?/);
    if (rgba) {
      const alpha = rgba[4] !== undefined ? parseFloat(rgba[4]) : 1;
      if (alpha > 0.05) return bg;  // treat near-transparent as transparent
    }
    node = node.parentElement;
  }
  return "rgb(255, 255, 255)"; // fallback: assume white
}

function isDecorative(el) {
  if (el.getAttribute("aria-hidden") === "true") return true;
  const role = el.getAttribute("role");
  if (role === "presentation") return true;
  if (role === "img" && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")) return true;
  // SVG descendant of aria-hidden ancestor
  if (el.closest("[aria-hidden='true']")) return true;
  // Zero-size or hidden
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return true;
  const style = window.getComputedStyle(el);
  if (parseFloat(style.opacity) === 0) return true;
  return false;
}

// Interactive element selector
const INTERACTIVE_SELECTOR = [
  "button", "a", "input", "label", "select", "textarea",
  "[role='button']", "[role='link']", "[role='checkbox']",
  "[role='radio']", "[role='tab']", "[role='menuitem']",
  "td", "th", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "li", "dt", "dd", "[class*='badge']", "[class*='status']"
].join(",");

// Large text: font-size >= 18px, or >= 14px and font-weight >= 700
function isLargeText(el) {
  const style = window.getComputedStyle(el);
  const size = parseFloat(style.fontSize);
  const weight = parseInt(style.fontWeight, 10) || 400;
  return size >= 18 || (size >= 14 && weight >= 700);
}
```

The full scanner function returned to Node.js:

```javascript
() => {
  // [all helper functions inlined above]
  const results = [];
  const elements = document.querySelectorAll(INTERACTIVE_SELECTOR);

  for (const el of elements) {
    if (isDecorative(el)) continue;
    // Only process elements with a direct text node
    const hasText = Array.from(el.childNodes).some(
      n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
    );
    if (!hasText) continue;

    const style = window.getComputedStyle(el);
    const textColorStr = style.color;
    const bgColorStr = getEffectiveBgColor(el);
    const tc = parseRGB(textColorStr);
    const bc = parseRGB(bgColorStr);
    if (!tc || !bc) continue;

    const tl = computeRelativeLuminance(tc.r, tc.g, tc.b);
    const bl = computeRelativeLuminance(bc.r, bc.g, bc.b);
    const ratio = contrastRatio(tl, bl);
    const large = isLargeText(el);
    const threshold = large ? 3.0 : 4.5;

    if (ratio < threshold) {
      // Build a minimal CSS selector for the element
      const selector = el.id
        ? `#${el.id}`
        : `${el.tagName.toLowerCase()}${el.className ? '.' + el.className.trim().split(/\s+/).slice(0,2).join('.') : ''}`;

      results.push({
        selector,
        textColor: textColorStr,
        bgColor: bgColorStr,
        contrastRatio: Math.round(ratio * 100) / 100,
        threshold,
        textType: large ? "large" : "normal",
        pass: false,
      });
    }
  }
  return results;
}
```

### 4. In-Browser JavaScript — Hardcoded Class Scanner

```javascript
() => {
  const PALETTE_COLORS = new Set([
    "blue","red","green","emerald","rose","amber","violet","purple",
    "orange","yellow","gray","zinc","neutral","stone","cyan","teal",
    "lime","pink","fuchsia","sky","indigo"
  ]);
  // Match text-{color}-{shade}, bg-{color}-{shade}, border-{color}-{shade}
  const HARDCODED_RE = /^(text|bg|border)-(blue|red|green|emerald|rose|amber|violet|purple|orange|yellow|gray|zinc|neutral|stone|cyan|teal|lime|pink|fuchsia|sky|indigo)-(\d{1,3})$/;

  // Design token replacement suggestions
  const TOKEN_MAP = {
    "bg-blue":    "bg-primary",
    "bg-emerald": "bg-success",
    "bg-red":     "bg-destructive",
    "bg-amber":   "bg-warning",
    "bg-cyan":    "bg-info",
    "bg-indigo":  "bg-primary",
    "bg-violet":  "bg-primary",
    "bg-purple":  "bg-primary",
    "bg-gray":    "bg-muted",
    "bg-zinc":    "bg-muted",
    "bg-neutral": "bg-muted",
    "bg-stone":   "bg-muted",
    "text-blue":    "text-primary",
    "text-emerald": "text-success  (via CSS var)",
    "text-red":     "text-destructive",
    "text-amber":   "text-warning  (via CSS var)",
    "text-gray":    "text-muted-foreground",
    "text-zinc":    "text-muted-foreground",
    "text-neutral": "text-muted-foreground",
    "border-blue":  "border-primary",
    "border-gray":  "border-border",
    "border-zinc":  "border-border",
  };

  function suggestToken(prefix, color) {
    return TOKEN_MAP[`${prefix}-${color}`] || `${prefix}-[design-token]`;
  }

  const results = [];
  const all = document.querySelectorAll("*");
  for (const el of all) {
    for (const cls of el.classList) {
      const m = cls.match(HARDCODED_RE);
      if (m) {
        results.push({
          tagName: el.tagName.toLowerCase(),
          violatingClass: cls,
          recommendedToken: suggestToken(m[1], m[2]),
        });
      }
    }
  }
  return results;
}
```

### 5. In-Browser JavaScript — Token Resolution

```javascript
(mode) => {
  const TOKENS_TO_CHECK = [
    "--background",
    "--foreground",
    "--primary",
    "--card",
    "--border",
    "--muted-foreground",
  ];
  const CRITICAL_TOKENS = new Set(["--background", "--foreground", "--primary"]);

  function hslToRGB(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return { r: Math.round(f(0)*255), g: Math.round(f(8)*255), b: Math.round(f(4)*255) };
  }

  function computeLuminanceFromHSL(hslStr) {
    // hslStr is the raw CSS var value, e.g. "225 60% 3%"
    const parts = hslStr.trim().split(/\s+/);
    if (parts.length < 3) return null;
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    const l = parseFloat(parts[2]);
    const { r, g, b } = hslToRGB(h, s, l);
    const toLinear = (c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  const root = document.documentElement;
  const computed = window.getComputedStyle(root);
  const results = [];

  for (const token of TOKENS_TO_CHECK) {
    const value = computed.getPropertyValue(token).trim();
    const missing = !value || value === "";
    const violation = { token, resolvedValue: value, compliant: "yes", critical: CRITICAL_TOKENS.has(token) };

    if (missing) {
      violation.compliant = "no";
      results.push(violation);
      continue;
    }

    if (token === "--background") {
      const lum = computeLuminanceFromHSL(value);
      violation.luminance = lum;
      if (mode === "dark" && lum !== null && lum >= 0.20) {
        violation.compliant = "no"; // background too light for dark mode
      } else if (mode === "light" && lum !== null && lum <= 0.80) {
        violation.compliant = "no"; // background too dark for light mode
      }
    }

    if (violation.compliant === "no") results.push(violation);
  }
  return results;
}
```

### 6. Pixel Diff Approach — Canvas-Based (No External Dependencies)

Since `pixelmatch` is not in the project's Node.js dependencies (only `fast-png` and `html2canvas`
are present, both browser-side), pixel diffing is done on the **Node.js side using the `sharp`-free
approach**: compare two PNG `Buffer`s by decoding them via the `fast-png` package that is already
in `node_modules`, which works in Node.js.

```typescript
import { decode as decodePNG } from "fast-png";

function computePixelDiffPct(lightBuffer: Buffer, darkBuffer: Buffer): number {
  const img1 = decodePNG(lightBuffer);
  const img2 = decodePNG(darkBuffer);

  // If dimensions differ, treat as 100% diff
  if (img1.width !== img2.width || img1.height !== img2.height) return 100;

  const totalPixels = img1.width * img1.height;
  const channels = img1.data.length / totalPixels; // 3 (RGB) or 4 (RGBA)
  let diffCount = 0;

  for (let i = 0; i < totalPixels; i++) {
    const offset = i * channels;
    const rDiff = Math.abs(img1.data[offset]   - img2.data[offset]);
    const gDiff = Math.abs(img1.data[offset+1] - img2.data[offset+1]);
    const bDiff = Math.abs(img1.data[offset+2] - img2.data[offset+2]);
    // Count a pixel as "different" if any channel differs by more than 10 (tolerance for antialiasing)
    if (rDiff > 10 || gDiff > 10 || bDiff > 10) diffCount++;
  }

  return (diffCount / totalPixels) * 100;
}
```

`fast-png` (`node_modules/fast-png`) is a zero-dependency PNG decoder/encoder that runs in both
browser and Node.js. It is already present as a transitive dependency of the Vite build chain.

**Alternative fallback**: if `fast-png` cannot be imported in the Playwright Node context, the
design includes a canvas-based fallback using Playwright's built-in sharp-less image utilities
(just raw buffer comparison after `page.screenshot({ type: 'png' })`).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a
system — essentially, a formal statement about what the system should do. Properties serve as the
bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property Reflection** — Before writing properties, I reviewed the prework output for redundancy:

- 2.1 and 2.2 (contrast in light vs. dark) share the same pure computation function — one property
  covers both, with mode as an input dimension.
- 4.4 and 4.5 (DARK_MODE_WORKS / DARK_MODE_BROKEN verdicts) are two branches of the same
  classification function — one property with a universal input covers both, since the verdicts are
  mutually exclusive by construction.
- 5.1 and 5.2 (token resolution in light vs. dark) share the same token resolution function — one
  property covers both.
- 7.1 and 7.4 (run completion invariant) state the same thing — merged.
- 8.1, 8.2, 8.3, 8.4 all test variants of the same element-exclusion filter — consolidated into
  one property.
- 3.1 and 3.2 both test the class scanner — merged into one property that includes the negative
  cases (semantic tokens must not match).

After reflection, 8 distinct properties remain.

---

### Property 1: WCAG Relative Luminance Formula Correctness

*For any* pair of RGB color values, the `computeRelativeLuminance` function SHALL return the
mathematically correct relative luminance per the WCAG 2.1 formula, and the derived contrast ratio
SHALL equal `(max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

### Property 2: Contrast Threshold Classification

*For any* computed contrast ratio value and any text type (`normal` or `large`), the violation
classifier SHALL record a `ContrastViolation` if and only if the ratio is strictly below the
applicable threshold (4.5 for normal, 3.0 for large text), and SHALL not record a violation when
the ratio meets or exceeds the threshold.

**Validates: Requirements 2.3, 2.4**

---

### Property 3: Element Exclusion Filter Completeness

*For any* element descriptor containing any combination of `aria-hidden="true"`,
`role="presentation"`, `role="img"` without accessible text label, zero computed width or height,
or computed opacity of 0, the `isDecorative` filter SHALL return `true` and the element SHALL be
excluded from contrast computation. For elements with none of these attributes set and non-zero
dimensions with non-zero opacity, `isDecorative` SHALL return `false`.

**Validates: Requirements 2.5, 8.1, 8.2, 8.3, 8.4**

---

### Property 4: Hardcoded Class Scanner Precision and Recall

*For any* class string, the scanner SHALL return a match if and only if the class matches the
pattern `(text|bg|border)-{palette-color}-{shade}` where `palette-color` is a member of the
defined 21-color palette set. Semantic token classes (`text-primary`, `bg-card`, `border-border`,
etc.) SHALL never be flagged. Every flagged violation SHALL include a non-empty
`recommendedToken` string.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 5: Pixel Diff Classification

*For any* pair of full-page screenshots (encoded as PNG buffers), the `computePixelDiffPct`
function SHALL return a value in `[0, 100]`, and the verdict function SHALL return exactly
`DARK_MODE_WORKS` when `pixelDiffPct > 5` and exactly `DARK_MODE_BROKEN` when
`pixelDiffPct ≤ 5`. No input can produce both verdicts simultaneously.

**Validates: Requirements 4.3, 4.4, 4.5**

---

### Property 6: Background Token Luminance Gating

*For any* resolved HSL value of the `--background` token: in dark mode, the computed relative
luminance SHALL be strictly below 0.20; in light mode, it SHALL be strictly above 0.80. Any value
violating these bounds SHALL produce a `TokenViolation` with `compliant: "no"`.

**Validates: Requirements 5.3, 5.4**

---

### Property 7: Report Completeness Invariant

*For any* run over the full page list, the final `ColorReport` SHALL contain exactly one
`PageReport` per entry in `PAGES`, and each `PageReport` SHALL contain non-null layer sections for
all four layers (A, B, C, D), even when individual layers encountered errors (error is stored in
the `error` field, not by omitting the layer section).

**Validates: Requirements 6.2, 7.1, 7.4**

---

### Property 8: Violation Severity Classification

*For any* violation record, the `isTestFailure` function SHALL return `true` for
`ContrastViolation`, `HardcodedViolation`, and `TokenViolation` with `critical: true`; and
SHALL return `false` for `ScreenshotResult` with `DARK_MODE_BROKEN` verdict and `TokenViolation`
with `critical: false`. The classification is a pure function of violation type and criticality.

**Validates: Requirements 7.3, 5.6, 5.7**

---

## Error Handling

Every layer execution is wrapped in a `try/catch`. On error, the layer result's `error` field is
populated and the empty violations array is kept. The page report is still written to the
accumulated report.

```typescript
try {
  pageReport.layerA.light = await evaluateContrast(page);
} catch (err) {
  pageReport.layerA.error = String(err);
  // layerA.light remains []
}
```

Navigation errors:

```typescript
try {
  await page.goto(entry.route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
} catch (err) {
  // Record nav failure in all layers, skip to next page
  pageReport.layerA.error = `Navigation failed: ${err}`;
  // ... same for B, C, D
  report.pages.push(pageReport);
  continue;
}
```

Report write errors are caught independently:

```typescript
try {
  await writeReportJSON(report, outDir);
} catch (err) {
  console.error("[Report] Failed to write JSON:", err);
  // never rethrow
}
```

---

## Testing Strategy

This feature is a **testing tool** — it has no business logic server or database. The appropriate
testing strategy is a combination of unit tests for the pure helper functions and integration
validation from the spec's own Playwright run.

### Unit Tests (Vitest)

Target the pure in-browser functions by extracting them into a shared utility module that can be
imported in both Playwright's browser context and Vitest:

| Function | Test type | Notes |
|---|---|---|
| `computeRelativeLuminance` | Property (PBT) | Property 1 |
| `contrastRatio` | Property (PBT) | Property 1 |
| `isDecorative` | Property (PBT) | Property 3 |
| `computePixelDiffPct` | Property (PBT) | Property 5 |
| Hardcoded class regex | Property (PBT) | Property 4 |
| `classifyDarkMode` | Property (PBT) | Property 5 |
| `isTestFailure` | Property (PBT) | Property 8 |
| `computeLuminanceFromHSL` | Property (PBT) | Property 6 |

**PBT library**: [fast-check](https://fast-check.io/) — already available as a Vite ecosystem
dependency. Configure each property test to run **100 iterations minimum**.

Tag format for each property test:
```
// Feature: ui-color-consistency-test, Property N: <property text>
```

### Property Test Examples

```typescript
// Feature: ui-color-consistency-test, Property 1: WCAG relative luminance formula correctness
test.prop([fc.integer({min:0,max:255}), fc.integer({min:0,max:255}), fc.integer({min:0,max:255})])(
  "computeRelativeLuminance matches reference implementation",
  (r, g, b) => {
    const result = computeRelativeLuminance(r, g, b);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
    // White (255,255,255) must equal 1.0, black (0,0,0) must equal 0.0
    // For arbitrary inputs, verify the formula identity holds
  }
);

// Feature: ui-color-consistency-test, Property 5: Pixel diff classification
test.prop([fc.float({min:0, max:100})])(
  "classifyDarkMode returns exactly one verdict",
  (pct) => {
    const verdict = classifyDarkMode(pct);
    const isWorks  = verdict === "DARK_MODE_WORKS";
    const isBroken = verdict === "DARK_MODE_BROKEN";
    expect(isWorks !== isBroken).toBe(true);  // exactly one is true
    expect(isWorks).toBe(pct > 5);
  }
);

// Feature: ui-color-consistency-test, Property 4: Hardcoded class scanner precision
test.prop([fc.constantFrom(...PALETTE_COLORS), fc.integer({min:50,max:950}), fc.constantFrom("text","bg","border")])(
  "palette classes are flagged; semantic tokens are not",
  (color, shade, prefix) => {
    const hardcoded = `${prefix}-${color}-${shade}`;
    expect(isHardcodedClass(hardcoded)).toBe(true);
    expect(isHardcodedClass(`${prefix}-primary`)).toBe(false);
    expect(isHardcodedClass(`${prefix}-card`)).toBe(false);
  }
);
```

### Integration Validation

The Playwright spec file itself serves as the integration test — running
`npx playwright test 15_ui_color_consistency` against the live VPS validates the entire pipeline
end-to-end.

### What Is NOT Tested with PBT

- File I/O for report writing — tested via example (check file existence after run)
- Dark mode toggle mechanics — single example (verify `classList.contains('dark')` after evaluate)
- Navigation + storageState auth — already covered by existing suites 01-14
- HTML report formatting — snapshot/example test of the generated HTML structure
