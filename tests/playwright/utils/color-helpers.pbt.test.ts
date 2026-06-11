/**
 * Property-Based Tests for color-helpers utility module.
 *
 * Uses fast-check (fc.assert / fc.property) with vitest test() because
 * @fast-check/vitest is not installed in this project.
 *
 * Each property runs a minimum of 100 iterations.
 */

import { describe, test, expect } from "vitest";
import * as fc from "fast-check";
import {
  computeRelativeLuminance,
  contrastRatio,
  classifyContrastViolation,
  isDecorative,
  classifyDarkMode,
  computePixelDiffPct,
  computeLuminanceFromHSL,
  isTestFailure,
  isHardcodedClass,
  suggestToken,
  PALETTE_COLORS,
  type DecorativeAttrs,
} from "./color-helpers";
import { initPageReport } from "./color-report-helpers";
import type { PageEntry, ColorReport } from "./color-report-types";

// ─── Property 1: WCAG Relative Luminance Formula Correctness ────────────────
// Feature: ui-color-consistency-test, Property 1

describe("Property 1: WCAG Relative Luminance Formula Correctness", () => {
  /**
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4
   *
   * For any RGB triple (r, g, b) in [0, 255]:
   *   - computeRelativeLuminance(r, g, b) SHALL return a value in [0, 1]
   *   - computeRelativeLuminance(0, 0, 0) === 0 (black)
   *   - computeRelativeLuminance(255, 255, 255) === 1 (white)
   *   - contrastRatio(l1, l2) === (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)
   */

  const rgbArb = fc.integer({ min: 0, max: 255 });

  // ── 1a: result is always in [0, 1] ─────────────────────────────────────
  test("computeRelativeLuminance returns a value in [0, 1] for any RGB triple", () => {
    fc.assert(
      fc.property(rgbArb, rgbArb, rgbArb, (r, g, b) => {
        const result = computeRelativeLuminance(r, g, b);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  // ── 1b: boundary anchors ────────────────────────────────────────────────
  test("boundary anchors: black (0,0,0) → 0 and white (255,255,255) → 1", () => {
    expect(computeRelativeLuminance(0, 0, 0)).toBeCloseTo(0, 10);
    expect(computeRelativeLuminance(255, 255, 255)).toBeCloseTo(1, 10);
  });

  // ── 1c: contrastRatio matches the formula (max+0.05)/(min+0.05) ─────────
  test("contrastRatio(l1, l2) equals (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05) for any two RGB triples", () => {
    fc.assert(
      fc.property(rgbArb, rgbArb, rgbArb, rgbArb, rgbArb, rgbArb, (r1, g1, b1, r2, g2, b2) => {
        const l1 = computeRelativeLuminance(r1, g1, b1);
        const l2 = computeRelativeLuminance(r2, g2, b2);
        const expected = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const actual = contrastRatio(l1, l2);
        expect(actual).toBeCloseTo(expected, 10);
      }),
      { numRuns: 100 }
    );
  });

  // ── 1d: contrastRatio result is always in [1, 21] ───────────────────────
  test("contrastRatio is always in [1, 21] for any two relative luminance values derived from RGB", () => {
    fc.assert(
      fc.property(rgbArb, rgbArb, rgbArb, rgbArb, rgbArb, rgbArb, (r1, g1, b1, r2, g2, b2) => {
        const l1 = computeRelativeLuminance(r1, g1, b1);
        const l2 = computeRelativeLuminance(r2, g2, b2);
        const ratio = contrastRatio(l1, l2);
        expect(ratio).toBeGreaterThanOrEqual(1);
        expect(ratio).toBeLessThanOrEqual(21);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 2: Contrast Threshold Classification ──────────────────────────
// Feature: ui-color-consistency-test, Property 2

describe("Property 2: Contrast Threshold Classification", () => {
  /**
   * Validates: Requirements 2.3, 2.4
   *
   * For any contrast ratio in [1.0, 21.0] and any text type ("normal" | "large"),
   * classifyContrastViolation SHALL return true iff ratio < threshold
   * (4.5 for normal text, 3.0 for large text), and false when ratio >= threshold.
   */
  test(
    "violation is recorded iff ratio is strictly below the applicable threshold",
    () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1.0), max: Math.fround(21.0), noNaN: true }),
          fc.constantFrom("normal" as const, "large" as const),
          (ratio, textType) => {
            const threshold = textType === "large" ? 3.0 : 4.5;
            const result = classifyContrastViolation(ratio, textType);

            if (ratio < threshold) {
              expect(result).toBe(true);
            } else {
              expect(result).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "violation is true for all ratios strictly below threshold (normal text)",
    () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1.0), max: Math.fround(4.499), noNaN: true }),
          (ratio) => {
            expect(classifyContrastViolation(ratio, "normal")).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "no violation for all ratios at or above threshold (normal text)",
    () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(4.5), max: Math.fround(21.0), noNaN: true }),
          (ratio) => {
            expect(classifyContrastViolation(ratio, "normal")).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "violation is true for all ratios strictly below threshold (large text)",
    () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1.0), max: Math.fround(2.999), noNaN: true }),
          (ratio) => {
            expect(classifyContrastViolation(ratio, "large")).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "no violation for all ratios at or above threshold (large text)",
    () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(3.0), max: Math.fround(21.0), noNaN: true }),
          (ratio) => {
            expect(classifyContrastViolation(ratio, "large")).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 3: Element Exclusion Filter Completeness ──────────────────────
// Feature: ui-color-consistency-test, Property 3

describe("Property 3: Element Exclusion Filter Completeness", () => {
  // Shared arbitrary for a full DecorativeAttrs descriptor
  const decorativeAttrsArb = fc.record<DecorativeAttrs>({
    ariaHidden: fc.boolean(),
    role: fc.option(fc.constantFrom("presentation", "img", "button"), {
      nil: null,
    }),
    hasAccessibleLabel: fc.boolean(),
    width: fc.nat(),
    height: fc.nat(),
    opacity: fc.float({ min: 0, max: 1 }),
  });

  // ── 3a: ariaHidden=true always decorative ───────────────────────────────
  test("isDecorative returns true when ariaHidden is true", () => {
    // Validates: Requirements 2.5, 8.1
    fc.assert(
      fc.property(
        decorativeAttrsArb,
        (attrs) => {
          const forced: DecorativeAttrs = { ...attrs, ariaHidden: true };
          expect(isDecorative(forced)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3b: role="presentation" always decorative ───────────────────────────
  test("isDecorative returns true when role is presentation", () => {
    // Validates: Requirements 2.5, 8.2
    fc.assert(
      fc.property(
        decorativeAttrsArb,
        (attrs) => {
          const forced: DecorativeAttrs = {
            ...attrs,
            ariaHidden: false,
            role: "presentation",
          };
          expect(isDecorative(forced)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3c: role="img" without accessible label always decorative ───────────
  test("isDecorative returns true when role is img and hasAccessibleLabel is false", () => {
    // Validates: Requirements 2.5, 8.2
    fc.assert(
      fc.property(
        decorativeAttrsArb,
        (attrs) => {
          const forced: DecorativeAttrs = {
            ...attrs,
            ariaHidden: false,
            role: "img",
            hasAccessibleLabel: false,
          };
          expect(isDecorative(forced)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3d: width=0 always decorative ───────────────────────────────────────
  test("isDecorative returns true when width is 0", () => {
    // Validates: Requirements 2.5, 8.3
    fc.assert(
      fc.property(
        decorativeAttrsArb,
        (attrs) => {
          const forced: DecorativeAttrs = {
            ...attrs,
            ariaHidden: false,
            role: null,
            width: 0,
          };
          expect(isDecorative(forced)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3e: height=0 always decorative ──────────────────────────────────────
  test("isDecorative returns true when height is 0", () => {
    // Validates: Requirements 2.5, 8.3
    fc.assert(
      fc.property(
        decorativeAttrsArb,
        (attrs) => {
          const forced: DecorativeAttrs = {
            ...attrs,
            ariaHidden: false,
            role: null,
            height: 0,
          };
          expect(isDecorative(forced)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3f: opacity=0 always decorative ─────────────────────────────────────
  test("isDecorative returns true when opacity is 0", () => {
    // Validates: Requirements 2.5, 8.4
    fc.assert(
      fc.property(
        decorativeAttrsArb,
        (attrs) => {
          const forced: DecorativeAttrs = {
            ...attrs,
            ariaHidden: false,
            role: null,
            opacity: 0,
          };
          expect(isDecorative(forced)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3g: none of the above conditions → isDecorative returns false ────────
  test("isDecorative returns false when no exclusion condition holds and dimensions/opacity are non-zero", () => {
    // Validates: Requirements 2.5, 8.1, 8.2, 8.3, 8.4
    //
    // "None of the above" means:
    //   ariaHidden=false, role not "presentation", not (role="img" && !hasAccessibleLabel),
    //   width>0, height>0, opacity>0
    //
    // We synthesize safe role values: null, undefined, or "button"
    // (role="img" + hasAccessibleLabel=true is also safe but we keep it simple)
    const safePosFloat = fc.float({ min: Math.fround(0.01), max: Math.fround(1.0) });
    const safePosInt = fc.integer({ min: 1, max: 10_000 });
    const safeRole = fc.option(
      fc.constantFrom<"button" | "img">("button", "img"),
      { nil: null }
    );

    fc.assert(
      fc.property(
        safeRole,
        fc.boolean(), // hasAccessibleLabel
        safePosInt,   // width
        safePosInt,   // height
        safePosFloat, // opacity
        (role, hasAccessibleLabel, width, height, opacity) => {
          // Ensure the img+no-label case is excluded (that case IS decorative)
          // by forcing hasAccessibleLabel=true whenever role="img"
          const resolvedLabel =
            role === "img" ? true : hasAccessibleLabel;

          const attrs: DecorativeAttrs = {
            ariaHidden: false,
            role,
            hasAccessibleLabel: resolvedLabel,
            width,
            height,
            opacity,
          };

          expect(isDecorative(attrs)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 4: Hardcoded Class Scanner Precision and Recall ───────────────
// Feature: ui-color-consistency-test, Property 4

describe("Property 4: Hardcoded Class Scanner Precision and Recall", () => {
  /**
   * Validates: Requirements 3.1, 3.2, 3.3
   *
   * For any class string matching `(text|bg|border)-{palette-color}-{shade}`:
   *   - isHardcodedClass SHALL return true
   * For semantic token classes (text-primary, bg-card, border-border):
   *   - isHardcodedClass SHALL return false
   * For every flagged hardcoded class:
   *   - suggestToken SHALL return a non-empty string
   */

  const paletteColorsArray = [...PALETTE_COLORS] as string[];

  // ── 4a: palette class strings are always flagged ────────────────────────
  test("isHardcodedClass returns true for any valid palette class (prefix-color-shade)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...paletteColorsArray),
        fc.integer({ min: 50, max: 950 }),
        fc.constantFrom("text" as const, "bg" as const, "border" as const),
        (color, shade, prefix) => {
          const hardcoded = `${prefix}-${color}-${shade}`;
          expect(isHardcodedClass(hardcoded)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 4b: semantic token classes are never flagged ─────────────────────────
  test("isHardcodedClass returns false for semantic token classes", () => {
    expect(isHardcodedClass("text-primary")).toBe(false);
    expect(isHardcodedClass("bg-card")).toBe(false);
    expect(isHardcodedClass("border-border")).toBe(false);
    expect(isHardcodedClass("text-muted-foreground")).toBe(false);
    expect(isHardcodedClass("bg-background")).toBe(false);
    expect(isHardcodedClass("bg-destructive")).toBe(false);
  });

  // ── 4c: suggestToken returns a non-empty string for every flagged class ──
  test("suggestToken returns a non-empty string for every valid palette class", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...paletteColorsArray),
        fc.integer({ min: 50, max: 950 }),
        fc.constantFrom("text" as const, "bg" as const, "border" as const),
        (color, _shade, prefix) => {
          const hardcoded = `${prefix}-${color}-${_shade}`;
          // Only run suggestToken for classes that are actually flagged
          if (isHardcodedClass(hardcoded)) {
            const suggestion = suggestToken(prefix, color);
            expect(typeof suggestion).toBe("string");
            expect(suggestion.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 4d: precision — arbitrary non-palette strings are not flagged ────────
  test("isHardcodedClass returns false for non-palette color names", () => {
    // These are not in the 21-color palette
    expect(isHardcodedClass("text-slate-500")).toBe(false);
    expect(isHardcodedClass("bg-trueGray-400")).toBe(false);
    expect(isHardcodedClass("border-warmGray-300")).toBe(false);
    expect(isHardcodedClass("text-500")).toBe(false);
    expect(isHardcodedClass("bg-blue")).toBe(false); // missing shade
    expect(isHardcodedClass("text-blue-")).toBe(false); // missing shade number
  });
});

// ─── Property 5: Pixel Diff Classification ──────────────────────────────────
// Feature: ui-color-consistency-test, Property 5

describe("Property 5: Pixel Diff Classification", () => {
  /**
   * Validates: Requirements 4.3, 4.4, 4.5
   *
   * For any pixelDiffPct in [0, 100]:
   *   - classifyDarkMode SHALL return exactly one of {"DARK_MODE_WORKS", "DARK_MODE_BROKEN"}
   *   - The two verdicts are mutually exclusive (exactly one applies)
   *   - DARK_MODE_WORKS iff pct > 5; DARK_MODE_BROKEN iff pct <= 5
   */
  test(
    "classifyDarkMode returns a value from the valid verdict set",
    () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          (pixelDiffPct) => {
            const verdict = classifyDarkMode(pixelDiffPct);
            const validVerdicts = new Set(["DARK_MODE_WORKS", "DARK_MODE_BROKEN"]);
            expect(validVerdicts.has(verdict)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "classifyDarkMode verdicts are mutually exclusive — exactly one applies",
    () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          (pixelDiffPct) => {
            const verdict = classifyDarkMode(pixelDiffPct);
            const isWorks  = verdict === "DARK_MODE_WORKS";
            const isBroken = verdict === "DARK_MODE_BROKEN";
            // Exactly one must be true (XOR)
            expect(isWorks !== isBroken).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "DARK_MODE_WORKS iff pixelDiffPct > 5, DARK_MODE_BROKEN iff pixelDiffPct <= 5",
    () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          (pixelDiffPct) => {
            const verdict = classifyDarkMode(pixelDiffPct);
            if (pixelDiffPct > 5) {
              expect(verdict).toBe("DARK_MODE_WORKS");
            } else {
              expect(verdict).toBe("DARK_MODE_BROKEN");
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "boundary: pct exactly 5 yields DARK_MODE_BROKEN; pct just above 5 yields DARK_MODE_WORKS",
    () => {
      expect(classifyDarkMode(5)).toBe("DARK_MODE_BROKEN");
      expect(classifyDarkMode(5.0)).toBe("DARK_MODE_BROKEN");
      expect(classifyDarkMode(0)).toBe("DARK_MODE_BROKEN");
      expect(classifyDarkMode(100)).toBe("DARK_MODE_WORKS");
    }
  );

  /**
   * computePixelDiffPct: for any valid RGBA pixel arrays of the same length,
   * the result SHALL be in [0, 100].
   *
   * Strategy: generate flat RGBA arrays (length must be a multiple of 4) by
   * generating a pixel count and building two arrays of size pixelCount * 4.
   */
  test(
    "computePixelDiffPct returns a value in [0, 100] for equal-length RGBA arrays",
    () => {
      fc.assert(
        fc.property(
          // Generate a pixel count between 4 and 64 (minLength:16 / channels:4 = 4 pixels)
          fc.integer({ min: 4, max: 64 }).chain((pixelCount) =>
            fc.tuple(
              fc.array(fc.integer({ min: 0, max: 255 }), {
                minLength: pixelCount * 4,
                maxLength: pixelCount * 4,
              }),
              fc.array(fc.integer({ min: 0, max: 255 }), {
                minLength: pixelCount * 4,
                maxLength: pixelCount * 4,
              }),
              fc.constant(pixelCount)
            )
          ),
          ([img1Data, img2Data, pixelCount]) => {
            const channels = 4;
            // width=pixelCount, height=1 (so totalPixels === pixelCount)
            const result = computePixelDiffPct(
              img1Data,
              img2Data,
              pixelCount,
              1,
              channels
            );
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "computePixelDiffPct returns 100 when arrays have different lengths (dimension mismatch)",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 32 }),
          fc.integer({ min: 1, max: 32 }).filter((n) => n !== 0),
          (size1, extraPixels) => {
            const arr1 = new Array(size1 * 4).fill(128);
            // Make arr2 a different length
            const arr2 = new Array((size1 + extraPixels) * 4).fill(128);
            const result = computePixelDiffPct(arr1, arr2, size1, 1, 4);
            expect(result).toBe(100);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "computePixelDiffPct returns 0 for two identical pixel arrays",
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 255 }), {
            minLength: 16,
            maxLength: 256,
          }).filter((arr) => arr.length % 4 === 0),
          (pixelData) => {
            const pixelCount = pixelData.length / 4;
            const result = computePixelDiffPct(
              pixelData,
              pixelData,
              pixelCount,
              1,
              4
            );
            expect(result).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 6: Background Token Luminance Gating ──────────────────────────
// Feature: ui-color-consistency-test, Property 6

describe("Property 6: Background Token Luminance Gating", () => {
  /**
   * Validates: Requirements 5.3, 5.4
   *
   * For any resolved HSL value of the --background token:
   *   - In dark mode:  luminance >= 0.20 → TokenViolation (compliant: "no")
   *   - In light mode: luminance <= 0.80 → TokenViolation (compliant: "no")
   *   - In dark mode:  luminance < 0.20  → no violation
   *   - In light mode: luminance > 0.80  → no violation
   *
   * Strategy: use fc.tuple of HSL integers, format as "H S% L%" strings,
   * compute luminance via computeLuminanceFromHSL, then verify violation logic.
   */
  const hslArb = fc.tuple(
    fc.integer({ min: 0, max: 360 }),
    fc.integer({ min: 0, max: 100 }),
    fc.integer({ min: 0, max: 100 })
  );

  /**
   * Helper that replicates the token compliance check from the Layer D
   * in-browser evaluator (design.md § "In-Browser JavaScript — Token Resolution").
   */
  function checkBackgroundToken(
    hslStr: string,
    mode: "dark" | "light"
  ): "no" | "yes" {
    const lum: number | null = computeLuminanceFromHSL(hslStr);
    if (lum === null) return "no"; // treat unparseable as non-compliant
    if (mode === "dark" && lum >= 0.20) return "no";
    if (mode === "light" && lum <= 0.80) return "no";
    return "yes";
  }

  test(
    "dark-mode violation when luminance >= 0.20",
    () => {
      fc.assert(
        fc.property(
          hslArb,
          ([h, s, l]) => {
            const hslStr = `${h} ${s}% ${l}%`;
            const lum = computeLuminanceFromHSL(hslStr);
            if (lum === null) return; // skip unparseable (shouldn't happen here)
            if (lum >= 0.20) {
              expect(checkBackgroundToken(hslStr, "dark")).toBe("no");
            }
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  test(
    "light-mode violation when luminance <= 0.80",
    () => {
      fc.assert(
        fc.property(
          hslArb,
          ([h, s, l]) => {
            const hslStr = `${h} ${s}% ${l}%`;
            const lum = computeLuminanceFromHSL(hslStr);
            if (lum === null) return;
            if (lum <= 0.80) {
              expect(checkBackgroundToken(hslStr, "light")).toBe("no");
            }
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  test(
    "no dark-mode violation when luminance < 0.20",
    () => {
      fc.assert(
        fc.property(
          hslArb,
          ([h, s, l]) => {
            const hslStr = `${h} ${s}% ${l}%`;
            const lum = computeLuminanceFromHSL(hslStr);
            if (lum === null) return;
            if (lum < 0.20) {
              expect(checkBackgroundToken(hslStr, "dark")).toBe("yes");
            }
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  test(
    "no light-mode violation when luminance > 0.80",
    () => {
      fc.assert(
        fc.property(
          hslArb,
          ([h, s, l]) => {
            const hslStr = `${h} ${s}% ${l}%`;
            const lum = computeLuminanceFromHSL(hslStr);
            if (lum === null) return;
            if (lum > 0.80) {
              expect(checkBackgroundToken(hslStr, "light")).toBe("yes");
            }
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  test(
    "computeLuminanceFromHSL returns a value in [0, 1] for any valid HSL triple",
    () => {
      fc.assert(
        fc.property(
          hslArb,
          ([h, s, l]) => {
            const hslStr = `${h} ${s}% ${l}%`;
            const lum = computeLuminanceFromHSL(hslStr);
            expect(lum).not.toBeNull();
            expect(lum!).toBeGreaterThanOrEqual(0);
            expect(lum!).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  test(
    "boundary anchors: HSL (0 0% 0%) → luminance 0 (black, dark-ok); HSL (0 0% 100%) → luminance 1 (white, light-ok)",
    () => {
      const black = computeLuminanceFromHSL("0 0% 0%");
      expect(black).toBeCloseTo(0, 5);
      expect(checkBackgroundToken("0 0% 0%", "dark")).toBe("yes");   // lum < 0.20
      expect(checkBackgroundToken("0 0% 0%", "light")).toBe("no");   // lum <= 0.80

      const white = computeLuminanceFromHSL("0 0% 100%");
      expect(white).toBeCloseTo(1, 5);
      expect(checkBackgroundToken("0 0% 100%", "dark")).toBe("no");  // lum >= 0.20
      expect(checkBackgroundToken("0 0% 100%", "light")).toBe("yes"); // lum > 0.80
    }
  );
});

// ─── Property 8: Violation Severity Classification ──────────────────────────
// Feature: ui-color-consistency-test, Property 8

describe("Property 8: Violation Severity Classification", () => {
  /**
   * Validates: Requirements 7.3, 5.6, 5.7
   *
   * isTestFailure SHALL return:
   *   - true  for ContrastViolation (regardless of critical)
   *   - true  for HardcodedViolation (regardless of critical)
   *   - true  for TokenViolation with critical=true
   *   - false for TokenViolation with critical=false
   *   - false for ScreenshotResult (regardless of critical)
   *
   * The function is pure: same inputs always produce same output.
   */

  const violationTypeArb = fc.constantFrom(
    "ContrastViolation",
    "HardcodedViolation",
    "TokenViolation",
    "ScreenshotResult"
  );

  // ── 8a: ContrastViolation always causes a failure ────────────────────────
  test("isTestFailure returns true for ContrastViolation regardless of critical flag", () => {
    fc.assert(
      fc.property(fc.boolean(), (critical) => {
        expect(isTestFailure("ContrastViolation", critical)).toBe(true);
        // Also check with critical omitted
        expect(isTestFailure("ContrastViolation")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // ── 8b: HardcodedViolation always causes a failure ───────────────────────
  test("isTestFailure returns true for HardcodedViolation regardless of critical flag", () => {
    fc.assert(
      fc.property(fc.boolean(), (critical) => {
        expect(isTestFailure("HardcodedViolation", critical)).toBe(true);
        expect(isTestFailure("HardcodedViolation")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // ── 8c: TokenViolation with critical=true causes a failure ───────────────
  test("isTestFailure returns true for TokenViolation when critical is true", () => {
    expect(isTestFailure("TokenViolation", true)).toBe(true);
  });

  // ── 8d: TokenViolation with critical=false is not a failure ──────────────
  test("isTestFailure returns false for TokenViolation when critical is false", () => {
    expect(isTestFailure("TokenViolation", false)).toBe(false);
    // critical omitted defaults to undefined (falsy) → not a failure
    expect(isTestFailure("TokenViolation")).toBe(false);
  });

  // ── 8e: ScreenshotResult never causes a failure ──────────────────────────
  test("isTestFailure returns false for ScreenshotResult regardless of critical flag", () => {
    fc.assert(
      fc.property(fc.boolean(), (critical) => {
        expect(isTestFailure("ScreenshotResult", critical)).toBe(false);
        expect(isTestFailure("ScreenshotResult")).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  // ── 8f: Full classification table across all type × critical combinations ─
  test("isTestFailure correctly classifies all violation types against the critical flag", () => {
    fc.assert(
      fc.property(
        violationTypeArb,
        fc.boolean(),
        (violationType, critical) => {
          const result = isTestFailure(violationType, critical);
          const expected =
            violationType === "ContrastViolation" ||
            violationType === "HardcodedViolation" ||
            (violationType === "TokenViolation" && critical === true);

          expect(result).toBe(expected);
        }
      ),
      { numRuns: 200 }
    );
  });

  // ── 8g: Purity — same inputs always produce same output ──────────────────
  test("isTestFailure is a pure function: same inputs always produce the same output", () => {
    fc.assert(
      fc.property(
        violationTypeArb,
        fc.boolean(),
        (violationType, critical) => {
          const result1 = isTestFailure(violationType, critical);
          const result2 = isTestFailure(violationType, critical);
          const result3 = isTestFailure(violationType, critical);
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 7: Report Completeness Invariant ──────────────────────────────
// Feature: ui-color-consistency-test, Property 7

describe("Property 7: Report Completeness Invariant", () => {
  /**
   * Validates: Requirements 6.2, 7.1, 7.4
   *
   * For any array of PageEntry-like objects (1–50 entries):
   *   - A ColorReport built via initPageReport SHALL have pages.length === input length
   *   - Each PageReport SHALL have non-null/defined layerA, layerB, layerC, layerD fields
   *   - layerA SHALL have light[] and dark[] arrays
   *   - layerB SHALL have violations[] array
   *   - layerC SHALL have screenshot: null (initial state)
   *   - layerD SHALL have light[] and dark[] arrays
   */

  const pageEntryArb = fc.array(
    fc.record({
      route: fc.string(),
      name: fc.string(),
      group: fc.constantFrom(
        "core" as const,
        "retail-management" as const,
        "retail-operational" as const
      ),
    }),
    { minLength: 1, maxLength: 50 }
  );

  // ── 7a: report.pages.length equals input array length ───────────────────
  test("report.pages.length equals the number of input page entries", () => {
    fc.assert(
      fc.property(pageEntryArb, (pages) => {
        const report: ColorReport = {
          generatedAt: new Date().toISOString(),
          totalPages: pages.length,
          pages: pages.map((entry) => initPageReport(entry as PageEntry)),
        };
        expect(report.pages.length).toBe(pages.length);
      }),
      { numRuns: 100 }
    );
  });

  // ── 7b: every PageReport has non-null layerA, layerB, layerC, layerD ────
  test("every PageReport has non-null layerA, layerB, layerC, and layerD fields", () => {
    fc.assert(
      fc.property(pageEntryArb, (pages) => {
        const pageReports = pages.map((entry) =>
          initPageReport(entry as PageEntry)
        );
        for (const pr of pageReports) {
          expect(pr.layerA).toBeDefined();
          expect(pr.layerA).not.toBeNull();
          expect(pr.layerB).toBeDefined();
          expect(pr.layerB).not.toBeNull();
          expect(pr.layerC).toBeDefined();
          expect(pr.layerC).not.toBeNull();
          expect(pr.layerD).toBeDefined();
          expect(pr.layerD).not.toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  // ── 7c: layerA has light[] and dark[] arrays ─────────────────────────────
  test("every PageReport.layerA has light and dark arrays", () => {
    fc.assert(
      fc.property(pageEntryArb, (pages) => {
        const pageReports = pages.map((entry) =>
          initPageReport(entry as PageEntry)
        );
        for (const pr of pageReports) {
          expect(Array.isArray(pr.layerA.light)).toBe(true);
          expect(Array.isArray(pr.layerA.dark)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  // ── 7d: layerB has violations[] array ────────────────────────────────────
  test("every PageReport.layerB has a violations array", () => {
    fc.assert(
      fc.property(pageEntryArb, (pages) => {
        const pageReports = pages.map((entry) =>
          initPageReport(entry as PageEntry)
        );
        for (const pr of pageReports) {
          expect(Array.isArray(pr.layerB.violations)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  // ── 7e: layerC has screenshot: null (initial state) ──────────────────────
  test("every PageReport.layerC has screenshot initialised to null", () => {
    fc.assert(
      fc.property(pageEntryArb, (pages) => {
        const pageReports = pages.map((entry) =>
          initPageReport(entry as PageEntry)
        );
        for (const pr of pageReports) {
          expect(pr.layerC.screenshot).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  // ── 7f: layerD has light[] and dark[] arrays ─────────────────────────────
  test("every PageReport.layerD has light and dark arrays", () => {
    fc.assert(
      fc.property(pageEntryArb, (pages) => {
        const pageReports = pages.map((entry) =>
          initPageReport(entry as PageEntry)
        );
        for (const pr of pageReports) {
          expect(Array.isArray(pr.layerD.light)).toBe(true);
          expect(Array.isArray(pr.layerD.dark)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  // ── 7g: combined completeness check across all properties ────────────────
  test("all PageReport layer fields satisfy completeness invariants together", () => {
    fc.assert(
      fc.property(pageEntryArb, (pages) => {
        const report: ColorReport = {
          generatedAt: new Date().toISOString(),
          totalPages: pages.length,
          pages: pages.map((entry) => initPageReport(entry as PageEntry)),
        };

        // Length invariant
        expect(report.pages.length).toBe(pages.length);

        // Per-page layer completeness
        for (const pr of report.pages) {
          // layerA
          expect(pr.layerA).toBeDefined();
          expect(Array.isArray(pr.layerA.light)).toBe(true);
          expect(Array.isArray(pr.layerA.dark)).toBe(true);
          // layerB
          expect(pr.layerB).toBeDefined();
          expect(Array.isArray(pr.layerB.violations)).toBe(true);
          // layerC
          expect(pr.layerC).toBeDefined();
          expect(pr.layerC.screenshot).toBeNull();
          // layerD
          expect(pr.layerD).toBeDefined();
          expect(Array.isArray(pr.layerD.light)).toBe(true);
          expect(Array.isArray(pr.layerD.dark)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
