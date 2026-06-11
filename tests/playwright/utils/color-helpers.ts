/**
 * Shared color-helpers utility module
 * Pure, self-contained helper functions shared between the Playwright spec
 * and the Vitest property-based test suite.
 *
 * All functions are environment-agnostic (Node.js + browser).
 */

// ─── Palette & Token Constants ──────────────────────────────────────────────

/**
 * The 21-color Tailwind palette that constitutes "hardcoded" color classes.
 * Re-exported so consuming modules never duplicate this literal set.
 */
export const PALETTE_COLORS: ReadonlySet<string> = new Set([
  "blue",
  "red",
  "green",
  "emerald",
  "rose",
  "amber",
  "violet",
  "purple",
  "orange",
  "yellow",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "cyan",
  "teal",
  "lime",
  "pink",
  "fuchsia",
  "sky",
  "indigo",
]);

/**
 * Design token replacement suggestions keyed by "prefix-color".
 * Re-exported so the Playwright spec can import it without duplication.
 */
export const TOKEN_MAP: Readonly<Record<string, string>> = {
  "bg-blue": "bg-primary",
  "bg-emerald": "bg-success",
  "bg-red": "bg-destructive",
  "bg-amber": "bg-warning",
  "bg-cyan": "bg-info",
  "bg-indigo": "bg-primary",
  "bg-violet": "bg-primary",
  "bg-purple": "bg-primary",
  "bg-gray": "bg-muted",
  "bg-zinc": "bg-muted",
  "bg-neutral": "bg-muted",
  "bg-stone": "bg-muted",
  "text-blue": "text-primary",
  "text-emerald": "text-success (via CSS var)",
  "text-red": "text-destructive",
  "text-amber": "text-warning (via CSS var)",
  "text-gray": "text-muted-foreground",
  "text-zinc": "text-muted-foreground",
  "text-neutral": "text-muted-foreground",
  "border-blue": "border-primary",
  "border-gray": "border-border",
  "border-zinc": "border-border",
};

// ─── Regex for hardcoded class detection ────────────────────────────────────

/**
 * Matches class strings of the form:
 *   (text|bg|border)-{palette-color}-{shade 1–3 digits}
 *
 * Only shades up to 3 digits are matched intentionally — standard Tailwind
 * shades are 50–950 (all ≤ 3 digits).
 */
const HARDCODED_RE =
  /^(text|bg|border)-(blue|red|green|emerald|rose|amber|violet|purple|orange|yellow|gray|zinc|neutral|stone|cyan|teal|lime|pink|fuchsia|sky|indigo)-(\d{1,3})$/;

// ─── WCAG 2.1 Relative Luminance ────────────────────────────────────────────

/**
 * Converts a single 8-bit color channel to its linear-light value.
 * WCAG 2.1 §1.4.3 formula.
 */
function toLinear(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Computes the WCAG 2.1 relative luminance of an sRGB color.
 *
 * @param r - Red channel [0, 255]
 * @param g - Green channel [0, 255]
 * @param b - Blue channel [0, 255]
 * @returns Relative luminance in [0, 1]
 */
export function computeRelativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// ─── Contrast Ratio ─────────────────────────────────────────────────────────

/**
 * Computes the WCAG 2.1 contrast ratio between two relative luminance values.
 *
 * @param l1 - Relative luminance of color 1
 * @param l2 - Relative luminance of color 2
 * @returns Contrast ratio in [1, 21]
 */
export function contrastRatio(l1: number, l2: number): number {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// ─── Large Text Classification ───────────────────────────────────────────────

/**
 * Determines whether text qualifies as "large text" per WCAG AA.
 * Large text: font-size ≥ 18px, OR font-size ≥ 14px with font-weight ≥ 700.
 *
 * @param fontSize   - Computed font size in px
 * @param fontWeight - Computed font weight (e.g. 400, 700)
 */
export function isLargeText(fontSize: number, fontWeight: number): boolean {
  return fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
}

// ─── Contrast Violation Classification ──────────────────────────────────────

/**
 * Returns `true` when the contrast ratio constitutes a WCAG AA violation for
 * the given text type (i.e. ratio is strictly BELOW the applicable threshold).
 *
 * Thresholds:
 *   - Normal text: 4.5
 *   - Large text:  3.0
 *
 * @param ratio    - Contrast ratio to evaluate
 * @param textType - "normal" | "large"
 */
export function classifyContrastViolation(
  ratio: number,
  textType: "normal" | "large"
): boolean {
  const threshold = textType === "large" ? 3.0 : 4.5;
  return ratio < threshold;
}

// ─── Decorative Element Detection ────────────────────────────────────────────

/**
 * Descriptor object representing the accessibility/sizing attributes of a DOM
 * element. Using a plain object makes this function runnable in both Node.js
 * (for PBT) and browser (via page.evaluate) without DOM dependencies.
 */
export interface DecorativeAttrs {
  /** Whether the element or an ancestor has aria-hidden="true" */
  ariaHidden: boolean;
  /** The element's ARIA role, if any */
  role?: string | null;
  /** Whether the element has an accessible label (aria-label / aria-labelledby) */
  hasAccessibleLabel: boolean;
  /** Computed width in px */
  width: number;
  /** Computed height in px */
  height: number;
  /** Computed opacity [0, 1] */
  opacity: number;
}

/**
 * Returns `true` when an element should be excluded from contrast computation
 * because it is decorative, hidden, or invisible.
 *
 * Exclusion criteria (any one is sufficient):
 *   1. aria-hidden="true"
 *   2. role="presentation"
 *   3. role="img" without an accessible label
 *   4. width === 0 or height === 0
 *   5. opacity === 0
 */
export function isDecorative(attrs: DecorativeAttrs): boolean {
  if (attrs.ariaHidden) return true;
  if (attrs.role === "presentation") return true;
  if (attrs.role === "img" && !attrs.hasAccessibleLabel) return true;
  if (attrs.width === 0 || attrs.height === 0) return true;
  if (attrs.opacity === 0) return true;
  return false;
}

// ─── Pixel Diff Computation ──────────────────────────────────────────────────

/**
 * Computes the percentage of pixels that differ between two images.
 * A pixel is considered "different" when any of R, G, or B channels differs
 * by more than 10 (tolerance for anti-aliasing artifacts).
 *
 * @param img1Data - Flat pixel array of image 1 (R,G,B[,A] interleaved)
 * @param img2Data - Flat pixel array of image 2 (R,G,B[,A] interleaved)
 * @param width    - Image width in pixels
 * @param height   - Image height in pixels
 * @param channels - Bytes per pixel (3 = RGB, 4 = RGBA)
 * @returns Pixel diff percentage in [0, 100]; 100 when dimensions differ
 */
export function computePixelDiffPct(
  img1Data: Uint8Array | number[],
  img2Data: Uint8Array | number[],
  width: number,
  height: number,
  channels: number
): number {
  const totalPixels = width * height;
  // Dimension mismatch guard
  if (img1Data.length !== img2Data.length) return 100;
  if (totalPixels === 0) return 0;

  let diffCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * channels;
    const rDiff = Math.abs(img1Data[offset] - img2Data[offset]);
    const gDiff = Math.abs(img1Data[offset + 1] - img2Data[offset + 1]);
    const bDiff = Math.abs(img1Data[offset + 2] - img2Data[offset + 2]);
    if (rDiff > 10 || gDiff > 10 || bDiff > 10) diffCount++;
  }

  return (diffCount / totalPixels) * 100;
}

// ─── Dark Mode Classification ────────────────────────────────────────────────

/**
 * Classifies a pixel-diff percentage as a dark mode verdict.
 *
 * - `DARK_MODE_WORKS`  — pct > 5  (images are visually distinct)
 * - `DARK_MODE_BROKEN` — pct ≤ 5  (images look the same in both modes)
 */
export function classifyDarkMode(
  pixelDiffPct: number
): "DARK_MODE_WORKS" | "DARK_MODE_BROKEN" {
  return pixelDiffPct > 5 ? "DARK_MODE_WORKS" : "DARK_MODE_BROKEN";
}

// ─── Hardcoded Class Detection ────────────────────────────────────────────────

/**
 * Returns `true` when `className` is a hardcoded Tailwind color class from
 * the 21-color palette (e.g. `bg-blue-500`, `text-emerald-600`).
 * Semantic token classes (`text-primary`, `bg-card`, etc.) return `false`.
 */
export function isHardcodedClass(className: string): boolean {
  return HARDCODED_RE.test(className);
}

// ─── Token Suggestion ─────────────────────────────────────────────────────────

/**
 * Looks up the recommended semantic design token for a given prefix+color
 * combination from TOKEN_MAP.
 *
 * @param prefix - "text" | "bg" | "border"
 * @param color  - Palette color name, e.g. "blue"
 * @returns Recommended token string, or a generic fallback when no mapping exists
 */
export function suggestToken(prefix: string, color: string): string {
  const key = `${prefix}-${color}`;
  return TOKEN_MAP[key] ?? `${prefix}-[design-token]`;
}

// ─── HSL → RGB → Luminance ───────────────────────────────────────────────────

/**
 * Converts HSL values (degrees + percentages) to an sRGB triplet.
 * Matches the implementation used inside the browser token-resolution eval.
 */
function hslToRGB(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

/**
 * Parses a CSS custom-property HSL value (e.g. `"225 60% 3%"`) and returns
 * the WCAG 2.1 relative luminance of the corresponding color.
 *
 * Returns `null` when the string cannot be parsed.
 *
 * @param hslStr - Space-separated "H S% L%" string as returned by
 *                 `getComputedStyle(root).getPropertyValue('--background')`
 */
export function computeLuminanceFromHSL(hslStr: string): number | null {
  const parts = hslStr.trim().split(/\s+/);
  if (parts.length < 3) return null;

  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]); // may include "%", parseFloat handles that
  const l = parseFloat(parts[2]);

  if (isNaN(h) || isNaN(s) || isNaN(l)) return null;

  const { r, g, b } = hslToRGB(h, s, l);
  return computeRelativeLuminance(r, g, b);
}

// ─── Violation Severity Classification ───────────────────────────────────────

/**
 * Determines whether a violation type should cause a test failure (as opposed
 * to emitting only a warning).
 *
 * Classification rules:
 *   - `ContrastViolation`  → always a failure
 *   - `HardcodedViolation` → always a failure
 *   - `TokenViolation`     → failure only when `critical === true`
 *   - `ScreenshotResult`   → never a failure (warning only)
 *
 * @param violationType - One of "ContrastViolation" | "HardcodedViolation" |
 *                        "TokenViolation" | "ScreenshotResult"
 * @param critical      - Relevant for TokenViolation; ignored for other types
 */
export function isTestFailure(violationType: string, critical?: boolean): boolean {
  switch (violationType) {
    case "ContrastViolation":
      return true;
    case "HardcodedViolation":
      return true;
    case "TokenViolation":
      return critical === true;
    case "ScreenshotResult":
      return false;
    default:
      return false;
  }
}
