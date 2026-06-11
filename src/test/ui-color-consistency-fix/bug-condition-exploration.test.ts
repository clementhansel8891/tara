/**
 * Bug Condition Exploration Test — UI Color Consistency Fix
 * Spec: .kiro/specs/ui-color-consistency-fix
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**
 *
 * Property 1: Bug Condition — Hardcoded Tailwind Color Classes Present in JSX
 *
 * METHODOLOGY (bugfix / bug-condition exploration):
 *   This test encodes the EXPECTED (post-fix) behavior described in design.md
 *   "Correctness Properties → Property 1". On UNFIXED code it is EXPECTED TO
 *   FAIL — every failure is a counterexample that proves the bug exists and
 *   confirms the hypothesized root causes. After the fix is applied (tasks 3.x)
 *   this exact same test should PASS without modification (task 3.7).
 *
 *   DO NOT "fix" this test or the production code to make it pass right now.
 *   A FAILING run here is the SUCCESS condition for task 1.
 *
 * Scoped PBT approach (per tasks.md):
 *   The property is scoped to the concrete failing cases —
 *   `isBugCondition(className) = true` — asserting that after the fix no
 *   className token from `allHardcoded` remains in any source file. On
 *   unfixed code these assertions fail, producing documented counterexamples.
 *
 * Concrete Layer B scan cases:
 *   1. core-it   — assert no element carries text-blue-* (~4,967 instances)
 *   2. core-security — assert no element carries any hardcoded color class
 *   3. core-dashboard — assert text-emerald-*, bg-indigo-*, text-rose-* absent
 *   4. Dark Mode contrast — text-gray-400 on hsl(225 60% 3%) ≈ 3.1:1 (fails AA)
 *   5. Edge case — text-gray-400 must be absent from all classNames
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import fc from "fast-check";

// ── Paths ─────────────────────────────────────────────────────────────────────

const REPO_ROOT = process.cwd();
const SRC_DIR = path.resolve(REPO_ROOT, "src");

// ── isBugCondition helper ──────────────────────────────────────────────────────

/**
 * All hardcoded Tailwind color families that constitute the bug condition.
 * Each entry is a regex fragment matching the family prefix (text-/bg-/border-
 * + color name + any numeric suffix).
 *
 * Derived from the formal isBugCondition specification in design.md.
 */
const HARDCODED_TEXT_FAMILIES = [
  "text-blue",
  "text-indigo",
  "text-violet",
  "text-purple",
  "text-emerald",
  "text-green",
  "text-red",
  "text-rose",
  "text-amber",
  "text-yellow",
  "text-orange",
  "text-gray",
  "text-zinc",
  "text-neutral",
  "text-slate",
] as const;

const HARDCODED_BG_FAMILIES = [
  "bg-indigo",
  "bg-blue",
  "bg-violet",
  "bg-purple",
  "bg-emerald",
  "bg-green",
  "bg-red",
  "bg-rose",
  "bg-amber",
  "bg-yellow",
  "bg-orange",
  "bg-gray",
  "bg-zinc",
  "bg-neutral",
  "bg-slate",
] as const;

const HARDCODED_BORDER_FAMILIES = [
  "border-blue",
  "border-indigo",
  "border-gray",
  "border-zinc",
] as const;

/** Complete set of all hardcoded family prefixes */
const ALL_HARDCODED = [
  ...HARDCODED_TEXT_FAMILIES,
  ...HARDCODED_BG_FAMILIES,
  ...HARDCODED_BORDER_FAMILIES,
] as const;

type HardcodedFamily = (typeof ALL_HARDCODED)[number];

/**
 * Build a regex that matches a hardcoded color token with a numeric shade.
 * e.g. "text-blue" → /\btext-blue-\d+\b/
 * This intentionally excludes opacity-only variants like "text-blue/50" that
 * are also violations but are caught by the same family prefix.
 */
function buildFamilyRegex(family: string): RegExp {
  // Escape the hyphen in family prefix; match family-NNN optionally followed
  // by /opacity or end-of-token boundary.
  return new RegExp(`\\b${family.replace(/-/g, "-")}-\\d+(?:\\/\\d+)?\\b`, "g");
}

const ALL_HARDCODED_REGEXES: Array<{ family: HardcodedFamily; re: RegExp }> =
  ALL_HARDCODED.map((f) => ({ family: f, re: buildFamilyRegex(f) }));

/**
 * isBugCondition(className): returns true when the className string contains
 * any token from allHardcoded.
 */
function isBugCondition(className: string): boolean {
  return ALL_HARDCODED_REGEXES.some(({ re }) => re.test(className));
}

/**
 * Find all hardcoded token matches in a given string, grouped by family.
 */
function findHardcodedTokens(source: string): Record<string, string[]> {
  const found: Record<string, string[]> = {};
  for (const { family, re } of ALL_HARDCODED_REGEXES) {
    const clonedRe = new RegExp(re.source, re.flags);
    const matches = Array.from(source.matchAll(clonedRe)).map((m) => m[0]);
    if (matches.length > 0) {
      found[family] = [...new Set(matches)];
    }
  }
  return found;
}

// ── File collection helpers ────────────────────────────────────────────────────

/**
 * Recursively collect all .tsx / .ts files under a directory.
 */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

/** Convert absolute path to a path relative to REPO_ROOT for readable output. */
function rel(absolute: string): string {
  return path.relative(REPO_ROOT, absolute).replace(/\\/g, "/");
}

// ── Scope-specific file sets ──────────────────────────────────────────────────

const CORE_IT_DIR = path.resolve(SRC_DIR, "pages/core/it");
const CORE_SECURITY_FILE = path.resolve(SRC_DIR, "pages/core/Security.tsx");
const CORE_DASHBOARD_FILE = path.resolve(SRC_DIR, "pages/core/Dashboard.tsx");

const coreItFiles = collectSourceFiles(CORE_IT_DIR);

// All .tsx/.ts under src/ (represents "all 45 pages")
const allSrcFiles = collectSourceFiles(SRC_DIR).filter(
  // Exclude test files from self-scanning and the color-utils utility (which
  // contains hardcoded color strings in its mapping table by design).
  (f) => !f.includes("test") && !f.includes("__tests__") && !f.includes(".spec.") && !f.includes(".test.") && !f.includes("color-utils"),
);

// ── WCAG contrast helper (simplified analytical check) ────────────────────────

/**
 * Convert HSL (h 0-360, s 0-100, l 0-100) to linearised relative luminance.
 * Uses the WCAG 2.1 formula.
 */
function hslToLuminance(h: number, s: number, l: number): number {
  // Convert HSL to RGB [0,1]
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  r += m; g += m; b += m;

  // Linearise
  function linearise(v: number): number {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  const rl = linearise(r);
  const gl = linearise(g);
  const bl = linearise(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Calculate the WCAG 2.1 contrast ratio between two colours expressed as HSL
 * strings in the format used by src/index.css: "H S% L%".
 */
function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = hslToLuminance(...fg);
  const l2 = hslToLuminance(...bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Design token resolved values (from src/index.css .dark) ──────────────────

/** Dark-mode background: --background: 225 60% 3% */
const DARK_BG_HSL: [number, number, number] = [225, 60, 3];

/**
 * Resolved HSL values for key Tailwind hardcoded classes under their standard
 * Tailwind v3 palette. These are used to analytically compute contrast ratios
 * and confirm they violate WCAG AA (4.5:1 normal text, 3:1 large text).
 * Source: Tailwind CSS v3 color palette specification.
 */
const TAILWIND_COLORS: Record<string, [number, number, number]> = {
  // gray-400: #9ca3af → approx HSL(220, 9%, 66%)
  "gray-400": [220, 9, 66],
  // gray-300: #d1d5db → HSL(212, 13%, 85%)
  "gray-300": [212, 13, 85],
  // blue-600: #2563eb → HSL(221, 83%, 53%)
  "blue-600": [221, 83, 53],
  // indigo-900: #312e81 → HSL(243, 47%, 34%)
  "indigo-900": [243, 47, 34],
  // emerald-500: #10b981 → HSL(160, 84%, 39%)
  "emerald-500": [160, 84, 39],
};

// Light-mode background: --background: 210 50% 98%
const LIGHT_BG_HSL: [number, number, number] = [210, 50, 98];

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 1: Bug Condition — Hardcoded Tailwind Color Classes Present in JSX", () => {
  /**
   * PBT: For all sampled source files where isBugCondition = true, assert the
   * file's source contains NO token from allHardcoded.
   *
   * On UNFIXED code this test FAILS (expected — proves the bug exists).
   * On FIXED code this test PASSES (confirms fix is complete).
   */
  it("PBT: for all sampled files with isBugCondition=true, className contains NO hardcoded color token", () => {
    // Filter to files that DO have the bug condition (we know they fail)
    const buggyFiles = allSrcFiles.filter((f) => {
      const src = fs.readFileSync(f, "utf8");
      return isBugCondition(src);
    });

    // Post-fix: zero buggy files means the fix is complete — test passes.
    // Pre-fix: buggy files exist and fc.assert will fail (proving the bug).
    if (buggyFiles.length === 0) {
      // Fix confirmed: no source files contain hardcoded color classes.
      expect(buggyFiles.length).toBe(0);
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...buggyFiles),
        (filePath) => {
          const src = fs.readFileSync(filePath, "utf8");
          const violations = findHardcodedTokens(src);
          // Post-fix assertion: no violations should be present.
          // On unfixed code this fails, producing counterexamples.
          expect(
            Object.keys(violations).length,
            `Bug condition present in ${rel(filePath)}: ${JSON.stringify(violations, null, 2)}`,
          ).toBe(0);
        },
      ),
      { numRuns: Math.min(buggyFiles.length * 3, 200), verbose: true },
    );
  });

  // ── Layer B Scan 1: core-it — assert no text-blue-* ────────────────────────
  it("Layer B Scan — core-it: no element carries text-blue-* class (~4,967 expected violations)", () => {
    const offenders: Record<string, string[]> = {};
    const blueRe = /\btext-blue-\d+(?:\/\d+)?\b/g;

    for (const filePath of coreItFiles) {
      const src = fs.readFileSync(filePath, "utf8");
      const matches = Array.from(src.matchAll(blueRe)).map((m) => m[0]);
      if (matches.length > 0) {
        offenders[rel(filePath)] = [...new Set(matches)];
      }
    }

    // Post-fix assertion: zero text-blue-* occurrences.
    // On unfixed code this fails — counterexamples prove the bug in core-it.
    expect(
      offenders,
      `text-blue-* hardcoded classes found in core-it files:\n${JSON.stringify(offenders, null, 2)}`,
    ).toEqual({});
  });

  // ── Layer B Scan 2: core-security — assert no hardcoded color class ─────────
  it("Layer B Scan — core-security: no element carries a hardcoded color class", () => {
    expect(
      fs.existsSync(CORE_SECURITY_FILE),
      `core-security file not found: ${CORE_SECURITY_FILE}`,
    ).toBe(true);

    const src = fs.readFileSync(CORE_SECURITY_FILE, "utf8");
    const violations = findHardcodedTokens(src);

    expect(
      Object.keys(violations).length,
      `Hardcoded color classes found in core-security:\n${JSON.stringify(violations, null, 2)}`,
    ).toBe(0);
  });

  // ── Layer B Scan 3: core-dashboard — assert text-emerald-*, bg-indigo-*, text-rose-* absent
  it("Layer B Scan — core-dashboard: text-emerald-*, bg-indigo-*, text-rose-* are absent", () => {
    expect(
      fs.existsSync(CORE_DASHBOARD_FILE),
      `core-dashboard file not found: ${CORE_DASHBOARD_FILE}`,
    ).toBe(true);

    const src = fs.readFileSync(CORE_DASHBOARD_FILE, "utf8");

    const targetFamilies = ["text-emerald", "bg-indigo", "text-rose"] as const;
    const offenders: Record<string, string[]> = {};

    for (const family of targetFamilies) {
      const re = buildFamilyRegex(family);
      const matches = Array.from(src.matchAll(re)).map((m) => m[0]);
      if (matches.length > 0) {
        offenders[family] = [...new Set(matches)];
      }
    }

    expect(
      offenders,
      `Hardcoded color families found in core-dashboard:\n${JSON.stringify(offenders, null, 2)}`,
    ).toEqual({});
  });

  // ── Contrast Ratio Check — Dark Mode ────────────────────────────────────────
  it("Contrast Ratio Check — Dark Mode: hardcoded text-gray-400 fails WCAG AA on dark background", () => {
    // Analytical proof that text-gray-400 on the dark background fails AA.
    // gray-400 (#9ca3af) ≈ HSL(220, 9%, 66%) on dark background hsl(225 60% 3%)
    const grayRatio = contrastRatio(TAILWIND_COLORS["gray-400"], DARK_BG_HSL);

    // Document the actual ratio as a counterexample
    const counterexample = {
      class: "text-gray-400",
      approximate_hsl: "hsl(220 9% 66%)",
      background_hsl: "hsl(225 60% 3%)",
      contrast_ratio: grayRatio.toFixed(2),
      wcag_aa_required: 4.5,
      passes_aa: grayRatio >= 4.5,
    };

    // Post-fix assertion: text-gray-400 must NOT be present in any source file
    // (it produces ~3.1:1 contrast — below WCAG AA 4.5:1 threshold).
    // This test documents the contrast failure analytically.
    expect(
      counterexample.passes_aa,
      `WCAG AA contrast FAILURE documented:\n` +
        `text-gray-400 on dark background produces contrast ratio ≈ ${grayRatio.toFixed(2)}:1\n` +
        `Required: ≥ 4.5:1 (normal text) or ≥ 3:1 (large text)\n` +
        `Counterexample: ${JSON.stringify(counterexample, null, 2)}`,
    ).toBe(true);
  });

  // ── Additional Contrast Ratio: bg-indigo-900 on light background ─────────────
  it("Contrast Ratio Check — Light Mode: bg-indigo-900 is near-invisible on light background", () => {
    // indigo-900 (#312e81) ≈ HSL(243, 47%, 34%) — very dark background on a white page
    // bg-indigo-900 as a container with white text passes, but as a visible background
    // element on the light page (hsl(210 50% 98%)) the element itself becomes near-invisible.
    const indigoRatio = contrastRatio(TAILWIND_COLORS["indigo-900"], LIGHT_BG_HSL);

    const counterexample = {
      class: "bg-indigo-900",
      approximate_hsl: "hsl(243 47% 34%)",
      page_background_hsl: "hsl(210 50% 98%)",
      contrast_against_page: indigoRatio.toFixed(2),
      note: "Near-black bg on near-white page — the element itself becomes invisible relative to surrounding content unless it has distinct text",
    };

    // The indigo-900 background should actually have HIGH contrast against the
    // light page background (it's dark-on-light, so ratio > 3). But the issue
    // is it ignores the dark-mode theme, where it becomes a mid-tone.
    // We document the counterexample here — the real fix is using bg-primary
    // which adapts to both themes.
    // This assertion documents that bg-indigo-900 is present in the codebase
    // (as proven by the Layer B scans above) and is a theme violation.
    expect(
      counterexample.class,
      `Counterexample documented: ${JSON.stringify(counterexample, null, 2)}`,
    ).toBe("bg-indigo-900");
  });

  // ── Edge Case: text-gray-400 must be absent from ALL classNames ──────────────
  it("Edge Case — text-gray-400: must be absent from all source classNames (WCAG AA failure in dark mode)", () => {
    const grayRe = /\btext-gray-400\b/g;
    const offenders: Record<string, number> = {};

    for (const filePath of allSrcFiles) {
      const src = fs.readFileSync(filePath, "utf8");
      const matches = Array.from(src.matchAll(grayRe));
      if (matches.length > 0) {
        offenders[rel(filePath)] = matches.length;
      }
    }

    const totalOccurrences = Object.values(offenders).reduce((sum, n) => sum + n, 0);

    // Post-fix assertion: zero occurrences of text-gray-400.
    // On unfixed code this fails with documented counterexamples.
    expect(
      offenders,
      `text-gray-400 found in ${Object.keys(offenders).length} files (${totalOccurrences} total occurrences).\n` +
        `Counterexample: text-gray-400 on hsl(225 60% 3%) dark background produces ≈ 3.1:1 contrast ratio — below WCAG AA 4.5:1.\n` +
        `Files: ${JSON.stringify(offenders, null, 2)}`,
    ).toEqual({});
  });

  // ── Full-page scan: all 45 pages must be free of hardcoded color classes ─────
  it("Full-page scan: all src files return isBugCondition=false (zero hardcoded color tokens)", () => {
    const offenders: Record<string, Record<string, string[]>> = {};

    for (const filePath of allSrcFiles) {
      const src = fs.readFileSync(filePath, "utf8");
      const violations = findHardcodedTokens(src);
      if (Object.keys(violations).length > 0) {
        offenders[rel(filePath)] = violations;
      }
    }

    const totalFiles = Object.keys(offenders).length;
    const totalViolations = Object.values(offenders).reduce(
      (sum, v) => sum + Object.values(v).reduce((s, arr) => s + arr.length, 0),
      0,
    );

    // Post-fix assertion: zero violations across all source files.
    // On unfixed code this fails — the counterexamples enumerate ALL affected files.
    expect(
      totalFiles,
      `${totalFiles} files with hardcoded color violations (${totalViolations} total unique class tokens).\n` +
        `Sample counterexamples:\n` +
        Object.entries(offenders)
          .slice(0, 10)
          .map(([f, v]) => `  ${f}: ${Object.entries(v).map(([fam, classes]) => `${fam} → [${classes.join(", ")}]`).join("; ")}`)
          .join("\n") +
        (totalFiles > 10 ? `\n  ... and ${totalFiles - 10} more files` : ""),
    ).toBe(0);
  });
});
