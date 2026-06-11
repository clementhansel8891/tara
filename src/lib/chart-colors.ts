/**
 * chart-colors.ts
 *
 * Hardcoded hex chart colors for Recharts SVG props.
 * These MUST be hex literals — Recharts renders to SVG outside the browser
 * CSS cascade, so it cannot resolve CSS variables like hsl(var(--primary)).
 *
 * Req 9.1 — CHART_COLORS constant with 5 hardcoded hex values
 * Req 9.3 — Colors aligned to brand palette
 * Req 9.4 — Separate dark variants with higher L% for readability
 */

/** Light mode optimised hex chart colors (used as default). */
export const CHART_COLORS = {
  1: '#4f46e5',  // indigo-600
  2: '#16a34a',  // green-600
  3: '#d97706',  // amber-600
  4: '#9333ea',  // purple-600
  5: '#0284c7',  // sky-600
  // Named semantic keys
  primary: '#4f46e5',
  success: '#16a34a',
  warning: '#d97706',
  purple: '#9333ea',
  info: '#0284c7',
} as const;

/** Dark mode optimised hex chart colors — brighter (higher L%) for contrast. */
export const CHART_COLORS_DARK = {
  1: '#818cf8',  // indigo-400
  2: '#4ade80',  // green-400
  3: '#fbbf24',  // amber-400
  4: '#c084fc',  // purple-400
  5: '#38bdf8',  // sky-400
  // Named semantic keys
  primary: '#818cf8',
  success: '#4ade80',
  warning: '#fbbf24',
  purple: '#c084fc',
  info: '#38bdf8',
} as const;

// Neutral colors for axis/grid elements
export const CHART_NEUTRAL = '#e2e8f0';      // slate-200 (light mode)
export const CHART_NEUTRAL_DARK = '#334155';  // slate-700 (dark mode)
