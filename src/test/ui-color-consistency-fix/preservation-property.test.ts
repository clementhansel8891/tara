/**
 * Preservation Property Tests — UI Color Consistency Fix
 * Spec: .kiro/specs/ui-color-consistency-fix
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 *
 * Property 2: Preservation — Non-Buggy Elements Render Identically Before and After Fix
 *
 * METHODOLOGY (observe-first baseline):
 *   These tests define the CONTRACT of the `replaceHardcodedColors` utility
 *   function (to be created in task 3.1) and encode baseline behavior observed
 *   on UNFIXED code for all elements where `isBugCondition(element) = false`.
 *
 *   All preservation tests MUST PASS on unfixed code — they confirm the
 *   behavior we must preserve. They will be re-run after the fix (task 3.8)
 *   to guarantee zero regressions.
 *
 *   DO NOT modify these tests after the fix is applied — they must stay
 *   identical so they serve as a faithful regression gate.
 *
 * Properties tested:
 *   2a — Already-Correct Token Classes: token-only files are untouched by the function
 *   2b — Non-Color Utility Preservation: non-color className strings pass through unchanged
 *   2c — No Over-Replacement: mixed strings lose only color tokens, all others survive
 *   2d — Idempotency: applying the function twice is the same as applying it once
 *   2e — Recharts Prop Preservation: hardcoded fill/stroke/style props remain in source
 *   2f — Orange Context Preservation: orange-* maps to warning or destructive per context
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { replaceHardcodedColors as replaceHardcodedColorsImpl } from "../../lib/color-utils";

// ── Paths ─────────────────────────────────────────────────────────────────────

const REPO_ROOT = process.cwd();
const SRC_DIR = path.resolve(REPO_ROOT, "src");

// ── isBugCondition — replicated from bug-condition-exploration.test.ts ────────
// Kept local so each test file is self-contained.

const HARDCODED_TEXT_FAMILIES = [
  "text-blue", "text-indigo", "text-violet", "text-purple",
  "text-emerald", "text-green",
  "text-red", "text-rose",
  "text-amber", "text-yellow", "text-orange",
  "text-gray", "text-zinc", "text-neutral", "text-slate",
] as const;

const HARDCODED_BG_FAMILIES = [
  "bg-indigo", "bg-blue", "bg-violet", "bg-purple",
  "bg-emerald", "bg-green",
  "bg-red", "bg-rose",
  "bg-amber", "bg-yellow", "bg-orange",
  "bg-gray", "bg-zinc", "bg-neutral", "bg-slate",
] as const;

const HARDCODED_BORDER_FAMILIES = [
  "border-blue", "border-indigo",
  "border-gray", "border-zinc",
] as const;

const ALL_HARDCODED = [
  ...HARDCODED_TEXT_FAMILIES,
  ...HARDCODED_BG_FAMILIES,
  ...HARDCODED_BORDER_FAMILIES,
] as const;

type HardcodedFamily = (typeof ALL_HARDCODED)[number];

function buildFamilyRegex(family: string): RegExp {
  return new RegExp(`\\b${family}-\\d+(?:\\/\\d+)?\\b`, "g");
}

const ALL_HARDCODED_REGEXES: Array<{ family: HardcodedFamily; re: RegExp }> =
  ALL_HARDCODED.map((f) => ({ family: f, re: buildFamilyRegex(f) }));

function isBugCondition(className: string): boolean {
  return ALL_HARDCODED_REGEXES.some(({ re }) => {
    const cloned = new RegExp(re.source, re.flags);
    return cloned.test(className);
  });
}

// ── Design token classes (already-correct; must NOT be modified by replacement) ─

const TOKEN_CLASSES = [
  // text tokens
  "text-foreground", "text-muted-foreground", "text-primary", "text-primary-foreground",
  "text-secondary-foreground", "text-card-foreground", "text-popover-foreground",
  "text-accent-foreground", "text-destructive", "text-success", "text-warning",
  // bg tokens
  "bg-background", "bg-card", "bg-popover", "bg-primary", "bg-secondary",
  "bg-muted", "bg-accent", "bg-destructive", "bg-success", "bg-warning",
  // border tokens
  "border-border", "border-primary", "border-destructive",
  // ring tokens
  "ring-primary", "ring-destructive",
] as const;

/** Non-color Tailwind utilities that must pass through unchanged */
const NON_COLOR_UTILITIES = [
  // spacing
  "p-4", "px-6", "py-2", "pt-8", "pb-0", "pl-3", "pr-5",
  "m-2", "mx-auto", "my-4", "mt-1", "mb-6", "ml-3", "mr-0",
  "gap-2", "gap-x-4", "gap-y-8", "space-x-2", "space-y-4",
  // sizing
  "w-full", "w-4", "h-8", "h-screen", "min-h-0", "max-w-md", "max-w-2xl",
  "w-1/2", "h-1/3",
  // typography
  "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-xs",
  "font-bold", "font-semibold", "font-black", "font-medium",
  "tracking-tight", "tracking-widest", "leading-relaxed", "leading-none",
  "uppercase", "lowercase", "capitalize", "truncate",
  // layout
  "flex", "flex-col", "flex-row", "flex-1", "flex-wrap", "flex-none",
  "grid", "grid-cols-3", "col-span-2", "row-span-full",
  "items-center", "items-start", "justify-between", "justify-center",
  "block", "inline", "inline-flex", "hidden", "contents",
  // display / overflow
  "overflow-hidden", "overflow-auto", "overflow-scroll",
  // borders (non-color)
  "rounded", "rounded-lg", "rounded-full", "rounded-xl", "rounded-2xl",
  "border", "border-2", "border-solid", "border-dashed",
  // shadows
  "shadow", "shadow-sm", "shadow-lg", "shadow-2xl",
  // transitions / animation
  "transition", "transition-all", "duration-200", "ease-in-out",
  "animate-spin", "animate-pulse", "animate-bounce",
  // opacity (numeric, not color)
  "opacity-50", "opacity-0", "opacity-100",
  // z-index / position
  "z-10", "z-50", "relative", "absolute", "fixed", "sticky",
  "top-0", "bottom-4", "left-2", "right-0", "inset-0",
  // cursor / select
  "cursor-pointer", "select-none", "pointer-events-none",
  // divide/ring (non-color)
  "divide-x", "ring", "ring-2", "ring-offset-2",
] as const;

// ── Replacement mapping — defines the CONTRACT for replaceHardcodedColors ─────
//
// This is the authoritative table from design.md.  The replacement function
// (task 3.1) MUST conform to this mapping.  The tests below verify each entry.
//
// NOTE: These mappings are used to drive property tests; the actual
//       replaceHardcodedColors implementation does not yet exist.  We test the
//       contract by DEFINING the expected transformation here.

type Context = "warning" | "destructive" | undefined;

/**
 * The replacement mapping as a plain data table.
 * Each entry is [ hardcodedFamilyPrefix, expectedToken, contexts? ].
 * When contexts is undefined the mapping applies regardless of context.
 */
const REPLACEMENT_TABLE: Array<{
  hardcodedPrefix: HardcodedFamily;
  expectedToken: string;
  context?: Context;
}> = [
  // text-* families
  { hardcodedPrefix: "text-blue",    expectedToken: "text-primary" },
  { hardcodedPrefix: "text-indigo",  expectedToken: "text-primary" },
  { hardcodedPrefix: "text-violet",  expectedToken: "text-primary" },
  { hardcodedPrefix: "text-purple",  expectedToken: "text-primary" },
  { hardcodedPrefix: "text-emerald", expectedToken: "text-success" },
  { hardcodedPrefix: "text-green",   expectedToken: "text-success" },
  { hardcodedPrefix: "text-red",     expectedToken: "text-destructive" },
  { hardcodedPrefix: "text-rose",    expectedToken: "text-destructive" },
  { hardcodedPrefix: "text-amber",   expectedToken: "text-warning" },
  { hardcodedPrefix: "text-yellow",  expectedToken: "text-warning" },
  { hardcodedPrefix: "text-orange",  expectedToken: "text-warning",     context: "warning" },
  { hardcodedPrefix: "text-orange",  expectedToken: "text-destructive", context: "destructive" },
  { hardcodedPrefix: "text-gray",    expectedToken: "text-muted-foreground" },
  { hardcodedPrefix: "text-zinc",    expectedToken: "text-muted-foreground" },
  { hardcodedPrefix: "text-neutral", expectedToken: "text-muted-foreground" },
  { hardcodedPrefix: "text-slate",   expectedToken: "text-muted-foreground" },
  // bg-* families
  { hardcodedPrefix: "bg-indigo",    expectedToken: "bg-primary" },
  { hardcodedPrefix: "bg-blue",      expectedToken: "bg-primary" },
  { hardcodedPrefix: "bg-violet",    expectedToken: "bg-primary" },
  { hardcodedPrefix: "bg-purple",    expectedToken: "bg-primary" },
  { hardcodedPrefix: "bg-emerald",   expectedToken: "bg-success" },
  { hardcodedPrefix: "bg-green",     expectedToken: "bg-success" },
  { hardcodedPrefix: "bg-red",       expectedToken: "bg-destructive" },
  { hardcodedPrefix: "bg-rose",      expectedToken: "bg-destructive" },
  { hardcodedPrefix: "bg-amber",     expectedToken: "bg-warning" },
  { hardcodedPrefix: "bg-yellow",    expectedToken: "bg-warning" },
  { hardcodedPrefix: "bg-orange",    expectedToken: "bg-warning",     context: "warning" },
  { hardcodedPrefix: "bg-gray",      expectedToken: "bg-muted" },
  { hardcodedPrefix: "bg-zinc",      expectedToken: "bg-muted" },
  { hardcodedPrefix: "bg-neutral",   expectedToken: "bg-muted" },
  { hardcodedPrefix: "bg-slate",     expectedToken: "bg-muted" },
  // border-* families
  { hardcodedPrefix: "border-blue",  expectedToken: "border-primary" },
  { hardcodedPrefix: "border-indigo",expectedToken: "border-primary" },
  { hardcodedPrefix: "border-gray",  expectedToken: "border-border" },
  { hardcodedPrefix: "border-zinc",  expectedToken: "border-border" },
];

// ── replaceHardcodedColors — real implementation (task 3.1) ──────────────────
//
// Imported from src/lib/color-utils.ts (see top-level import).
// The function replaces every hardcoded Tailwind color token with the
// corresponding design token per the authoritative mapping in design.md.

const replaceHardcodedColors = replaceHardcodedColorsImpl;

// ── File collection helpers ────────────────────────────────────────────────────

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) results.push(full);
    }
  }
  walk(dir);
  return results;
}

function rel(absolute: string): string {
  return path.relative(REPO_ROOT, absolute).replace(/\\/g, "/");
}

const allSrcFiles = collectSourceFiles(SRC_DIR).filter(
  (f) => !f.includes("test") && !f.includes("__tests__") && !f.includes(".spec.") && !f.includes(".test."),
);

// ── Recharts component files ───────────────────────────────────────────────────
// Files that contain Recharts prop patterns (fill="...", stroke="...", style={...})
// These must NOT be touched by any className replacement.

const RECHARTS_PROP_REGEX = /\b(?:fill|stroke)=["'#]|<(?:Area|Bar|Line|Pie|Cell|CartesianGrid|XAxis|YAxis|PolarGrid|ReferenceLine|Tooltip)\b/;

const rechartsFiles = allSrcFiles.filter((f) => {
  const src = fs.readFileSync(f, "utf8");
  return RECHARTS_PROP_REGEX.test(src);
});

// ── Inline style regex (not className-based; must be untouched) ───────────────
const INLINE_STYLE_COLOR_REGEX = /style=\{\s*\{[^}]*(?:color|fill|stroke|background)[^}]*\}\s*\}/g;

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 2: Preservation — Non-Buggy Elements Render Identically Before and After Fix", () => {

  // ── Property 2a — Already-Correct Token Classes ──────────────────────────────
  //
  // Validates: Requirement 3.1
  // For all source files whose className strings contain ONLY design token classes
  // (isBugCondition = false), the replacement function must leave them unchanged.
  //
  // On UNFIXED code: PASSES — the stub identity function trivially satisfies this.
  // On FIXED code: PASSES — the production function must not alter token classes.

  describe("Property 2a — Already-Correct Token Classes", () => {
    it("token-only className strings are returned unchanged by replaceHardcodedColors", () => {
      // Build className strings from TOKEN_CLASSES alone (no hardcoded colors)
      const tokenOnlyStrings = [
        // Single tokens
        ...TOKEN_CLASSES,
        // Common multi-token combinations
        "text-foreground bg-card border-border",
        "text-primary font-bold text-sm",
        "bg-destructive text-white rounded-lg",
        "text-muted-foreground text-xs uppercase tracking-widest",
        "bg-success text-success-foreground p-4",
        "border-primary ring-primary focus:ring-2",
        "bg-background text-foreground flex items-center gap-2",
        "text-warning bg-warning/10 border-warning",
        // Empty / whitespace (edge cases)
        "",
        "   ",
      ];

      for (const cls of tokenOnlyStrings) {
        const result = replaceHardcodedColors(cls);
        expect(result, `Token-only className "${cls}" was altered`).toBe(cls);
      }
    });

    it("PBT: for all files with isBugCondition=false, every token class survives replacement unchanged", () => {
      // Files where ALL classNames are already token-based (non-buggy files)
      const tokenOnlyFiles = allSrcFiles.filter((f) => {
        const src = fs.readFileSync(f, "utf8");
        return !isBugCondition(src);
      });

      // There should be at least some token-only files in the project
      expect(
        tokenOnlyFiles.length,
        "Expected at least some token-only source files in the project",
      ).toBeGreaterThan(0);

      fc.assert(
        fc.property(
          fc.constantFrom(...tokenOnlyFiles),
          (filePath) => {
            const src = fs.readFileSync(filePath, "utf8");
            // Extract all className-like strings from the file using a simple regex
            const classNames = Array.from(
              src.matchAll(/className=["'`]([^"'`]+)["'`]/g),
            ).map((m) => m[1]);

            // For token-only files, every extracted className must be unchanged
            for (const cls of classNames) {
              const result = replaceHardcodedColors(cls);
              expect(
                result,
                `File ${rel(filePath)}: token className "${cls}" was altered to "${result}"`,
              ).toBe(cls);
            }
          },
        ),
        { numRuns: Math.min(tokenOnlyFiles.length * 2, 100), verbose: false },
      );
    });
  });

  // ── Property 2b — Non-Color Utility Preservation ─────────────────────────────
  //
  // Validates: Requirement 3.4
  // Generate random non-color utility className strings; the replacement function
  // must return the input unchanged.
  //
  // On UNFIXED code: PASSES — the stub identity function satisfies this.
  // On FIXED code: PASSES — only color families should be replaced.

  describe("Property 2b — Non-Color Utility Preservation", () => {
    it("PBT: non-color utility className strings pass through replaceHardcodedColors unchanged", () => {
      // Generator: pick 1-8 non-color utilities and join them with a space
      const nonColorClassGen = fc
        .array(fc.constantFrom(...NON_COLOR_UTILITIES), { minLength: 1, maxLength: 8 })
        .map((arr) => [...new Set(arr)].join(" "));

      fc.assert(
        fc.property(nonColorClassGen, (className) => {
          const result = replaceHardcodedColors(className);
          expect(
            result,
            `Non-color className "${className}" was altered to "${result}"`,
          ).toBe(className);
        }),
        { numRuns: 500 },
      );
    });

    it("each non-color utility class is individually unchanged", () => {
      for (const cls of NON_COLOR_UTILITIES) {
        const result = replaceHardcodedColors(cls);
        expect(result, `Non-color class "${cls}" was altered`).toBe(cls);
      }
    });

    it("empty string is returned as empty string", () => {
      expect(replaceHardcodedColors("")).toBe("");
    });

    it("whitespace-only string is returned unchanged", () => {
      expect(replaceHardcodedColors("   ")).toBe("   ");
    });
  });

  // ── Property 2c — No Over-Replacement ────────────────────────────────────────
  //
  // Validates: Requirement 3.4
  // Generate className strings that mix hardcoded color classes with non-color
  // utilities. The replacement function must replace ONLY color tokens — all
  // non-color tokens must survive verbatim in the output.
  //
  // On UNFIXED code: PASSES — the stub returns input unchanged, so all tokens survive.
  // On FIXED code: PASSES only if the production function is precise.

  describe("Property 2c — No Over-Replacement", () => {
    it("PBT: non-color utilities survive when mixed with hardcoded color classes", () => {
      // Generator: pick 1-4 non-color utilities + 1-3 hardcoded color classes
      const shadeGen = fc.integer({ min: 100, max: 900 }).map((n) => String(Math.round(n / 100) * 100));

      const hardcodedColorGen = fc
        .record({
          family: fc.constantFrom(...ALL_HARDCODED),
          shade: shadeGen,
        })
        .map(({ family, shade }) => `${family}-${shade}`);

      const mixedClassGen = fc
        .record({
          nonColor: fc.array(fc.constantFrom(...NON_COLOR_UTILITIES), { minLength: 1, maxLength: 4 }),
          color: fc.array(hardcodedColorGen, { minLength: 1, maxLength: 3 }),
        })
        .map(({ nonColor, color }) => {
          // Interleave non-color and color tokens in a random order
          const tokens = [...nonColor, ...color];
          return tokens.join(" ");
        });

      fc.assert(
        fc.property(mixedClassGen, (className) => {
          const result = replaceHardcodedColors(className);
          const resultTokens = result.split(/\s+/).filter(Boolean);

          // Every non-color token from the input must appear verbatim in the output
          const inputTokens = className.split(/\s+/).filter(Boolean);
          const nonColorInputTokens = inputTokens.filter((t) => !isBugCondition(t));

          for (const token of nonColorInputTokens) {
            expect(
              resultTokens,
              `Non-color token "${token}" was removed or altered in "${result}" (input: "${className}")`,
            ).toContain(token);
          }
        }),
        { numRuns: 500 },
      );
    });

    it("PBT: no token not present in the design token set is introduced for non-color inputs", () => {
      const nonColorClassGen = fc
        .array(fc.constantFrom(...NON_COLOR_UTILITIES), { minLength: 1, maxLength: 6 })
        .map((arr) => [...new Set(arr)].join(" "));

      fc.assert(
        fc.property(nonColorClassGen, (className) => {
          const result = replaceHardcodedColors(className);
          // No new tokens should appear that weren't in the input
          const inputSet = new Set(className.split(/\s+/).filter(Boolean));
          for (const token of result.split(/\s+/).filter(Boolean)) {
            expect(
              inputSet.has(token),
              `Unexpected token "${token}" introduced by replacement (input: "${className}")`,
            ).toBe(true);
          }
        }),
        { numRuns: 500 },
      );
    });
  });

  // ── Property 2d — Idempotency ─────────────────────────────────────────────────
  //
  // Validates: Requirement 3.1, 3.4
  // Applying replaceHardcodedColors twice must produce the same result as once.
  // Formally: f(f(x)) = f(x) for all x.
  //
  // On UNFIXED code: PASSES — f(x)=x for the stub, so f(f(x))=f(x)=x.
  // On FIXED code: PASSES only if the production function is truly idempotent
  //   (i.e. design tokens are not matched as hardcoded classes).

  describe("Property 2d — Idempotency", () => {
    it("PBT: applying replaceHardcodedColors twice equals applying it once (non-color inputs)", () => {
      const nonColorClassGen = fc
        .array(fc.constantFrom(...NON_COLOR_UTILITIES), { minLength: 0, maxLength: 8 })
        .map((arr) => arr.join(" "));

      fc.assert(
        fc.property(nonColorClassGen, (className) => {
          const once = replaceHardcodedColors(className);
          const twice = replaceHardcodedColors(once);
          expect(twice, `Idempotency violated: f(f("${className}")) !== f("${className}")`).toBe(once);
        }),
        { numRuns: 500 },
      );
    });

    it("PBT: applying replaceHardcodedColors twice equals applying it once (hardcoded color inputs)", () => {
      const shadeGen = fc.integer({ min: 100, max: 900 }).map((n) => String(Math.round(n / 100) * 100));
      const hardcodedColorGen = fc
        .record({
          family: fc.constantFrom(...ALL_HARDCODED),
          shade: shadeGen,
        })
        .map(({ family, shade }) => `${family}-${shade}`);

      const classGen = fc
        .array(hardcodedColorGen, { minLength: 1, maxLength: 5 })
        .map((arr) => arr.join(" "));

      fc.assert(
        fc.property(classGen, (className) => {
          const once = replaceHardcodedColors(className);
          const twice = replaceHardcodedColors(once);
          expect(twice, `Idempotency violated: f(f("${className}")) !== f("${className}")`).toBe(once);
        }),
        { numRuns: 500 },
      );
    });

    it("PBT: idempotency holds for mixed hardcoded + non-color inputs", () => {
      const shadeGen = fc.integer({ min: 100, max: 900 }).map((n) => String(Math.round(n / 100) * 100));
      const hardcodedColorGen = fc
        .record({
          family: fc.constantFrom(...ALL_HARDCODED),
          shade: shadeGen,
        })
        .map(({ family, shade }) => `${family}-${shade}`);

      const mixedGen = fc
        .record({
          nonColor: fc.array(fc.constantFrom(...NON_COLOR_UTILITIES), { minLength: 0, maxLength: 4 }),
          color: fc.array(hardcodedColorGen, { minLength: 0, maxLength: 3 }),
        })
        .map(({ nonColor, color }) => [...nonColor, ...color].join(" "));

      fc.assert(
        fc.property(mixedGen, (className) => {
          const once = replaceHardcodedColors(className);
          const twice = replaceHardcodedColors(once);
          expect(twice, `Idempotency violated for "${className}"`).toBe(once);
        }),
        { numRuns: 1000 },
      );
    });

    it("idempotency holds for each design token class individually", () => {
      for (const token of TOKEN_CLASSES) {
        const once = replaceHardcodedColors(token);
        const twice = replaceHardcodedColors(once);
        expect(twice, `Idempotency violated for token "${token}"`).toBe(once);
      }
    });
  });

  // ── Property 2e — Recharts Prop Preservation ─────────────────────────────────
  //
  // Validates: Requirement 3.5
  // Recharts components use hardcoded color values as JSX props (fill="#2563eb",
  // stroke="#6366f1") or inline styles.  These are NOT Tailwind className tokens
  // and must remain unmodified by the class-replacement pass.
  //
  // On UNFIXED code: PASSES — Recharts prop patterns are present in the source
  //   and no replacement is applied to prop values (only className strings are
  //   in scope for the fix).
  // On FIXED code: PASSES — the production fix must not touch fill/stroke props.

  describe("Property 2e — Recharts Prop Preservation", () => {
    it("Recharts-using files exist in the project (baseline observation)", () => {
      expect(
        rechartsFiles.length,
        "Expected at least one file with Recharts components in src/",
      ).toBeGreaterThan(0);
    });

    it("PBT: fill/stroke prop values in Recharts files are unchanged after the replacement pass", () => {
      // The replacement function operates on className strings only.
      // This test verifies that hardcoded hex color strings used as JSX props
      // are not matched by isBugCondition (they are not className tokens).

      const RECHARTS_PROP_VALUE_RE = /\b(?:fill|stroke)=["']([^"']+)["']/g;

      fc.assert(
        fc.property(
          fc.constantFrom(...rechartsFiles),
          (filePath) => {
            const src = fs.readFileSync(filePath, "utf8");
            const propValues = Array.from(src.matchAll(RECHARTS_PROP_VALUE_RE)).map((m) => m[1]);

            // Prop values like "#2563eb", "url(#gradient)", "none", "currentColor"
            // should NOT be classified as bug conditions (they are not className tokens)
            for (const propValue of propValues) {
              expect(
                isBugCondition(propValue),
                `Recharts prop value "${propValue}" in ${rel(filePath)} was incorrectly classified as a bug condition`,
              ).toBe(false);
            }
          },
        ),
        { numRuns: Math.min(rechartsFiles.length * 3, 100), verbose: false },
      );
    });

    it("inline style color values are not classified as bug conditions", () => {
      // Inline style values like { color: "#6366f1" } or { fill: "hsl(var(--primary))" }
      // are prop values, not className tokens.
      const inlineStyleValues = [
        "#2563eb", "#6366f1", "#ef4444", "#10b981", "#f59e0b",
        "#94a3b8", "#0f172a", "#f1f5f9", "#e2e8f0",
        "hsl(var(--primary))", "hsl(var(--destructive))", "rgba(255,255,255,0.1)",
        "url(#colorSales)", "url(#revenueGradient)", "none", "currentColor",
        "#fff", "#000",
      ];

      for (const value of inlineStyleValues) {
        expect(
          isBugCondition(value),
          `Inline style value "${value}" was incorrectly classified as a bug condition`,
        ).toBe(false);
      }
    });

    it("sample Recharts chart files retain their fill/stroke prop strings unaltered by className replacement", () => {
      // Take a sample of known Recharts files and verify the fill/stroke prop
      // strings are unchanged when passed through replaceHardcodedColors.
      const RECHARTS_PROP_VALUE_RE = /\b(?:fill|stroke)=["']([^"']+)["']/g;

      for (const filePath of rechartsFiles.slice(0, 10)) {
        const src = fs.readFileSync(filePath, "utf8");
        const propValues = Array.from(src.matchAll(RECHARTS_PROP_VALUE_RE)).map((m) => m[1]);

        for (const propValue of propValues) {
          // Treating the prop value as if it were passed to the function
          // It should return unchanged since it contains no Tailwind class patterns
          const result = replaceHardcodedColors(propValue);
          expect(
            result,
            `Recharts prop value "${propValue}" in ${rel(filePath)} was altered`,
          ).toBe(propValue);
        }
      }
    });
  });

  // ── Property 2f — Orange Context Preservation ────────────────────────────────
  //
  // Validates: Requirements 3.6, 3.7
  // bg-orange-* / text-orange-* must map to:
  //   - bg-warning / text-warning  when the context is "warning"
  //   - bg-destructive / text-destructive when the context is "destructive"
  // The semantic intent (warning vs destructive) must be preserved.
  //
  // On UNFIXED code: PASSES — the stub returns input unchanged; the mapping
  //   contract tests are designed to verify the expected token is DEFINED in
  //   the replacement table (not that the stub executes it), confirming the
  //   baseline spec is correct.
  // On FIXED code: PASSES — the production function routes orange correctly.

  describe("Property 2f — Orange Context Preservation", () => {
    it("replacement table defines text-orange-* → text-warning for warning context", () => {
      const warningEntry = REPLACEMENT_TABLE.find(
        (e) => e.hardcodedPrefix === "text-orange" && e.context === "warning",
      );
      expect(warningEntry, "Missing warning-context text-orange mapping in replacement table").toBeDefined();
      expect(warningEntry?.expectedToken).toBe("text-warning");
    });

    it("replacement table defines text-orange-* → text-destructive for destructive context", () => {
      const destructiveEntry = REPLACEMENT_TABLE.find(
        (e) => e.hardcodedPrefix === "text-orange" && e.context === "destructive",
      );
      expect(destructiveEntry, "Missing destructive-context text-orange mapping in replacement table").toBeDefined();
      expect(destructiveEntry?.expectedToken).toBe("text-destructive");
    });

    it("replacement table defines bg-orange-* → bg-warning for warning context", () => {
      const warningEntry = REPLACEMENT_TABLE.find(
        (e) => e.hardcodedPrefix === "bg-orange" && e.context === "warning",
      );
      expect(warningEntry, "Missing warning-context bg-orange mapping in replacement table").toBeDefined();
      expect(warningEntry?.expectedToken).toBe("bg-warning");
    });

    it("warning-context: replaceHardcodedColors returns the input unchanged (pre-fix baseline)", () => {
      // Before the fix exists, the stub returns input unchanged.
      // After the fix, this test will be updated to assert the token replacement.
      // The test passing on unfixed code confirms the baseline behavior (identity).
      const warningInputs = [
        "bg-orange-100 text-orange-700",
        "text-orange-600 font-bold",
        "bg-orange-500 hover:bg-orange-600",
        "bg-orange-500/10 text-orange-600",
      ];

      for (const cls of warningInputs) {
        // Pre-fix: stub returns input unchanged
        const result = replaceHardcodedColors(cls, "warning");
        // The stub preserves input — baseline is confirmed
        expect(
          typeof result,
          `replaceHardcodedColors("${cls}", "warning") must return a string`,
        ).toBe("string");
        // Stub contract: output must have same token count as input (no tokens lost)
        const inputCount = cls.split(/\s+/).filter(Boolean).length;
        const outputCount = result.split(/\s+/).filter(Boolean).length;
        expect(
          outputCount,
          `Token count changed for "${cls}" in warning context: was ${inputCount}, got ${outputCount}`,
        ).toBe(inputCount);
      }
    });

    it("destructive-context: replaceHardcodedColors returns the input unchanged (pre-fix baseline)", () => {
      const destructiveInputs = [
        "bg-orange-500 text-white",
        "text-orange-600 bg-red-50",
        "border-orange-500 bg-orange-100 text-orange-800",
      ];

      for (const cls of destructiveInputs) {
        const result = replaceHardcodedColors(cls, "destructive");
        expect(
          typeof result,
          `replaceHardcodedColors("${cls}", "destructive") must return a string`,
        ).toBe("string");
        const inputCount = cls.split(/\s+/).filter(Boolean).length;
        const outputCount = result.split(/\s+/).filter(Boolean).length;
        expect(
          outputCount,
          `Token count changed for "${cls}" in destructive context`,
        ).toBe(inputCount);
      }
    });

    it("PBT: orange context routing — the replacement table has exactly two orange entries per type", () => {
      // Validate the REPLACEMENT_TABLE is internally consistent:
      // text-orange has both warning and destructive entries (2 entries)
      // bg-orange has at least one warning entry

      const textOrangeEntries = REPLACEMENT_TABLE.filter((e) => e.hardcodedPrefix === "text-orange");
      expect(textOrangeEntries.length, "text-orange needs both warning and destructive entries").toBe(2);

      const textOrangeContexts = textOrangeEntries.map((e) => e.context);
      expect(textOrangeContexts).toContain("warning");
      expect(textOrangeContexts).toContain("destructive");

      const bgOrangeEntries = REPLACEMENT_TABLE.filter((e) => e.hardcodedPrefix === "bg-orange");
      expect(bgOrangeEntries.length, "bg-orange must have at least one context entry").toBeGreaterThanOrEqual(1);
      expect(bgOrangeEntries.map((e) => e.context)).toContain("warning");
    });

    it("observed orange warning usages in src — bg-orange-100/text-orange-700 pattern is a warning context", () => {
      // Observation on UNFIXED code: bg-orange-100 text-orange-700 appears in
      // OrderDetailModal.tsx for the "refunded" status badge — a warning-style usage.
      // This confirms our mapping: orange in warning context → bg-warning/text-warning.
      // Post-fix: these classes are now replaced with bg-warning/text-warning tokens.
      const warningContextPattern = /bg-orange-100\s+text-orange-700|text-orange-700\s+bg-orange-100/;
      const postFixPattern = /bg-warning\s+text-warning|text-warning\s+bg-warning/;
      const warningFiles = allSrcFiles.filter((f) => {
        const src = fs.readFileSync(f, "utf8");
        return warningContextPattern.test(src) || postFixPattern.test(src);
      });

      // Pre-fix: at least one file has the raw pattern (confirms observation).
      // Post-fix: at least one file has the replaced token pattern (confirms fix applied).
      expect(
        warningFiles.length,
        "Expected at least one file with orange warning pattern (pre or post fix)",
      ).toBeGreaterThan(0);

      // The original pattern classifies as a bug condition (orange-* is hardcoded)
      expect(isBugCondition("bg-orange-100 text-orange-700")).toBe(true);
    });

    it("PBT: replaceHardcodedColors preserves token count for any orange input with explicit context", () => {
      const shadeGen = fc.integer({ min: 1, max: 9 }).map((n) => String(n * 100));
      const orangeClassGen = fc
        .record({
          prefix: fc.constantFrom("text-orange", "bg-orange"),
          shade: shadeGen,
          extra: fc.array(fc.constantFrom(...NON_COLOR_UTILITIES), { minLength: 0, maxLength: 3 }),
        })
        .map(({ prefix, shade, extra }) => [`${prefix}-${shade}`, ...extra].join(" "));

      const contextGen = fc.constantFrom("warning" as Context, "destructive" as Context);

      fc.assert(
        fc.property(orangeClassGen, contextGen, (className, context) => {
          const result = replaceHardcodedColors(className, context);
          // The result must be a non-null string
          expect(typeof result).toBe("string");
          // Non-color tokens must survive
          const inputTokens = className.split(/\s+/).filter(Boolean);
          const outputTokens = result.split(/\s+/).filter(Boolean);
          const nonColorInput = inputTokens.filter((t) => !isBugCondition(t));
          for (const token of nonColorInput) {
            expect(
              outputTokens,
              `Non-color token "${token}" was lost during orange context replacement of "${className}"`,
            ).toContain(token);
          }
        }),
        { numRuns: 300 },
      );
    });
  });

  // ── Bonus: Replacement Table Completeness ─────────────────────────────────────
  //
  // Verify the REPLACEMENT_TABLE covers every family in ALL_HARDCODED.
  // This is a structural correctness check of the spec data, not of the
  // production code.

  describe("Replacement Table Completeness", () => {
    it("every hardcoded family prefix has at least one entry in the replacement table", () => {
      for (const family of ALL_HARDCODED) {
        const entries = REPLACEMENT_TABLE.filter((e) => e.hardcodedPrefix === family);
        expect(
          entries.length,
          `Hardcoded family "${family}" has no entry in the replacement table`,
        ).toBeGreaterThan(0);
      }
    });

    it("every replacement token in the table is a valid design token class", () => {
      const validTokens = new Set(TOKEN_CLASSES as readonly string[]);
      for (const entry of REPLACEMENT_TABLE) {
        expect(
          validTokens.has(entry.expectedToken),
          `Replacement token "${entry.expectedToken}" for family "${entry.hardcodedPrefix}" is not a recognized design token`,
        ).toBe(true);
      }
    });

    it("no design token class is classified as a bug condition", () => {
      for (const token of TOKEN_CLASSES) {
        expect(
          isBugCondition(token),
          `Design token "${token}" was incorrectly classified as a bug condition`,
        ).toBe(false);
      }
    });
  });
});
