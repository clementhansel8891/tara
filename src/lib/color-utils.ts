/**
 * color-utils.ts — UI Color Consistency Fix
 * Spec: .kiro/specs/ui-color-consistency-fix
 *
 * Provides two public utilities:
 *
 *  isBugCondition(className)
 *    Returns `true` when the className string contains at least one hardcoded
 *    Tailwind color class (text-blue-*, bg-indigo-*, border-gray-*, etc.).
 *    Based on the formal isBugCondition specification in design.md.
 *
 *  replaceHardcodedColors(className, context?)
 *    Replaces every hardcoded Tailwind color token in the string with the
 *    corresponding design token, per the authoritative replacement mapping
 *    table from design.md.  Non-color utility classes are left untouched.
 *    The `context` parameter controls the ambiguous `*-orange-*` mapping:
 *      - "warning"     → bg-warning / text-warning   (default when omitted)
 *      - "destructive" → bg-destructive / text-destructive
 *
 * Invariants upheld by replaceHardcodedColors:
 *   • Non-color utilities survive verbatim (no over-replacement).
 *   • Already-correct design token classes are never touched (idempotent).
 *   • Empty strings and whitespace-only strings are returned unchanged.
 *   • f(f(x)) === f(x)  for all x  (idempotency).
 */

// ── Hardcoded color families (the bug condition set) ──────────────────────────

/**
 * Each entry is a Tailwind class prefix (without the trailing dash-and-shade).
 * A token matches when the full class string is `<prefix>-<number>` optionally
 * followed by an opacity modifier (e.g. `text-blue-600/50`).
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

/** Complete set of all hardcoded color family prefixes. */
export const ALL_HARDCODED = [
  ...HARDCODED_TEXT_FAMILIES,
  ...HARDCODED_BG_FAMILIES,
  ...HARDCODED_BORDER_FAMILIES,
] as const;

export type HardcodedFamily = (typeof ALL_HARDCODED)[number];

/** Replacement context for the ambiguous `*-orange-*` families. */
export type ColorContext = "warning" | "destructive";

// ── Regex helpers ─────────────────────────────────────────────────────────────

/**
 * Build a word-boundary regex that matches one hardcoded color token.
 * e.g. "text-blue" → /\btext-blue-\d+(?:\/\d+)?\b/
 *
 * The regex uses the "g" flag so it can be used with matchAll / replaceAll.
 * A fresh RegExp object is returned each time to avoid lastIndex issues.
 */
function buildFamilyRegex(family: string): RegExp {
  return new RegExp(`\\b${family}-\\d+(?:\\/\\d+)?\\b`, "g");
}

// Pre-built regex list for isBugCondition fast-path.
const ALL_HARDCODED_REGEXES: Array<{ family: HardcodedFamily; re: RegExp }> =
  ALL_HARDCODED.map((f) => ({ family: f, re: buildFamilyRegex(f) }));

// ── isBugCondition ────────────────────────────────────────────────────────────

/**
 * Returns `true` when `className` contains at least one hardcoded Tailwind
 * color token from the allHardcoded set.
 *
 * @example
 * isBugCondition("text-blue-600 p-4")  // → true
 * isBugCondition("text-primary p-4")   // → false
 * isBugCondition("")                   // → false
 */
export function isBugCondition(className: string): boolean {
  if (!className || !className.trim()) return false;
  return ALL_HARDCODED_REGEXES.some(({ re }) => {
    // Clone to reset lastIndex before each test.
    const cloned = new RegExp(re.source, re.flags);
    return cloned.test(className);
  });
}

// ── Replacement mapping ───────────────────────────────────────────────────────

/**
 * Authoritative replacement table from design.md.
 *
 * For `*-orange-*` the replacement depends on context:
 *   context = "warning"     → *-warning
 *   context = "destructive" → *-destructive
 *   context = undefined     → *-warning  (default — the most common semantic)
 *
 * The table is consulted in order; the FIRST matching entry wins.
 */
type MappingEntry = {
  /** Family prefix (without trailing hyphen). */
  family: HardcodedFamily;
  /** Design token class to substitute when the entry matches. */
  token: string;
  /** If defined, this entry applies ONLY for the given context. */
  context?: ColorContext;
};

const MAPPING_TABLE: MappingEntry[] = [
  // ── text-* ────────────────────────────────────────────────────────────────
  { family: "text-blue",    token: "text-primary" },
  { family: "text-indigo",  token: "text-primary" },
  { family: "text-violet",  token: "text-primary" },
  { family: "text-purple",  token: "text-primary" },

  { family: "text-emerald", token: "text-success" },
  { family: "text-green",   token: "text-success" },

  { family: "text-red",     token: "text-destructive" },
  { family: "text-rose",    token: "text-destructive" },

  { family: "text-amber",   token: "text-warning" },
  { family: "text-yellow",  token: "text-warning" },

  // orange is context-sensitive — destructive entry MUST come before warning
  // so that an explicit "destructive" context hits its entry first.
  { family: "text-orange", token: "text-destructive", context: "destructive" },
  { family: "text-orange", token: "text-warning",     context: "warning" },
  // Fallback when no context is supplied: warning is the most common semantic.
  { family: "text-orange", token: "text-warning" },

  { family: "text-gray",    token: "text-muted-foreground" },
  { family: "text-zinc",    token: "text-muted-foreground" },
  { family: "text-neutral", token: "text-muted-foreground" },
  { family: "text-slate",   token: "text-muted-foreground" },

  // ── bg-* ─────────────────────────────────────────────────────────────────
  { family: "bg-indigo",    token: "bg-primary" },
  { family: "bg-blue",      token: "bg-primary" },
  { family: "bg-violet",    token: "bg-primary" },
  { family: "bg-purple",    token: "bg-primary" },

  { family: "bg-emerald",   token: "bg-success" },
  { family: "bg-green",     token: "bg-success" },

  { family: "bg-red",       token: "bg-destructive" },
  { family: "bg-rose",      token: "bg-destructive" },

  { family: "bg-amber",     token: "bg-warning" },
  { family: "bg-yellow",    token: "bg-warning" },

  { family: "bg-orange",    token: "bg-destructive", context: "destructive" },
  { family: "bg-orange",    token: "bg-warning",     context: "warning" },
  { family: "bg-orange",    token: "bg-warning" },

  { family: "bg-gray",      token: "bg-muted" },
  { family: "bg-zinc",      token: "bg-muted" },
  { family: "bg-neutral",   token: "bg-muted" },
  { family: "bg-slate",     token: "bg-muted" },

  // ── border-* ─────────────────────────────────────────────────────────────
  { family: "border-blue",   token: "border-primary" },
  { family: "border-indigo", token: "border-primary" },

  { family: "border-gray",   token: "border-border" },
  { family: "border-zinc",   token: "border-border" },
];

// ── replaceHardcodedColors ────────────────────────────────────────────────────

/**
 * Replaces every hardcoded Tailwind color token in `className` with the
 * corresponding design token, as defined in the authoritative replacement
 * mapping from design.md.
 *
 * Non-color utility classes pass through unchanged.  The function is
 * idempotent: applying it twice yields the same result as applying it once.
 *
 * @param className - A Tailwind className string (space-separated tokens).
 * @param context   - Disambiguation for `*-orange-*` tokens.
 *                    "warning" → *-warning (default when omitted)
 *                    "destructive" → *-destructive
 *
 * @example
 * replaceHardcodedColors("text-blue-600 p-4")
 * // → "text-primary p-4"
 *
 * replaceHardcodedColors("text-orange-500 flex", "destructive")
 * // → "text-destructive flex"
 *
 * replaceHardcodedColors("text-primary bg-card")
 * // → "text-primary bg-card"   (unchanged — already token-only)
 *
 * replaceHardcodedColors("")
 * // → ""
 */
export function replaceHardcodedColors(
  className: string,
  context?: ColorContext,
): string {
  if (!className) return className;
  // Fast-path: whitespace-only — nothing to replace, return as-is.
  if (!className.trim()) return className;

  // Split into tokens, replace each, then rejoin.
  // Split on runs of whitespace, keeping track of leading/trailing spaces.
  const tokens = className.split(/\s+/);

  const replaced = tokens.map((token) => {
    if (!token) return token; // preserve empty strings from splitting leading/trailing whitespace
    return replaceToken(token, context);
  });

  return replaced.join(" ");
}

/**
 * Replace a single class token if it matches a hardcoded color family.
 * Returns the token unchanged if no mapping is found.
 */
function replaceToken(token: string, context?: ColorContext): string {
  // Quick-exit: if the token contains no digits after a dash, it cannot be
  // a hardcoded color token (e.g. "text-primary", "flex", "p-4").
  // This avoids running 34 regexes on most tokens.
  if (!/-\d/.test(token)) return token;

  for (const entry of MAPPING_TABLE) {
    // Context filter: skip entries that require a different context.
    if (entry.context !== undefined && entry.context !== context) continue;

    // Build a fresh regex to avoid lastIndex issues.
    const re = buildFamilyRegex(entry.family);
    if (re.test(token)) {
      // Replace the matched hardcoded token with the design token.
      // We replace the full token (it matched as a whole word).
      return entry.token;
    }
  }

  return token;
}
