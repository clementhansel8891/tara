/**
 * Stub Detector
 *
 * Classifies each `InteractiveElement` found by the element scanner using
 * eight ordered rules applied against the element's `handlerBody` string.
 *
 * Classification rules (in priority order):
 *   1. Empty body `() => {}` → stub
 *   2. Only `toast()`, `console.log()`, `alert()` calls → stub
 *   3. Only `// TODO` / `// FIXME` comments → stub
 *   4. Calls API but no `.then`, `onSuccess`, or state update → partially_working
 *   5. Opens modal whose submit is a stub → partially_working
 *   6. Calls API endpoint not in backend route registry → broken
 *   7. Calls working API AND updates UI state → fully_functional
 *   8. Cannot be determined statically → needs_dynamic_verification
 *
 * Results are written to `audit-results/static/stubs.json`.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type {
  BackendRoute,
  ClassifiedElement,
  Classification,
  InteractiveElement,
} from '../types/audit-types.js';

/**
 * All valid classification values.
 * Exported so that consumers (e.g. PBT tests) can assert completeness
 * without hard-coding the union literal list.
 */
export const VALID_CLASSIFICATIONS: Classification[] = [
  'fully_functional',
  'partially_working',
  'stub',
  'broken',
  'needs_dynamic_verification',
];

// ---------------------------------------------------------------------------
// Internal regex helpers
// ---------------------------------------------------------------------------

/**
 * Strip single-line comments, multi-line comments, and string literals from
 * a handler body so that subsequent pattern matching is applied only to
 * real code tokens (not comment text that might contain false positives).
 *
 * NOTE: This is a lightweight heuristic, not a full parser. It is sufficient
 * for the pattern-based classification rules used here.
 */
function stripCommentsAndStrings(body: string): string {
  // Remove multi-line comments /* … */
  let stripped = body.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // Remove single-line comments // …
  stripped = stripped.replace(/\/\/[^\n]*/g, ' ');
  // Remove template literals (backtick strings) – replace with empty string
  stripped = stripped.replace(/`[^`]*`/g, '""');
  // Remove double-quoted strings (simple – does not handle escapes perfectly)
  stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  // Remove single-quoted strings
  stripped = stripped.replace(/'(?:[^'\\]|\\.)*'/g, "''");
  return stripped;
}

/**
 * Remove outer wrapper (`() => { … }`, `async () => { … }`,
 * `(e) => { … }`, `function name() { … }`) and return only the inner body.
 * If no wrapper is detected the original string is returned unchanged.
 */
function extractInnerBody(body: string): string {
  const trimmed = body.trim();

  // Arrow function: `(params) => { body }` or `async (params) => { body }`
  const arrowMatch = trimmed.match(
    /^(?:async\s*)?\([^)]*\)\s*=>\s*\{([\s\S]*)\}\s*$/,
  );
  if (arrowMatch) return arrowMatch[1];

  // Arrow function with no braces: `() => expr`
  const arrowExprMatch = trimmed.match(
    /^(?:async\s*)?\([^)]*\)\s*=>\s*([\s\S]+)$/,
  );
  if (arrowExprMatch) return arrowExprMatch[1];

  // Function expression / declaration: `function name(params) { body }`
  const fnMatch = trimmed.match(
    /^(?:async\s+)?function\s*\w*\s*\([^)]*\)\s*\{([\s\S]*)\}\s*$/,
  );
  if (fnMatch) return fnMatch[1];

  return trimmed;
}

// ---------------------------------------------------------------------------
// Rule helpers
// ---------------------------------------------------------------------------

/** Rule 1 — Body is effectively empty. */
function isEmptyBody(body: string): boolean {
  const inner = extractInnerBody(body);
  // Strip whitespace, newlines, and semicolons; if nothing remains → empty
  return inner.replace(/[\s;]/g, '').length === 0;
}

/**
 * Rule 2 — Body contains *only* calls to notification/debug helpers
 * (`toast`, `console.log`, `alert`, `console.error`, `console.warn`,
 * `console.info`, `console.debug`).
 */
const STUB_CALL_PATTERN =
  /\b(?:toast|console\.(?:log|error|warn|info|debug|trace)|alert)\s*\(/;

/**
 * Returns true when every "meaningful" statement in the body is a
 * toast / console / alert call.
 */
function isOnlyNotificationCalls(body: string): boolean {
  const inner = extractInnerBody(body).trim();
  if (!inner) return false;

  // Strip comments/strings before analysis
  const code = stripCommentsAndStrings(inner).trim();
  if (!code) return false;

  // Must contain at least one of the stub calls
  if (!STUB_CALL_PATTERN.test(code)) return false;

  // Check there are no "real" expressions: remove all stub-call "statements"
  // A stub call statement is: `toast(...)`, `console.log(...)`, `alert(...)`
  // with optional `return` prefix and `;` suffix.
  const withoutStubCalls = code
    .replace(/(?:return\s+)?(?:toast|console\.(?:log|error|warn|info|debug|trace)|alert)\s*\([^)]*\)\s*;?/g, '')
    .trim();

  return withoutStubCalls.replace(/[\s;{}]/g, '').length === 0;
}

/**
 * Rule 3 — Body contains *only* TODO/FIXME comment lines.
 * We check the raw body (before stripping) for comment presence, then
 * verify that stripping those comments leaves no real code.
 */
function isOnlyTodoComments(body: string): boolean {
  const raw = body.trim();
  if (!raw) return false;

  // Must contain at least one TODO/FIXME comment
  if (!/\/\/\s*(?:TODO|FIXME)/i.test(raw)) return false;

  // After stripping all comments, there should be no meaningful code left
  const withoutComments = raw
    .replace(/\/\/[^\n]*/g, '') // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // multi-line comments
    .trim();

  return withoutComments.replace(/[\s;{}()=>]/g, '').length === 0;
}

/** Patterns that suggest a real API call is being made. */
const API_CALL_PATTERNS = [
  /\bfetch\s*\(/,
  /\baxios\s*\.\s*(?:get|post|put|patch|delete|request)\s*\(/,
  /\bapi\s*\.\s*\w+\s*\(/i,
  /\buseMutation\b/,
  /\bsupabase\s*\.\s*/,
  /\bmutate(?:Async)?\s*\(/,
  /\bclient\s*\.\s*(?:get|post|put|patch|delete)\s*\(/,
  /\brequest\s*\.\s*(?:get|post|put|patch|delete)\s*\(/,
];

function containsApiCall(code: string): boolean {
  return API_CALL_PATTERNS.some((p) => p.test(code));
}

/** Patterns that show the response is actually handled / UI is updated. */
const RESPONSE_HANDLING_PATTERNS = [
  /\.then\s*\(/,
  /\bawait\b/,
  /\bonSuccess\b/,
  /\bonError\b/,
  /\bsetState\b/,
  /\bset[A-Z][a-zA-Z]+\s*\(/,        // e.g. setData(), setLoading()
  /\buseState\b/,
  /\bdispatch\s*\(/,
  /\btoast\s*\(/,                     // toast as response feedback counts
  /\bnavigat(?:e|or)\s*[\.(]/,        // navigate() / router.push()
  /\brouter\s*\.\s*push\s*\(/,
  /refetch\s*\(/,
  /invalidateQueries\s*\(/,
  /\bcatch\s*\(/,
  /\bfinally\s*\(/,
];

function hasResponseHandling(code: string): boolean {
  return RESPONSE_HANDLING_PATTERNS.some((p) => p.test(code));
}

/** Patterns that open a modal / dialog / sheet / drawer. */
const MODAL_OPEN_PATTERNS = [
  /setOpen\s*\(\s*true\s*\)/,
  /setIsOpen\s*\(\s*true\s*\)/,
  /setShowModal\s*\(\s*true\s*\)/,
  /setShowDialog\s*\(\s*true\s*\)/,
  /openModal\s*\(/,
  /setModal[A-Z]\w*\s*\(\s*true\s*\)/,
  /\bopen\s*\(\s*\)/,
];

function opensModal(code: string): boolean {
  return MODAL_OPEN_PATTERNS.some((p) => p.test(code));
}

// ---------------------------------------------------------------------------
// URL extraction helpers (for rule 6)
// ---------------------------------------------------------------------------

/**
 * Extract all URL-like strings from a raw handler body.
 * Returns an array of path strings such as `/api/users`, `/users/:id`, etc.
 */
function extractApiEndpoints(body: string): string[] {
  const results: string[] = [];

  // Match string literals that look like API paths: start with / or contain /api/
  const stringLiteralPattern = /["'`](\/?(?:api\/|v\d+\/)[^"'`\s?#]+)["'`]/g;
  let m: RegExpExecArray | null;
  while ((m = stringLiteralPattern.exec(body)) !== null) {
    results.push(m[1]);
  }

  // Match template literal paths like `/api/${id}` → `/api/*`
  const templatePattern = /`([^`]*\/(?:api\/|v\d+\/)[^`]*)`/g;
  while ((m = templatePattern.exec(body)) !== null) {
    // Normalise template expressions to wildcards
    results.push(m[1].replace(/\$\{[^}]+\}/g, '*'));
  }

  return results;
}

/**
 * Normalise a path for comparison:
 * - Convert `:param` segments to `*`
 * - Collapse multiple slashes
 * - Remove trailing slash
 * - Lowercase
 */
function normalisePath(p: string): string {
  return p
    .toLowerCase()
    .replace(/\/:[^/]+/g, '/*')      // :param → *
    .replace(/\/\*/g, '/*')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

/**
 * Check whether `endpoint` matches any route in the registry.
 * Supports exact match and wildcard (`*`) segment matching.
 */
function matchesRegistry(endpoint: string, routes: BackendRoute[]): boolean {
  const normalised = normalisePath(endpoint);

  return routes.some((route) => {
    const routeNorm = normalisePath(route.path);
    if (routeNorm === normalised) return true;

    // Wildcard matching: replace `*` segments in route with [^/]+ pattern.
    // We must escape regex special chars first (excluding `*` which we handle
    // separately) then replace the literal `*` with a segment wildcard.
    const routeRegex = new RegExp(
      '^' +
        routeNorm
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex special chars (not *)
          .replace(/\*/g, '[^/]+') +               // * → match one path segment
        '$',
    );
    return routeRegex.test(normalised);
  });
}

// ---------------------------------------------------------------------------
// Core classifier
// ---------------------------------------------------------------------------

/**
 * Classify a single element's handler body against the 8 rules.
 * Rules are applied in strict priority order; the first match wins.
 */
export function classifyOne(
  element: InteractiveElement,
  routes: BackendRoute[],
): Classification {
  const body = element.handlerBody ?? '';

  // ── Rule 1: Empty body ──────────────────────────────────────────────────
  if (isEmptyBody(body)) {
    return 'stub';
  }

  // ── Rule 2: Only notification/debug calls ──────────────────────────────
  if (isOnlyNotificationCalls(body)) {
    return 'stub';
  }

  // ── Rule 3: Only TODO/FIXME comments ───────────────────────────────────
  if (isOnlyTodoComments(body)) {
    return 'stub';
  }

  const codeWithoutComments = stripCommentsAndStrings(body);
  const hasApi = containsApiCall(codeWithoutComments);

  // ── Rule 4: Calls API but no response handling ──────────────────────────
  if (hasApi && !hasResponseHandling(codeWithoutComments)) {
    return 'partially_working';
  }

  // ── Rule 5: Opens modal (we treat this conservatively as partially_working
  //    because we cannot statically verify the modal's submit classification
  //    without scanning the modal target component at this point) ──────────
  if (opensModal(codeWithoutComments)) {
    return 'partially_working';
  }

  // ── Rule 6: Calls API endpoint not in backend route registry ───────────
  if (hasApi) {
    const endpoints = extractApiEndpoints(body);
    if (endpoints.length > 0) {
      const allUnregistered = endpoints.every(
        (ep) => !matchesRegistry(ep, routes),
      );
      if (allUnregistered) {
        return 'broken';
      }
    }
  }

  // ── Rule 7: Calls working API AND updates UI state ─────────────────────
  if (hasApi && hasResponseHandling(codeWithoutComments)) {
    const endpoints = extractApiEndpoints(body);
    const hasRegisteredEndpoint =
      endpoints.length === 0 || // no static URL found → assume connected
      endpoints.some((ep) => matchesRegistry(ep, routes));

    if (hasRegisteredEndpoint || routes.length === 0) {
      return 'fully_functional';
    }
  }

  // ── Rule 8: Cannot be determined statically ────────────────────────────
  return 'needs_dynamic_verification';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify all interactive elements and return an array of `ClassifiedElement`
 * objects. Also writes the results to `audit-results/static/stubs.json`
 * relative to `process.cwd()`.
 *
 * @param elements - Array of `InteractiveElement` objects (from ElementScanner).
 * @param routes   - Backend route registry (from RouteRegistry); used for rule 6.
 * @returns        - Array of `ClassifiedElement` objects (same length as input).
 */
export function classify(
  elements: InteractiveElement[],
  routes: BackendRoute[],
): ClassifiedElement[] {
  return elements.map((element) => ({
    ...element,
    classification: classifyOne(element, routes),
  }));
}

/**
 * Classify all interactive elements and persist results to
 * `audit-results/static/stubs.json` (relative to `projectRoot`).
 *
 * @param elements    - Elements from ElementScanner output.
 * @param routes      - Backend route registry.
 * @param projectRoot - Absolute path to the project root.
 * @returns           - Array of classified elements.
 */
export async function classifyAndWrite(
  elements: InteractiveElement[],
  routes: BackendRoute[],
  projectRoot: string,
): Promise<ClassifiedElement[]> {
  const classified = classify(elements, routes);

  const outputDir = path.join(projectRoot, 'audit-results', 'static');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'stubs.json');
  await fs.writeFile(outputPath, JSON.stringify(classified, null, 2), 'utf-8');

  process.stderr.write(
    `[stub-detector] Classified ${classified.length} elements → ${outputPath}\n`,
  );

  return classified;
}
