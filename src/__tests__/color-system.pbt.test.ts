/**
 * Property-Based Tests for the UI Color System Redesign.
 *
 * Uses fast-check (fc.assert / fc.property) with vitest.
 * Each property runs a minimum of 100 iterations.
 *
 * Feature: ui-color-system-redesign
 */

import { describe, test, expect } from "vitest";
import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";

// ─── Helpers: Parse index.css for CSS variable declarations ─────────────────

const CSS_PATH = path.resolve(__dirname, "../index.css");

interface ParsedVariables {
  root: Record<string, string>;
  dark: Record<string, string>;
}

function parseCssVariables(): ParsedVariables {
  const cssContent = fs.readFileSync(CSS_PATH, "utf-8");

  const result: ParsedVariables = { root: {}, dark: {} };

  // Extract :root block
  const rootMatch = cssContent.match(/:root\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s);
  if (rootMatch) {
    const rootBlock = rootMatch[1];
    const varRegex = /--([a-z0-9-]+)\s*:\s*([^;]+);/g;
    let match: RegExpExecArray | null;
    while ((match = varRegex.exec(rootBlock)) !== null) {
      result.root[match[1]] = match[2].trim();
    }
  }

  // Extract .dark block
  const darkMatch = cssContent.match(/\.dark\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s);
  if (darkMatch) {
    const darkBlock = darkMatch[1];
    const varRegex = /--([a-z0-9-]+)\s*:\s*([^;]+);/g;
    let match: RegExpExecArray | null;
    while ((match = varRegex.exec(darkBlock)) !== null) {
      result.dark[match[1]] = match[2].trim();
    }
  }

  return result;
}

/**
 * Parse an HSL triplet string like "224 47% 5%" and return { h, s, l }.
 */
function parseHSL(value: string): { h: number; s: number; l: number } | null {
  const match = value.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) return null;
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

// ─── Helpers: HSL to RGB and WCAG Luminance/Contrast ────────────────────────

/**
 * Convert HSL (h in degrees, s and l in 0-100) to sRGB (r, g, b in 0-1 range).
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r1: number, g1: number, b1: number;

  if (h < 60) {
    [r1, g1, b1] = [c, x, 0];
  } else if (h < 120) {
    [r1, g1, b1] = [x, c, 0];
  } else if (h < 180) {
    [r1, g1, b1] = [0, c, x];
  } else if (h < 240) {
    [r1, g1, b1] = [0, x, c];
  } else if (h < 300) {
    [r1, g1, b1] = [x, 0, c];
  } else {
    [r1, g1, b1] = [c, 0, x];
  }

  return { r: r1 + m, g: g1 + m, b: b1 + m };
}

/**
 * Apply sRGB gamma correction (linearize) per WCAG formula.
 * Input: sRGB channel in [0, 1].
 * Output: linearized channel value.
 */
function linearize(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Compute WCAG 2.1 relative luminance from an HSL triplet string.
 * Returns a value in [0, 1], or null if the string is not parseable.
 */
function computeRelativeLuminance(hslStr: string): number | null {
  const hsl = parseHSL(hslStr);
  if (!hsl) return null;

  const { r, g, b } = hslToRgb(hsl.h, hsl.s, hsl.l);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Compute WCAG 2.1 contrast ratio between two relative luminance values.
 * Returns a value in [1, 21].
 */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Property 4: Surface Layer Visual Distinctness ──────────────────────────
// Feature: ui-color-system-redesign, Property 4: Surface Layer Visual Distinctness

describe("Property 4: Surface Layer Visual Distinctness", () => {
  /**
   * Validates: Requirements 4.3, 4.4
   *
   * For any pair of adjacent surface layers (surface-1/surface-2, surface-2/surface-3):
   *   - In light mode: |L1 - L2| >= 2%
   *   - In dark mode: |L1 - L2| >= 3%
   */

  const cssVars = parseCssVariables();

  type AdjacentSurfacePair = ["surface-1", "surface-2"] | ["surface-2", "surface-3"];

  const adjacentPairs: AdjacentSurfacePair[] = [
    ["surface-1", "surface-2"],
    ["surface-2", "surface-3"],
  ];

  test("Adjacent surface layers in light mode have ΔL ≥ 2%", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...adjacentPairs),
        (pair) => {
          const [surfaceA, surfaceB] = pair;
          const valueA = cssVars.root[surfaceA];
          const valueB = cssVars.root[surfaceB];

          expect(valueA).toBeDefined();
          expect(valueB).toBeDefined();

          const hslA = parseHSL(valueA);
          const hslB = parseHSL(valueB);

          expect(hslA).not.toBeNull();
          expect(hslB).not.toBeNull();

          const deltaL = Math.abs(hslA!.l - hslB!.l);
          expect(deltaL).toBeGreaterThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Adjacent surface layers in dark mode have ΔL ≥ 3%", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...adjacentPairs),
        (pair) => {
          const [surfaceA, surfaceB] = pair;
          const valueA = cssVars.dark[surfaceA];
          const valueB = cssVars.dark[surfaceB];

          expect(valueA).toBeDefined();
          expect(valueB).toBeDefined();

          const hslA = parseHSL(valueA);
          const hslB = parseHSL(valueB);

          expect(hslA).not.toBeNull();
          expect(hslB).not.toBeNull();

          const deltaL = Math.abs(hslA!.l - hslB!.l);
          expect(deltaL).toBeGreaterThanOrEqual(3);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 2: Semantic Color Token Completeness ──────────────────────────
// Feature: ui-color-system-redesign, Property 2: Semantic Color Token Completeness

describe("Property 2: Semantic Color Token Completeness", () => {
  /**
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
   *
   * For each semantic name in {success, warning, destructive, info, muted, accent},
   * verify both `--{name}` and `--{name}-foreground` exist in both modes,
   * and assert hue falls within the semantically appropriate range.
   */

  const cssVars = parseCssVariables();

  const semanticNames = [
    "success",
    "warning",
    "destructive",
    "info",
    "muted",
    "accent",
  ] as const;

  // Hue ranges per semantic token (from design spec):
  //   success → green (130–155)
  //   warning → amber (30–45)
  //   destructive → red (350–10, wraps around 0)
  //   info → cyan/sky (190–210)
  //   muted → any (neutral/warm tone)
  //   accent → any
  const hueRanges: Record<
    string,
    { min: number; max: number; wraps?: boolean } | null
  > = {
    success: { min: 130, max: 155 },
    warning: { min: 30, max: 45 },
    destructive: { min: 350, max: 10, wraps: true },
    info: { min: 190, max: 210 },
    muted: null, // any hue
    accent: null, // any hue
  };

  test("Both --{name} and --{name}-foreground exist in :root and .dark for all semantic colors", () => {
    fc.assert(
      fc.property(fc.constantFrom(...semanticNames), (name) => {
        // Assert --{name} exists in :root
        expect(
          cssVars.root[name],
          `--${name} should exist in :root`
        ).toBeDefined();

        // Assert --{name}-foreground exists in :root
        expect(
          cssVars.root[`${name}-foreground`],
          `--${name}-foreground should exist in :root`
        ).toBeDefined();

        // Assert --{name} exists in .dark
        expect(
          cssVars.dark[name],
          `--${name} should exist in .dark`
        ).toBeDefined();

        // Assert --{name}-foreground exists in .dark
        expect(
          cssVars.dark[`${name}-foreground`],
          `--${name}-foreground should exist in .dark`
        ).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  test("Semantic token hues in :root fall within appropriate ranges", () => {
    fc.assert(
      fc.property(fc.constantFrom(...semanticNames), (name) => {
        const range = hueRanges[name];

        // For muted/accent — no hue constraint, just verify valid HSL
        if (range === null) {
          const value = cssVars.root[name];
          expect(value, `--${name} should exist in :root`).toBeDefined();
          const hsl = parseHSL(value);
          expect(
            hsl,
            `--${name} in :root should be a valid HSL triplet`
          ).not.toBeNull();
          return;
        }

        const value = cssVars.root[name];
        expect(value, `--${name} should exist in :root`).toBeDefined();
        const hsl = parseHSL(value);
        expect(
          hsl,
          `--${name} in :root should be a valid HSL triplet`
        ).not.toBeNull();

        if (range.wraps) {
          // Hue wraps around 0 (e.g., destructive: 350–360 or 0–10)
          expect(
            hsl!.h >= range.min || hsl!.h <= range.max,
            `--${name} hue in :root (${hsl!.h}) should be in range [${range.min}–360) or [0–${range.max}]`
          ).toBe(true);
        } else {
          expect(
            hsl!.h >= range.min && hsl!.h <= range.max,
            `--${name} hue in :root (${hsl!.h}) should be in range [${range.min}–${range.max}]`
          ).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  test("Semantic token hues in .dark fall within appropriate ranges", () => {
    fc.assert(
      fc.property(fc.constantFrom(...semanticNames), (name) => {
        const range = hueRanges[name];

        if (range === null) {
          const value = cssVars.dark[name];
          expect(value, `--${name} should exist in .dark`).toBeDefined();
          const hsl = parseHSL(value);
          expect(
            hsl,
            `--${name} in .dark should be a valid HSL triplet`
          ).not.toBeNull();
          return;
        }

        const value = cssVars.dark[name];
        expect(value, `--${name} should exist in .dark`).toBeDefined();
        const hsl = parseHSL(value);
        expect(
          hsl,
          `--${name} in .dark should be a valid HSL triplet`
        ).not.toBeNull();

        if (range.wraps) {
          expect(
            hsl!.h >= range.min || hsl!.h <= range.max,
            `--${name} hue in .dark (${hsl!.h}) should be in range [${range.min}–360) or [0–${range.max}]`
          ).toBe(true);
        } else {
          expect(
            hsl!.h >= range.min && hsl!.h <= range.max,
            `--${name} hue in .dark (${hsl!.h}) should be in range [${range.min}–${range.max}]`
          ).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});


// ─── Property 1: CSS Variable HSL Range Conformance ─────────────────────────
// Feature: ui-color-system-redesign, Property 1: CSS Variable HSL Range Conformance

describe("Property 1: CSS Variable HSL Range Conformance", () => {
  /**
   * Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
   *
   * For any CSS variable defined in the color system's :root or .dark block,
   * its parsed HSL components (H, S%, L%) SHALL fall within the design-specified
   * ranges for that token and mode.
   */

  const cssVars = parseCssVariables();

  // Light mode expected HSL ranges (from design doc)
  const LIGHT_MODE_RANGES: Record<string, { hMin: number; hMax: number; sMin: number; sMax: number; lMin: number; lMax: number }> = {
    "background": { hMin: 35, hMax: 45, sMin: 25, sMax: 35, lMin: 97, lMax: 99 },
    "foreground": { hMin: 220, hMax: 228, sMin: 65, sMax: 75, lMin: 2, lMax: 8 },
    "primary": { hMin: 30, hMax: 45, sMin: 85, sMax: 100, lMin: 50, lMax: 58 },
    "primary-foreground": { hMin: 0, hMax: 360, sMin: 0, sMax: 100, lMin: 95, lMax: 100 },
    "secondary": { hMin: 35, hMax: 45, sMin: 15, sMax: 25, lMin: 92, lMax: 96 },
    "secondary-foreground": { hMin: 220, hMax: 228, sMin: 65, sMax: 75, lMin: 2, lMax: 8 },
    "surface-1": { hMin: 35, hMax: 45, sMin: 20, sMax: 30, lMin: 97, lMax: 99 },
    "surface-2": { hMin: 0, hMax: 360, sMin: 0, sMax: 100, lMin: 100, lMax: 100 },
    "surface-3": { hMin: 35, hMax: 45, sMin: 15, sMax: 25, lMin: 93, lMax: 96 },
    "border": { hMin: 35, hMax: 45, sMin: 15, sMax: 25, lMin: 88, lMax: 92 },
    "input": { hMin: 35, hMax: 45, sMin: 15, sMax: 25, lMin: 88, lMax: 92 },
    "muted-foreground": { hMin: 35, hMax: 45, sMin: 5, sMax: 15, lMin: 35, lMax: 45 },
  };

  // Dark mode expected HSL ranges (from design doc)
  const DARK_MODE_RANGES: Record<string, { hMin: number; hMax: number; sMin: number; sMax: number; lMin: number; lMax: number }> = {
    "background": { hMin: 222, hMax: 228, sMin: 47, sMax: 60, lMin: 3, lMax: 6 },
    "foreground": { hMin: 205, hMax: 215, sMin: 35, sMax: 45, lMin: 96, lMax: 100 },
    "primary": { hMin: 240, hMax: 250, sMin: 70, sMax: 80, lMin: 60, lMax: 68 },
    "primary-foreground": { hMin: 205, hMax: 215, sMin: 35, sMax: 45, lMin: 96, lMax: 100 },
    "secondary": { hMin: 213, hMax: 221, sMin: 28, sMax: 38, lMin: 10, lMax: 14 },
    "secondary-foreground": { hMin: 205, hMax: 215, sMin: 35, sMax: 45, lMin: 96, lMax: 100 },
    "surface-1": { hMin: 222, hMax: 228, sMin: 47, sMax: 60, lMin: 3, lMax: 6 },
    "surface-2": { hMin: 222, hMax: 228, sMin: 47, sMax: 60, lMin: 7, lMax: 11 },
    "surface-3": { hMin: 222, hMax: 228, sMin: 47, sMax: 60, lMin: 11, lMax: 15 },
    "border": { hMin: 213, hMax: 221, sMin: 28, sMax: 38, lMin: 13, lMax: 18 },
    "input": { hMin: 213, hMax: 221, sMin: 28, sMax: 38, lMin: 13, lMax: 18 },
    "muted-foreground": { hMin: 210, hMax: 220, sMin: 15, sMax: 25, lMin: 65, lMax: 75 },
  };

  test("light mode tokens have HSL values within design-specified ranges", () => {
    const lightTokenNames = Object.keys(LIGHT_MODE_RANGES);

    fc.assert(
      fc.property(
        fc.constantFrom(...lightTokenNames),
        (tokenName: string) => {
          const rawValue = cssVars.root[tokenName];
          expect(rawValue).toBeDefined();

          const hsl = parseHSL(rawValue);
          expect(hsl).not.toBeNull();

          const range = LIGHT_MODE_RANGES[tokenName];

          // For tokens with "any" H/S range (surface-2 pure white, primary-foreground)
          // only validate lightness
          if (range.hMin === 0 && range.hMax === 360 && range.sMin === 0 && range.sMax === 100) {
            expect(hsl!.l).toBeGreaterThanOrEqual(range.lMin);
            expect(hsl!.l).toBeLessThanOrEqual(range.lMax);
            return;
          }

          expect(hsl!.h).toBeGreaterThanOrEqual(range.hMin);
          expect(hsl!.h).toBeLessThanOrEqual(range.hMax);
          expect(hsl!.s).toBeGreaterThanOrEqual(range.sMin);
          expect(hsl!.s).toBeLessThanOrEqual(range.sMax);
          expect(hsl!.l).toBeGreaterThanOrEqual(range.lMin);
          expect(hsl!.l).toBeLessThanOrEqual(range.lMax);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("dark mode tokens have HSL values within design-specified ranges", () => {
    const darkTokenNames = Object.keys(DARK_MODE_RANGES);

    fc.assert(
      fc.property(
        fc.constantFrom(...darkTokenNames),
        (tokenName: string) => {
          const rawValue = cssVars.dark[tokenName];
          expect(rawValue).toBeDefined();

          const hsl = parseHSL(rawValue);
          expect(hsl).not.toBeNull();

          const range = DARK_MODE_RANGES[tokenName];

          expect(hsl!.h).toBeGreaterThanOrEqual(range.hMin);
          expect(hsl!.h).toBeLessThanOrEqual(range.hMax);
          expect(hsl!.s).toBeGreaterThanOrEqual(range.sMin);
          expect(hsl!.s).toBeLessThanOrEqual(range.sMax);
          expect(hsl!.l).toBeGreaterThanOrEqual(range.lMin);
          expect(hsl!.l).toBeLessThanOrEqual(range.lMax);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 5: shadcn/ui Variable Completeness ─────────────────────────────
// Feature: ui-color-system-redesign, Property 5: shadcn/ui Variable Completeness

describe("Property 5: shadcn/ui Variable Completeness", () => {
  /**
   * Validates: Requirements 5.1, 5.2
   *
   * For any variable name in the shadcn/ui required set of 27 variables,
   * that variable SHALL be defined in both `:root` and `.dark` blocks,
   * and each value SHALL be a valid HSL triplet (H S% L%).
   */

  const cssVars = parseCssVariables();

  const REQUIRED_SHADCN_VARIABLES = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "destructive-foreground",
    "border",
    "input",
    "ring",
    "sidebar-background",
    "sidebar-foreground",
    "sidebar-primary",
    "sidebar-primary-foreground",
    "sidebar-accent",
    "sidebar-accent-foreground",
    "sidebar-border",
    "sidebar-ring",
  ] as const;

  const HSL_TRIPLET_PATTERN = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/;

  test("all 27 required shadcn/ui variables exist in :root with valid HSL values", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REQUIRED_SHADCN_VARIABLES),
        (variableName) => {
          const value = cssVars.root[variableName];
          expect(value).toBeDefined();
          expect(value).toMatch(HSL_TRIPLET_PATTERN);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("all 27 required shadcn/ui variables exist in .dark with valid HSL values", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REQUIRED_SHADCN_VARIABLES),
        (variableName) => {
          const value = cssVars.dark[variableName];
          expect(value).toBeDefined();
          expect(value).toMatch(HSL_TRIPLET_PATTERN);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("each shadcn/ui variable is present in both :root and .dark simultaneously", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REQUIRED_SHADCN_VARIABLES),
        (variableName) => {
          const rootValue = cssVars.root[variableName];
          const darkValue = cssVars.dark[variableName];
          expect(rootValue).toBeDefined();
          expect(darkValue).toBeDefined();
          expect(rootValue).toMatch(HSL_TRIPLET_PATTERN);
          expect(darkValue).toMatch(HSL_TRIPLET_PATTERN);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 9: No Double-Opacity Class Patterns ───────────────────────────
// Feature: ui-color-system-redesign, Property 9: No Double-Opacity Class Patterns

describe("Property 9: No Double-Opacity Class Patterns", () => {
  /**
   * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
   *
   * For any .tsx file under src/, no className string SHALL contain a double-opacity
   * pattern matching the regex (bg|text|border|ring)-[\w-]+/\d+/\d+.
   * All opacity modifiers must be single-valued.
   */

  const DOUBLE_OPACITY_REGEX = /(bg|text|border|ring)-[\w-]+\/\d+\/\d+/g;

  // Representative set of files from Requirement 10.7
  const TARGET_FILES = [
    "src/pages/retail/operational/pos/RetailPOS.tsx",
    "src/pages/retail/operational/pos/ProductGrid.tsx",
    "src/pages/retail/management/ShiftControl.tsx",
    "src/pages/retail/management/StaffAssignments.tsx",
    "src/pages/retail/management/store-profile/StoreProfileLayout.tsx",
    "src/pages/retail/management/store-profile/modules/StoreInfrastructureModule.tsx",
    "src/pages/retail/management/store-profile/modules/StoreSupplyConfigModule.tsx",
    "src/pages/retail/management/store-profile/modules/StoreOperationalConfigModule.tsx",
    "src/pages/retail/management/store-profile/modules/StoreIdentityModule.tsx",
    "src/pages/retail/management/store-profile/modules/StoreChannelBindingModule.tsx",
    "src/pages/retail/management/store-profile/modules/GlobalFleetDashboard.tsx",
    "src/pages/retail/management/store-profile/CreateStoreDialog.tsx",
    "src/pages/retail/management/staff-assignments/components/StaffDetailsModal.tsx",
    "src/pages/retail/management/staff-assignments/components/RoleModificationModal.tsx",
    "src/pages/retail/management/pricing-promo-desk/components/AuditTrailModal.tsx",
    "src/pages/retail/management/pricing-promo-desk/components/ApprovalMatrix.tsx",
    "src/pages/retail/management/components/command/GlobalActivityFeed.tsx",
    "src/pages/retail/management/command-center/LocationSwitcher.tsx",
  ] as const;

  const SRC_DIR = path.resolve(__dirname, "..");

  test("target files from Requirement 10.7 contain no double-opacity class patterns", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TARGET_FILES),
        (relativeFilePath) => {
          const absolutePath = path.resolve(SRC_DIR, relativeFilePath.replace("src/", ""));
          if (!fs.existsSync(absolutePath)) {
            // File does not exist — skip (not a failure of the color system)
            return;
          }

          const content = fs.readFileSync(absolutePath, "utf-8");
          const matches = content.match(DOUBLE_OPACITY_REGEX);

          expect(
            matches,
            `File ${relativeFilePath} contains double-opacity classes: ${(matches || []).join(", ")}`
          ).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("all .tsx files under src/ contain no double-opacity class patterns", () => {
    // Broader scan: gather all .tsx files under src/
    const allTsxFiles = fs.globSync("**/*.tsx", { cwd: SRC_DIR });

    // Use fast-check to sample from the full set of tsx files
    fc.assert(
      fc.property(
        fc.constantFrom(...allTsxFiles),
        (relativeFile) => {
          const absolutePath = path.resolve(SRC_DIR, relativeFile);
          const content = fs.readFileSync(absolutePath, "utf-8");
          const matches = content.match(DOUBLE_OPACITY_REGEX);

          expect(
            matches,
            `File src/${relativeFile} contains double-opacity classes: ${(matches || []).join(", ")}`
          ).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 3: WCAG AA Contrast for Semantic Pairs ────────────────────────
// Feature: ui-color-system-redesign, Property 3: WCAG AA Contrast for Semantic Pairs

describe("Property 3: WCAG AA Contrast for Semantic Pairs", () => {
  /**
   * Validates: Requirements 3.7
   *
   * For any semantic color pair (--{name} background and --{name}-foreground text)
   * in dark mode, the computed WCAG 2.1 contrast ratio SHALL be ≥ 4.5:1
   * for normal text.
   */

  const cssVars = parseCssVariables();
  const semanticNames = ["success", "warning", "destructive", "info"] as const;

  test("each semantic foreground/background pair in dark mode achieves WCAG AA contrast ratio ≥ 4.5:1", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...semanticNames),
        (name) => {
          const bgValue = cssVars.dark[name];
          const fgValue = cssVars.dark[`${name}-foreground`];

          expect(bgValue).toBeDefined();
          expect(fgValue).toBeDefined();

          const bgLuminance = computeRelativeLuminance(bgValue);
          const fgLuminance = computeRelativeLuminance(fgValue);

          expect(bgLuminance).not.toBeNull();
          expect(fgLuminance).not.toBeNull();

          const ratio = contrastRatio(bgLuminance!, fgLuminance!);

          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 7: Status Color Distinguishability ────────────────────────────
// Feature: ui-color-system-redesign, Property 7: Status Color Distinguishability

describe("Property 7: Status Color Distinguishability", () => {
  /**
   * Validates: Requirements 8.2, 8.4
   *
   * For any pair of distinct FNB status colors within the same mode,
   * the hue difference ΔH SHALL be ≥ 30° (with wraparound) OR the
   * lightness difference ΔL SHALL be ≥ 15%, ensuring visual distinguishability.
   */

  const cssVars = parseCssVariables();

  const STATUS_TOKENS = [
    "status-empty",
    "status-ordering",
    "status-served",
    "status-billed",
    "status-occupied",
  ] as const;

  // Generate all 10 unique pairs (5 choose 2)
  type StatusPair = { a: string; b: string };
  const statusPairs: StatusPair[] = [];
  for (let i = 0; i < STATUS_TOKENS.length; i++) {
    for (let j = i + 1; j < STATUS_TOKENS.length; j++) {
      statusPairs.push({ a: STATUS_TOKENS[i], b: STATUS_TOKENS[j] });
    }
  }

  /**
   * Compute hue difference with modular 360° wraparound.
   */
  function hueDifference(h1: number, h2: number): number {
    return Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
  }

  test("each pair of status colors in light mode has ΔH ≥ 30° or ΔL ≥ 15%", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...statusPairs),
        (pair) => {
          const valueA = cssVars.root[pair.a];
          const valueB = cssVars.root[pair.b];

          expect(valueA, `--${pair.a} should exist in :root`).toBeDefined();
          expect(valueB, `--${pair.b} should exist in :root`).toBeDefined();

          const hslA = parseHSL(valueA);
          const hslB = parseHSL(valueB);

          expect(hslA, `--${pair.a} should be valid HSL`).not.toBeNull();
          expect(hslB, `--${pair.b} should be valid HSL`).not.toBeNull();

          const deltaH = hueDifference(hslA!.h, hslB!.h);
          const deltaL = Math.abs(hslA!.l - hslB!.l);

          expect(
            deltaH >= 30 || deltaL >= 15,
            `Status colors --${pair.a} (H:${hslA!.h}, L:${hslA!.l}%) and --${pair.b} (H:${hslB!.h}, L:${hslB!.l}%) must have ΔH ≥ 30° (got ${deltaH}°) OR ΔL ≥ 15% (got ${deltaL}%). Neither condition met.`
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("each pair of status colors in dark mode has ΔH ≥ 30° or ΔL ≥ 15%", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...statusPairs),
        (pair) => {
          const valueA = cssVars.dark[pair.a];
          const valueB = cssVars.dark[pair.b];

          expect(valueA, `--${pair.a} should exist in .dark`).toBeDefined();
          expect(valueB, `--${pair.b} should exist in .dark`).toBeDefined();

          const hslA = parseHSL(valueA);
          const hslB = parseHSL(valueB);

          expect(hslA, `--${pair.a} should be valid HSL`).not.toBeNull();
          expect(hslB, `--${pair.b} should be valid HSL`).not.toBeNull();

          const deltaH = hueDifference(hslA!.h, hslB!.h);
          const deltaL = Math.abs(hslA!.l - hslB!.l);

          expect(
            deltaH >= 30 || deltaL >= 15,
            `Status colors --${pair.a} (H:${hslA!.h}, L:${hslA!.l}%) and --${pair.b} (H:${hslB!.h}, L:${hslB!.l}%) must have ΔH ≥ 30° (got ${deltaH}°) OR ΔL ≥ 15% (got ${deltaL}%). Neither condition met.`
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 6: Tailwind Config Token Mapping Completeness ─────────────────
// Feature: ui-color-system-redesign, Property 6: Tailwind Config Token Mapping Completeness

describe("Property 6: Tailwind Config Token Mapping Completeness", () => {
  /**
   * Validates: Requirements 5.3, 5.4, 6.1, 6.2
   *
   * For any token name in the design's color taxonomy (core + semantic + surface + domain + chart),
   * the tailwind.config.ts extend.colors object SHALL contain a mapping to hsl(var(--{token-name})),
   * and SHALL NOT contain overrides for `white` or `slate`.
   */

  const TAILWIND_CONFIG_PATH = path.resolve(__dirname, "../../tailwind.config.ts");
  const tailwindContent = fs.readFileSync(TAILWIND_CONFIG_PATH, "utf-8");

  // ─── Token definitions ──────────────────────────────────────────────────────

  // Flat tokens: these appear as `tokenName: "hsl(var(--token-name))"`
  const FLAT_TOKENS = [
    "border",
    "input",
    "ring",
    "background",
    "foreground",
  ] as const;

  // Nested tokens with DEFAULT: these appear as `tokenName: { DEFAULT: "hsl(var(--token-name))" }`
  const NESTED_DEFAULT_TOKENS = [
    "primary",
    "secondary",
    "destructive",
    "muted",
    "accent",
    "popover",
    "card",
  ] as const;

  // Semantic tokens with DEFAULT
  const SEMANTIC_TOKENS = ["success", "warning", "info"] as const;

  // Surface tokens (flat style with hyphenated names)
  const SURFACE_TOKENS = ["surface-1", "surface-2", "surface-3"] as const;

  // POS domain nested tokens
  const POS_NESTED_KEYS = ["background", "card", "accent"] as const;

  // Status domain nested tokens
  const STATUS_NESTED_KEYS = [
    "empty",
    "ordering",
    "served",
    "billed",
    "occupied",
  ] as const;

  // License domain nested tokens
  const LICENSE_NESTED_KEYS = ["active", "trial", "expired"] as const;

  // Chart keys (1-5)
  const CHART_KEYS = ["1", "2", "3", "4", "5"] as const;

  // Sidebar nested tokens (8 entries)
  const SIDEBAR_KEYS = [
    "DEFAULT",
    "foreground",
    "primary",
    "primary-foreground",
    "accent",
    "accent-foreground",
    "border",
    "ring",
  ] as const;

  // ─── Tests ──────────────────────────────────────────────────────────────────

  test("all flat tokens are mapped to hsl(var(--token-name))", () => {
    fc.assert(
      fc.property(fc.constantFrom(...FLAT_TOKENS), (token) => {
        // Flat tokens appear as: tokenName: "hsl(var(--token-name))"
        const pattern = new RegExp(
          `["']?${token.replace("-", "\\-?")}["']?\\s*:\\s*["']hsl\\(var\\(--${token}\\)\\)["']`
        );
        expect(
          tailwindContent,
          `Flat token "${token}" should be mapped to hsl(var(--${token}))`
        ).toMatch(pattern);
      }),
      { numRuns: 100 }
    );
  });

  test("all nested DEFAULT tokens (shadcn core) have DEFAULT mapped", () => {
    fc.assert(
      fc.property(fc.constantFrom(...NESTED_DEFAULT_TOKENS), (token) => {
        // These appear as: tokenName: { DEFAULT: "hsl(var(--token-name))" }
        // Check the token block exists with a DEFAULT key referencing the CSS variable
        const defaultPattern = new RegExp(
          `DEFAULT\\s*:\\s*["']hsl\\(var\\(--${token}\\)\\)["']`
        );
        expect(
          tailwindContent,
          `Nested token "${token}" should have DEFAULT mapped to hsl(var(--${token}))`
        ).toMatch(defaultPattern);
      }),
      { numRuns: 100 }
    );
  });

  test("all semantic tokens (success, warning, info) have DEFAULT mapped", () => {
    fc.assert(
      fc.property(fc.constantFrom(...SEMANTIC_TOKENS), (token) => {
        // Check for the semantic token block with DEFAULT
        // These are in a block like: success: { DEFAULT: "hsl(var(--success))", ... }
        const defaultPattern = new RegExp(
          `${token}\\s*:\\s*\\{[^}]*DEFAULT\\s*:\\s*["']hsl\\(var\\(--${token}\\)\\)["']`,
          "s"
        );
        expect(
          tailwindContent,
          `Semantic token "${token}" should have DEFAULT mapped to hsl(var(--${token}))`
        ).toMatch(defaultPattern);
      }),
      { numRuns: 100 }
    );
  });

  test("all surface tokens are mapped to hsl(var(--surface-N))", () => {
    fc.assert(
      fc.property(fc.constantFrom(...SURFACE_TOKENS), (token) => {
        const pattern = new RegExp(
          `["']${token}["']\\s*:\\s*["']hsl\\(var\\(--${token}\\)\\)["']`
        );
        expect(
          tailwindContent,
          `Surface token "${token}" should be mapped to hsl(var(--${token}))`
        ).toMatch(pattern);
      }),
      { numRuns: 100 }
    );
  });

  test("POS domain tokens (pos.background, pos.card, pos.accent) exist", () => {
    fc.assert(
      fc.property(fc.constantFrom(...POS_NESTED_KEYS), (key) => {
        // pos: { background: "hsl(var(--pos-background))", ... }
        const pattern = new RegExp(
          `${key}\\s*:\\s*["']hsl\\(var\\(--pos-${key}\\)\\)["']`
        );
        expect(
          tailwindContent,
          `POS token "pos.${key}" should be mapped to hsl(var(--pos-${key}))`
        ).toMatch(pattern);
      }),
      { numRuns: 100 }
    );
  });

  test("Status domain tokens (status.empty, status.ordering, etc.) exist", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STATUS_NESTED_KEYS), (key) => {
        const pattern = new RegExp(
          `${key}\\s*:\\s*["']hsl\\(var\\(--status-${key}\\)\\)["']`
        );
        expect(
          tailwindContent,
          `Status token "status.${key}" should be mapped to hsl(var(--status-${key}))`
        ).toMatch(pattern);
      }),
      { numRuns: 100 }
    );
  });

  test("License domain tokens (license.active, license.trial, license.expired) exist", () => {
    fc.assert(
      fc.property(fc.constantFrom(...LICENSE_NESTED_KEYS), (key) => {
        const pattern = new RegExp(
          `${key}\\s*:\\s*["']hsl\\(var\\(--license-${key}\\)\\)["']`
        );
        expect(
          tailwindContent,
          `License token "license.${key}" should be mapped to hsl(var(--license-${key}))`
        ).toMatch(pattern);
      }),
      { numRuns: 100 }
    );
  });

  test("Chart tokens (chart.1 through chart.5) exist", () => {
    fc.assert(
      fc.property(fc.constantFrom(...CHART_KEYS), (key) => {
        const pattern = new RegExp(
          `${key}\\s*:\\s*["']hsl\\(var\\(--chart-${key}\\)\\)["']`
        );
        expect(
          tailwindContent,
          `Chart token "chart.${key}" should be mapped to hsl(var(--chart-${key}))`
        ).toMatch(pattern);
      }),
      { numRuns: 100 }
    );
  });

  test("Sidebar tokens (8 entries) are all mapped", () => {
    fc.assert(
      fc.property(fc.constantFrom(...SIDEBAR_KEYS), (key) => {
        // Sidebar uses slightly different CSS var names:
        // DEFAULT -> --sidebar-background, foreground -> --sidebar-foreground, etc.
        const varName =
          key === "DEFAULT" ? "sidebar-background" : `sidebar-${key}`;
        const pattern = new RegExp(
          `["']?${key === "DEFAULT" ? "DEFAULT" : key}["']?\\s*:\\s*["']hsl\\(var\\(--${varName}\\)\\)["']`
        );
        expect(
          tailwindContent,
          `Sidebar token "sidebar.${key}" should be mapped to hsl(var(--${varName}))`
        ).toMatch(pattern);
      }),
      { numRuns: 100 }
    );
  });

  test("no 'white' color override exists in extend.colors", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Check that 'white' is NOT defined as a color key in extend.colors
        // A white override would look like: white: "hsl(var(--...))" or white: { ... }
        const whiteOverridePattern = /\bwhite\s*:\s*["'{]/;
        expect(
          tailwindContent,
          "tailwind.config.ts should NOT contain a 'white' color override"
        ).not.toMatch(whiteOverridePattern);
      }),
      { numRuns: 100 }
    );
  });

  test("no 'slate' color override exists in extend.colors", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Check that 'slate' is NOT defined as a color key in extend.colors
        const slateOverridePattern = /\bslate\s*:\s*["{{\[]/;
        expect(
          tailwindContent,
          "tailwind.config.ts should NOT contain a 'slate' color override"
        ).not.toMatch(slateOverridePattern);
      }),
      { numRuns: 100 }
    );
  });
});


// ─── Property 8: No CSS Variable References in Recharts SVG Props ───────────
// Feature: ui-color-system-redesign, Property 8: No CSS Variable References in Recharts SVG Props

describe("Property 8: No CSS Variable References in Recharts SVG Props", () => {
  /**
   * Validates: Requirements 9.2, 9.6, 11.1, 11.2, 11.3, 11.4
   *
   * For any .tsx file that imports from "recharts", no stroke, fill, or stopColor
   * prop value SHALL contain the pattern `hsl(var(--` — all such props must use
   * hex literals or references to CHART_COLORS.
   */

  const RECHARTS_FILES = [
    path.resolve(__dirname, "../pages/core/finance/components/CfoChartsSection.tsx"),
    path.resolve(__dirname, "../pages/core/finance/components/CtoChartsSection.tsx"),
    path.resolve(__dirname, "../components/dashboard/FinancialTrajectoryChart.tsx"),
    path.resolve(__dirname, "../components/dashboard/ArApWaterfallChart.tsx"),
  ];

  // Regex that matches lines containing stroke, fill, or stopColor props
  // with hsl(var(-- pattern in their value
  const SVG_PROP_LINE_PATTERN = /\b(stroke|fill|stopColor)\b.*hsl\(var\(--/;

  test("no Recharts file contains hsl(var(-- in stroke/fill/stopColor props", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RECHARTS_FILES),
        (filePath) => {
          const content = fs.readFileSync(filePath, "utf-8");
          const lines = content.split("\n");

          const violations: string[] = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (SVG_PROP_LINE_PATTERN.test(line)) {
              violations.push(
                `Line ${i + 1}: ${line.trim()}`
              );
            }
          }

          expect(
            violations,
            `Found hsl(var(-- in SVG props in ${path.basename(filePath)}:\n${violations.join("\n")}`
          ).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 10: Dark Chart Variants Brighter Than Light ───────────────────
// Feature: ui-color-system-redesign, Property 10: Dark Chart Variants Brighter Than Light

import { CHART_COLORS, CHART_COLORS_DARK } from "@/lib/chart-colors";

describe("Property 10: Dark Chart Variants Brighter Than Light", () => {
  /**
   * Validates: Requirements 9.4
   *
   * For each chart color index (1–5), the dark-mode hex variant's computed
   * luminance SHALL be greater than the light-mode hex variant's computed luminance.
   */

  /**
   * Convert a hex color string (#RRGGBB) to WCAG relative luminance.
   */
  function hexToLuminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  }

  test("dark chart variant has higher luminance than light chart variant for each index", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(1, 2, 3, 4, 5),
        (index: number) => {
          const lightHex = CHART_COLORS[index] as string;
          const darkHex = CHART_COLORS_DARK[index] as string;

          expect(lightHex).toBeDefined();
          expect(darkHex).toBeDefined();

          const lightLuminance = hexToLuminance(lightHex);
          const darkLuminance = hexToLuminance(darkHex);

          expect(darkLuminance).toBeGreaterThan(lightLuminance);
        }
      ),
      { numRuns: 100 }
    );
  });
});
