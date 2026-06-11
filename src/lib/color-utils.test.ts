/**
 * Unit tests for color-utils.ts — isBugCondition and replaceHardcodedColors
 * Spec: .kiro/specs/ui-color-consistency-fix
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8,
 *               3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 *
 * Coverage:
 *   - isBugCondition: true for all hardcoded families; false for token
 *     classes, non-color utilities, and edge cases (empty, whitespace).
 *   - replaceHardcodedColors: each mapping entry; edge cases (empty,
 *     whitespace, non-color-only, token-only, mixed, partial-fix);
 *     context-sensitive orange routing (warning vs destructive);
 *     idempotency.
 */

import { describe, it, expect } from "vitest";
import {
  isBugCondition,
  replaceHardcodedColors,
  ALL_HARDCODED,
} from "./color-utils";

// ─────────────────────────────────────────────────────────────────────────────
// isBugCondition
// ─────────────────────────────────────────────────────────────────────────────

describe("isBugCondition", () => {
  describe("returns true for hardcoded text color families", () => {
    const textCases: Array<[string, string]> = [
      ["text-blue-600",   "blue text"],
      ["text-indigo-400", "indigo text"],
      ["text-violet-500", "violet text"],
      ["text-purple-700", "purple text"],
      ["text-emerald-600","emerald text"],
      ["text-green-500",  "green text"],
      ["text-red-600",    "red text"],
      ["text-rose-500",   "rose text"],
      ["text-amber-400",  "amber text"],
      ["text-yellow-300", "yellow text"],
      ["text-orange-500", "orange text"],
      ["text-gray-400",   "gray text"],
      ["text-zinc-500",   "zinc text"],
      ["text-neutral-600","neutral text"],
      ["text-slate-400",  "slate text"],
    ];

    for (const [cls, label] of textCases) {
      it(`true for ${label}: "${cls}"`, () => {
        expect(isBugCondition(cls)).toBe(true);
      });
    }
  });

  describe("returns true for hardcoded bg color families", () => {
    const bgCases: Array<[string, string]> = [
      ["bg-indigo-600",   "indigo bg"],
      ["bg-blue-500",     "blue bg"],
      ["bg-violet-400",   "violet bg"],
      ["bg-purple-600",   "purple bg"],
      ["bg-emerald-500",  "emerald bg"],
      ["bg-green-600",    "green bg"],
      ["bg-red-500",      "red bg"],
      ["bg-rose-600",     "rose bg"],
      ["bg-amber-400",    "amber bg"],
      ["bg-yellow-300",   "yellow bg"],
      ["bg-orange-500",   "orange bg"],
      ["bg-gray-200",     "gray bg"],
      ["bg-zinc-700",     "zinc bg"],
      ["bg-neutral-100",  "neutral bg"],
      ["bg-slate-800",    "slate bg"],
    ];

    for (const [cls, label] of bgCases) {
      it(`true for ${label}: "${cls}"`, () => {
        expect(isBugCondition(cls)).toBe(true);
      });
    }
  });

  describe("returns true for hardcoded border color families", () => {
    it('true for "border-blue-500"',   () => expect(isBugCondition("border-blue-500")).toBe(true));
    it('true for "border-indigo-400"', () => expect(isBugCondition("border-indigo-400")).toBe(true));
    it('true for "border-gray-300"',   () => expect(isBugCondition("border-gray-300")).toBe(true));
    it('true for "border-zinc-400"',   () => expect(isBugCondition("border-zinc-400")).toBe(true));
  });

  describe("returns true when mixed into multi-token strings", () => {
    it('true for "flex p-4 text-blue-600 rounded"', () =>
      expect(isBugCondition("flex p-4 text-blue-600 rounded")).toBe(true));
    it('true for "bg-card text-gray-400 font-semibold"', () =>
      expect(isBugCondition("bg-card text-gray-400 font-semibold")).toBe(true));
    it('true for "text-primary bg-indigo-900"', () =>
      expect(isBugCondition("text-primary bg-indigo-900")).toBe(true));
    it("true with opacity modifier text-blue-600/50", () =>
      expect(isBugCondition("text-blue-600/50")).toBe(true));
  });

  describe("returns false for design token classes", () => {
    const tokenCases = [
      "text-foreground", "text-muted-foreground", "text-primary",
      "text-primary-foreground", "text-secondary-foreground",
      "text-destructive", "text-success", "text-warning",
      "bg-background", "bg-card", "bg-popover", "bg-primary",
      "bg-secondary", "bg-muted", "bg-accent", "bg-destructive",
      "bg-success", "bg-warning",
      "border-border", "border-primary", "border-destructive",
    ];

    for (const token of tokenCases) {
      it(`false for token "${token}"`, () => {
        expect(isBugCondition(token)).toBe(false);
      });
    }
  });

  describe("returns false for non-color utilities", () => {
    const nonColorCases = [
      "p-4", "px-6", "py-2", "m-2", "mx-auto", "gap-4",
      "w-full", "h-8", "max-w-md",
      "text-sm", "text-base", "text-lg", "text-xl", "text-xs",
      "font-bold", "font-semibold", "tracking-tight",
      "flex", "flex-col", "flex-1", "grid", "grid-cols-3",
      "items-center", "justify-between", "block", "hidden",
      "rounded", "rounded-lg", "border", "border-2", "shadow",
      "transition", "duration-200", "animate-spin", "opacity-50",
      "z-10", "relative", "absolute", "cursor-pointer",
    ];

    for (const cls of nonColorCases) {
      it(`false for "${cls}"`, () => {
        expect(isBugCondition(cls)).toBe(false);
      });
    }
  });

  describe("edge cases", () => {
    it('false for empty string ""', () => expect(isBugCondition("")).toBe(false));
    it('false for whitespace "   "', () => expect(isBugCondition("   ")).toBe(false));
    it('false for Recharts hex color "#2563eb"', () =>
      expect(isBugCondition("#2563eb")).toBe(false));
    it('false for inline style value "hsl(var(--primary))"', () =>
      expect(isBugCondition("hsl(var(--primary))")).toBe(false));
    it('false for "currentColor"', () => expect(isBugCondition("currentColor")).toBe(false));
    it("covers every family in ALL_HARDCODED with shade 500", () => {
      for (const family of ALL_HARDCODED) {
        expect(isBugCondition(`${family}-500`), `failed for ${family}-500`).toBe(true);
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// replaceHardcodedColors — edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe("replaceHardcodedColors — edge cases", () => {
  it('returns "" for empty string', () => {
    expect(replaceHardcodedColors("")).toBe("");
  });

  it('returns whitespace-only string unchanged (original content preserved)', () => {
    expect(replaceHardcodedColors("   ")).toBe("   ");
  });

  it("returns non-color-only string unchanged", () => {
    const input = "flex items-center gap-4 p-6 font-bold text-sm";
    expect(replaceHardcodedColors(input)).toBe(input);
  });

  it("returns token-only string unchanged", () => {
    const input = "text-foreground bg-card border-border";
    expect(replaceHardcodedColors(input)).toBe(input);
  });

  it("replaces a single hardcoded token at the start of a string", () => {
    expect(replaceHardcodedColors("text-blue-600 flex items-center"))
      .toBe("text-primary flex items-center");
  });

  it("replaces a single hardcoded token at the end of a string", () => {
    expect(replaceHardcodedColors("flex items-center text-blue-600"))
      .toBe("flex items-center text-primary");
  });

  it("replaces multiple hardcoded tokens in one string", () => {
    expect(
      replaceHardcodedColors("text-emerald-600 bg-indigo-900 border-gray-300"),
    ).toBe("text-success bg-primary border-border");
  });

  it("preserves non-color tokens in a mixed string (partial-fix scenario)", () => {
    const input = "p-4 text-blue-600 font-semibold bg-emerald-500 rounded-lg";
    const result = replaceHardcodedColors(input);
    expect(result).toBe("p-4 text-primary font-semibold bg-success rounded-lg");
    // Non-color tokens survive
    expect(result.split(" ")).toContain("p-4");
    expect(result.split(" ")).toContain("font-semibold");
    expect(result.split(" ")).toContain("rounded-lg");
  });

  it("handles opacity-modifier tokens (e.g. text-blue-600/50)", () => {
    expect(replaceHardcodedColors("text-blue-600/50")).toBe("text-primary");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// replaceHardcodedColors — each mapping entry
// ─────────────────────────────────────────────────────────────────────────────

describe("replaceHardcodedColors — mapping table", () => {
  const mappings: Array<[string, string, string?]> = [
    // text-* families
    ["text-blue-600",    "text-primary"],
    ["text-blue-400",    "text-primary"],
    ["text-indigo-400",  "text-primary"],
    ["text-indigo-300",  "text-primary"],
    ["text-violet-500",  "text-primary"],
    ["text-purple-700",  "text-primary"],
    ["text-emerald-600", "text-success"],
    ["text-emerald-500", "text-success"],
    ["text-green-500",   "text-success"],
    ["text-red-600",     "text-destructive"],
    ["text-rose-600",    "text-destructive"],
    ["text-amber-400",   "text-warning"],
    ["text-yellow-300",  "text-warning"],
    ["text-gray-400",    "text-muted-foreground"],
    ["text-gray-300",    "text-muted-foreground"],
    ["text-zinc-500",    "text-muted-foreground"],
    ["text-neutral-600", "text-muted-foreground"],
    ["text-slate-400",   "text-muted-foreground"],
    // bg-* families
    ["bg-indigo-600",    "bg-primary"],
    ["bg-indigo-900",    "bg-primary"],
    ["bg-blue-500",      "bg-primary"],
    ["bg-violet-400",    "bg-primary"],
    ["bg-purple-600",    "bg-primary"],
    ["bg-emerald-500",   "bg-success"],
    ["bg-green-600",     "bg-success"],
    ["bg-red-500",       "bg-destructive"],
    ["bg-rose-600",      "bg-destructive"],
    ["bg-amber-400",     "bg-warning"],
    ["bg-yellow-300",    "bg-warning"],
    ["bg-gray-200",      "bg-muted"],
    ["bg-zinc-700",      "bg-muted"],
    ["bg-neutral-100",   "bg-muted"],
    ["bg-slate-800",     "bg-muted"],
    // border-* families
    ["border-blue-500",   "border-primary"],
    ["border-indigo-400", "border-primary"],
    ["border-gray-300",   "border-border"],
    ["border-zinc-400",   "border-border"],
  ];

  for (const [input, expected] of mappings) {
    it(`"${input}" → "${expected}"`, () => {
      expect(replaceHardcodedColors(input)).toBe(expected);
    });
  }

  // Various shade numbers for representative families
  it("maps text-blue-* at different shades all to text-primary", () => {
    for (const shade of [100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(replaceHardcodedColors(`text-blue-${shade}`)).toBe("text-primary");
    }
  });

  it("maps bg-gray-* at different shades all to bg-muted", () => {
    for (const shade of [100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(replaceHardcodedColors(`bg-gray-${shade}`)).toBe("bg-muted");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// replaceHardcodedColors — orange context routing
// ─────────────────────────────────────────────────────────────────────────────

describe("replaceHardcodedColors — orange context routing", () => {
  describe("text-orange-* context detection", () => {
    const orangeShades = ["text-orange-100", "text-orange-400", "text-orange-500", "text-orange-700"];

    for (const cls of orangeShades) {
      it(`${cls} with context="warning" → "text-warning"`, () => {
        expect(replaceHardcodedColors(cls, "warning")).toBe("text-warning");
      });

      it(`${cls} with context="destructive" → "text-destructive"`, () => {
        expect(replaceHardcodedColors(cls, "destructive")).toBe("text-destructive");
      });

      it(`${cls} with no context → "text-warning" (default)`, () => {
        expect(replaceHardcodedColors(cls)).toBe("text-warning");
      });
    }
  });

  describe("bg-orange-* context detection", () => {
    const orangeShades = ["bg-orange-100", "bg-orange-400", "bg-orange-500"];

    for (const cls of orangeShades) {
      it(`${cls} with context="warning" → "bg-warning"`, () => {
        expect(replaceHardcodedColors(cls, "warning")).toBe("bg-warning");
      });

      it(`${cls} with context="destructive" → "bg-destructive"`, () => {
        expect(replaceHardcodedColors(cls, "destructive")).toBe("bg-destructive");
      });

      it(`${cls} with no context → "bg-warning" (default)`, () => {
        expect(replaceHardcodedColors(cls)).toBe("bg-warning");
      });
    }
  });

  it("mixed orange + non-color tokens routed to warning preserves non-color tokens", () => {
    const result = replaceHardcodedColors("bg-orange-100 text-orange-700 rounded px-2", "warning");
    expect(result).toBe("bg-warning text-warning rounded px-2");
  });

  it("mixed orange + non-color tokens routed to destructive preserves non-color tokens", () => {
    const result = replaceHardcodedColors("bg-orange-500 text-orange-600 p-4", "destructive");
    expect(result).toBe("bg-destructive text-destructive p-4");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// replaceHardcodedColors — idempotency
// ─────────────────────────────────────────────────────────────────────────────

describe("replaceHardcodedColors — idempotency", () => {
  const idempotencyCases = [
    ["text-blue-600 flex", undefined],
    ["bg-indigo-900 p-4 font-bold", undefined],
    ["text-primary bg-card border-border", undefined],
    ["text-orange-500 items-center", "warning"],
    ["text-orange-500 items-center", "destructive"],
    ["bg-orange-100 text-orange-700 rounded px-2", "warning"],
    ["flex p-4 gap-2 font-semibold", undefined],
    ["", undefined],
    ["bg-gray-200 text-zinc-500 border-gray-300", undefined],
  ] as Array<[string, string | undefined]>;

  for (const [input, ctx] of idempotencyCases) {
    it(`idempotent for "${input}"${ctx ? ` (${ctx})` : ""}`, () => {
      const once = replaceHardcodedColors(input, ctx as "warning" | "destructive" | undefined);
      const twice = replaceHardcodedColors(once, ctx as "warning" | "destructive" | undefined);
      expect(twice).toBe(once);
    });
  }

  it("idempotency holds for every hardcoded family at shade 500", () => {
    for (const family of ALL_HARDCODED) {
      const input = `${family}-500`;
      const once = replaceHardcodedColors(input);
      const twice = replaceHardcodedColors(once);
      expect(twice, `idempotency failed for "${family}-500"`).toBe(once);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// replaceHardcodedColors — design tokens must not be classified as hardcoded
// ─────────────────────────────────────────────────────────────────────────────

describe("design token safety", () => {
  const tokens = [
    "text-primary", "text-success", "text-destructive", "text-warning",
    "text-muted-foreground", "text-foreground",
    "bg-primary", "bg-success", "bg-destructive", "bg-warning", "bg-muted",
    "bg-background", "bg-card",
    "border-primary", "border-border", "border-destructive",
  ];

  it("no design token is classified as a bug condition", () => {
    for (const token of tokens) {
      expect(isBugCondition(token), `"${token}" incorrectly classified as bug condition`).toBe(false);
    }
  });

  it("replaceHardcodedColors returns design tokens unchanged", () => {
    for (const token of tokens) {
      expect(replaceHardcodedColors(token), `"${token}" was altered`).toBe(token);
    }
  });
});
