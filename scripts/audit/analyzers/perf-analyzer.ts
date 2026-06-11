/**
 * Performance Analyzer
 *
 * Static analysis of backend query patterns and frontend state management
 * for production load concerns.
 *
 * Backend checks (AST-based, scans `backend/src/**\/*.ts`):
 *  - `findMany()` without `take`/`skip`                    → `missing_pagination` (high)
 *  - Nested `include` > 2 levels deep                      → `n_plus_1`           (critical)
 *  - `@Query()` handlers without pagination params         → `missing_pagination` (medium)
 *  - Missing `@UseInterceptors(CacheInterceptor)` on
 *    read-heavy endpoints                                   → `no_cache`           (low)
 *
 * Frontend checks (scans `src/pages/**\/*.{ts,tsx}` and
 *                         `src/components/**\/*.{ts,tsx}`):
 *  - `useQuery` without `keepPreviousData` or pagination   → `missing_pagination` (medium)
 *  - Large list renders without virtualization
 *    (array.map in JSX without Virtuoso/react-window)      → `missing_pagination` (medium)
 *  - Missing `Suspense`/error boundary wrappers            → `no_error_boundary`  (high)
 *  - socket.io-client without reconnection config          → `socket_config`      (high)
 *
 * Results are written to `audit-results/static/perf-issues.json`.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as ts from 'typescript';

import { type PerfIssue } from '../types/audit-types.js';
import { parseSourceFile, visitNodes, getLineNumber } from '../utils/ast-parser.js';
import { walkFiles } from '../utils/file-walker.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Glob patterns for backend TypeScript source files. */
const BACKEND_PATTERNS = ['backend/src/**/*.ts'];

/** Glob patterns for frontend source files to scan. */
const FRONTEND_PATTERNS = [
  'src/pages/**/*.{ts,tsx}',
  'src/components/**/*.{ts,tsx}',
];

/**
 * Names of virtualization libraries that indicate a list is virtualized.
 * If any of these appear as JSX tags or imports, we consider the list safe.
 */
const VIRTUALIZATION_TAGS = new Set([
  'Virtuoso',
  'VirtuosoGrid',
  'TableVirtuoso',
  'GroupedVirtuoso',
  'FixedSizeList',
  'VariableSizeList',
  'FixedSizeGrid',
  'VariableSizeGrid',
  'AutoSizer',
  'InfiniteLoader',
  'WindowScroller',
  'List',           // react-window
]);

/**
 * NestJS decorator names that indicate a read-heavy (GET) endpoint method.
 */
const READ_DECORATORS = new Set(['Get', 'Head']);

/**
 * NestJS decorator names for all HTTP method types — used to detect controller
 * methods at all.
 */
const HTTP_DECORATORS = new Set([
  'Get', 'Post', 'Put', 'Patch', 'Delete', 'Head', 'Options', 'All',
]);

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/**
 * Return the depth of a Prisma `include` object literal by recursively
 * counting nested `include` properties.
 *
 * Example:
 * ```
 * include: {            // depth 1
 *   orders: {
 *     include: {        // depth 2
 *       items: {
 *         include: {    // depth 3  ← flagged
 *           product: true
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 */
function measureIncludeDepth(node: ts.Node, currentDepth = 0): number {
  if (!ts.isObjectLiteralExpression(node)) {
    return currentDepth;
  }

  let maxDepth = currentDepth;

  for (const prop of (node as ts.ObjectLiteralExpression).properties) {
    if (!ts.isPropertyAssignment(prop)) continue;

    const keyName = ts.isIdentifier(prop.name) ? prop.name.text : '';
    if (keyName === 'include') {
      const nested = measureIncludeDepth(prop.initializer, currentDepth + 1);
      if (nested > maxDepth) maxDepth = nested;
    } else {
      // Recurse into all other values in case there is an embedded include
      const nested = measureIncludeDepth(prop.initializer, currentDepth);
      if (nested > maxDepth) maxDepth = nested;
    }
  }

  return maxDepth;
}

/**
 * Determine whether a `findMany()` call's argument object contains at least
 * one of the pagination keys: `take`, `skip`, `cursor`, `first`, `last`.
 */
function hasPaginationKeys(argNode: ts.Node | undefined): boolean {
  if (!argNode || !ts.isObjectLiteralExpression(argNode)) return false;

  const paginationKeys = new Set(['take', 'skip', 'cursor', 'first', 'last']);

  for (const prop of (argNode as ts.ObjectLiteralExpression).properties) {
    if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) {
      continue;
    }
    const key = ts.isIdentifier(prop.name) ? prop.name.text : '';
    if (paginationKeys.has(key)) return true;
  }

  return false;
}

/**
 * Check whether an object literal contains an `include` property and return
 * the `include` value node (or `undefined` if absent).
 */
function getIncludeNode(
  argNode: ts.Node | undefined
): ts.ObjectLiteralExpression | undefined {
  if (!argNode || !ts.isObjectLiteralExpression(argNode)) return undefined;

  for (const prop of (argNode as ts.ObjectLiteralExpression).properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (ts.isIdentifier(prop.name) && prop.name.text === 'include') {
      if (ts.isObjectLiteralExpression(prop.initializer)) {
        return prop.initializer as ts.ObjectLiteralExpression;
      }
    }
  }
  return undefined;
}

/**
 * Return the argument names of a function / method declaration or arrow
 * function. Used to inspect whether pagination params are present.
 */
function getParamNames(node: ts.Node): string[] {
  let params: ts.NodeArray<ts.ParameterDeclaration> | undefined;

  if (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node)
  ) {
    params = node.parameters;
  }

  if (!params) return [];

  const names: string[] = [];
  for (const p of params) {
    if (ts.isIdentifier(p.name)) {
      names.push(p.name.text);
    } else if (ts.isObjectBindingPattern(p.name)) {
      // Destructured params: { page, limit, ...rest }
      for (const el of (p.name as ts.ObjectBindingPattern).elements) {
        if (ts.isIdentifier(el.name)) {
          names.push(el.name.text);
        }
      }
    }
  }
  return names;
}

/**
 * Return true when the param list contains recognisable pagination-style names.
 */
function paramListHasPagination(paramNames: string[]): boolean {
  const paginationParams = new Set([
    'page', 'limit', 'offset', 'skip', 'take', 'cursor',
    'pageSize', 'perPage', 'pageIndex', 'first', 'last', 'size',
  ]);
  return paramNames.some((n) => paginationParams.has(n.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Backend analysis
// ---------------------------------------------------------------------------

/**
 * Scan a single backend TypeScript file for performance issues.
 */
function analyzeBackendFile(
  absolutePath: string,
  projectRoot: string
): PerfIssue[] {
  let sourceFile: ts.SourceFile;
  try {
    sourceFile = parseSourceFile(absolutePath);
  } catch {
    return [];
  }

  const relPath = path.relative(projectRoot, absolutePath).replace(/\\/g, '/');
  const fullText = sourceFile.getFullText();
  const issues: PerfIssue[] = [];

  // Quick short-circuit: skip files with no Prisma / NestJS content
  const hasBackendContent =
    fullText.includes('findMany') ||
    fullText.includes('@Query') ||
    fullText.includes('@Get') ||
    fullText.includes('CacheInterceptor') ||
    fullText.includes('@UseInterceptors');

  if (!hasBackendContent) return [];

  // ── Collect controller-method metadata for cache checks ──────────────────
  // We track: which methods have @Get (read-heavy) and whether they have
  // @UseInterceptors(CacheInterceptor).

  interface MethodInfo {
    node: ts.MethodDeclaration;
    hasReadDecorator: boolean;
    hasCacheInterceptor: boolean;
    lineNumber: number;
  }

  const methodInfos: MethodInfo[] = [];

  visitNodes(sourceFile, (node) => {
    // ── 1. findMany() without take/skip ──────────────────────────────────────
    if (ts.isCallExpression(node)) {
      const callExpr = node as ts.CallExpression;
      const callee = callExpr.expression;

      // Match `<anything>.findMany(…)`
      if (
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.name) &&
        callee.name.text === 'findMany'
      ) {
        const arg = callExpr.arguments[0];
        if (!hasPaginationKeys(arg)) {
          issues.push({
            type: 'missing_pagination',
            filePath: relPath,
            lineNumber: getLineNumber(sourceFile, node),
            severity: 'high',
            description:
              'Prisma `findMany()` called without `take`/`skip` pagination. ' +
              'Under load this will return the entire table.',
            recommendation:
              'Add `take` and `skip` (or `cursor`) arguments to paginate results. ' +
              'Consider a default page size of 20–50 records.',
          });
        }
      }

      // ── 2. Nested include > 2 levels ──────────────────────────────────────
      if (
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.name) &&
        (callee.name.text === 'findMany' ||
          callee.name.text === 'findFirst' ||
          callee.name.text === 'findUnique' ||
          callee.name.text === 'findFirstOrThrow' ||
          callee.name.text === 'findUniqueOrThrow')
      ) {
        const arg = callExpr.arguments[0];
        const includeNode = getIncludeNode(arg);
        if (includeNode) {
          // Count depth starting from 1 (the top-level include)
          const depth = measureIncludeDepth(includeNode, 1);
          if (depth > 2) {
            issues.push({
              type: 'n_plus_1',
              filePath: relPath,
              lineNumber: getLineNumber(sourceFile, node),
              severity: 'critical',
              description:
                `Prisma query has nested \`include\` depth of ${depth} (> 2 levels). ` +
                'This can cause N+1 query problems and significant database load.',
              recommendation:
                'Flatten the query using explicit joins or separate queries, or use ' +
                'Prisma\'s `select` with only required fields. Consider splitting into ' +
                'multiple targeted queries instead of deep eager loading.',
            });
          }
        }
      }
    }

    // ── 3. @Query() handlers without pagination params ───────────────────────
    // We look for method declarations decorated with @Query() that lack
    // pagination parameter names.
    if (ts.isMethodDeclaration(node)) {
      const method = node as ts.MethodDeclaration;
      const decorators = ts.getDecorators?.(method) ?? [];

      const hasQueryDecorator = decorators.some((d) => {
        if (!ts.isDecorator(d)) return false;
        const expr = d.expression;
        if (ts.isIdentifier(expr) && expr.text === 'Query') return true;
        if (
          ts.isCallExpression(expr) &&
          ts.isIdentifier(expr.expression) &&
          (expr.expression as ts.Identifier).text === 'Query'
        )
          return true;
        return false;
      });

      if (hasQueryDecorator) {
        const paramNames = getParamNames(method);
        if (!paramListHasPagination(paramNames)) {
          issues.push({
            type: 'missing_pagination',
            filePath: relPath,
            lineNumber: getLineNumber(sourceFile, node),
            severity: 'medium',
            description:
              'A `@Query()` handler does not accept pagination parameters ' +
              '(`page`, `limit`, `offset`, `skip`, `take`, etc.). ' +
              'This endpoint will return unbounded result sets.',
            recommendation:
              'Add `@Query(\'page\') page: number` and `@Query(\'limit\') limit: number` ' +
              'parameters (with sensible defaults via `ParseIntPipe`) so callers can ' +
              'paginate results.',
          });
        }
      }

      // ── 4. Collect method info for cache check ──────────────────────────
      const hasReadDecorator = decorators.some((d) => {
        if (!ts.isDecorator(d)) return false;
        const expr = d.expression;
        const name = ts.isIdentifier(expr)
          ? expr.text
          : ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)
          ? (expr.expression as ts.Identifier).text
          : '';
        return READ_DECORATORS.has(name);
      });

      const hasCacheInterceptor = decorators.some((d) => {
        if (!ts.isDecorator(d)) return false;
        const expr = d.expression;
        if (!ts.isCallExpression(expr)) return false;
        // @UseInterceptors(CacheInterceptor)
        if (
          ts.isIdentifier(expr.expression) &&
          (expr.expression as ts.Identifier).text === 'UseInterceptors'
        ) {
          return expr.arguments.some(
            (arg) =>
              (ts.isIdentifier(arg) &&
                (arg as ts.Identifier).text === 'CacheInterceptor') ||
              (ts.isPropertyAccessExpression(arg) &&
                (arg as ts.PropertyAccessExpression).name.text ===
                  'CacheInterceptor')
          );
        }
        return false;
      });

      methodInfos.push({
        node: method,
        hasReadDecorator,
        hasCacheInterceptor,
        lineNumber: getLineNumber(sourceFile, node),
      });
    }
  });

  // ── 4. Missing @UseInterceptors(CacheInterceptor) on read-heavy endpoints ──
  // Only flag methods that have a @Get decorator but no cache interceptor.
  // Suppress if the file-level class already applies it (check parent class
  // decorators is complex; we keep the check method-level for simplicity).
  for (const info of methodInfos) {
    if (info.hasReadDecorator && !info.hasCacheInterceptor) {
      const methodName = ts.isIdentifier(info.node.name)
        ? info.node.name.text
        : '(anonymous)';
      issues.push({
        type: 'no_cache',
        filePath: relPath,
        lineNumber: info.lineNumber,
        severity: 'low',
        description:
          `GET endpoint \`${methodName}\` is missing \`@UseInterceptors(CacheInterceptor)\`. ` +
          'Repeated identical requests will hit the database every time.',
        recommendation:
          'Add `@UseInterceptors(CacheInterceptor)` and `@CacheTTL(30)` to the method, ' +
          'or apply `CacheInterceptor` at the controller class level for blanket caching. ' +
          'Import from `@nestjs/cache-manager`.',
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Frontend analysis
// ---------------------------------------------------------------------------

/**
 * Return true when `node` is a JSX element or self-closing element whose tag
 * name is one of the known virtualization library tags.
 */
function isVirtualizationTag(node: ts.Node): boolean {
  if (
    node.kind !== ts.SyntaxKind.JsxOpeningElement &&
    node.kind !== ts.SyntaxKind.JsxSelfClosingElement
  ) {
    return false;
  }

  const element = node as ts.JsxOpeningElement | ts.JsxSelfClosingElement;
  const tagName = ts.isIdentifier(element.tagName)
    ? element.tagName.text
    : '';

  return VIRTUALIZATION_TAGS.has(tagName);
}

/**
 * Check whether a `useQuery` call expression has `keepPreviousData` or any
 * recognisable pagination key in its options object.
 */
function useQueryHasPaginationOrKeepPreviousData(
  callExpr: ts.CallExpression
): boolean {
  // useQuery(queryKey, queryFn, options) — options is 3rd arg
  // useQuery({ queryKey, queryFn, keepPreviousData, ... }) — options is 1st arg
  const paginationOptionKeys = new Set([
    'keepPreviousData',
    'placeholderData',  // TanStack Query v5 equivalent
    'page',
    'pageIndex',
    'pageSize',
    'limit',
    'offset',
    'cursor',
  ]);

  for (const arg of callExpr.arguments) {
    if (!ts.isObjectLiteralExpression(arg)) continue;
    for (const prop of (arg as ts.ObjectLiteralExpression).properties) {
      if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) {
        continue;
      }
      const key = ts.isIdentifier(prop.name) ? prop.name.text : '';
      if (paginationOptionKeys.has(key)) return true;
    }
  }

  // Also check if pagination variables appear in any query key array
  for (const arg of callExpr.arguments) {
    if (!ts.isArrayLiteralExpression(arg)) continue;
    for (const el of (arg as ts.ArrayLiteralExpression).elements) {
      if (ts.isIdentifier(el)) {
        const name = (el as ts.Identifier).text.toLowerCase();
        if (
          name.includes('page') ||
          name.includes('limit') ||
          name.includes('offset') ||
          name.includes('cursor') ||
          name.includes('skip') ||
          name.includes('take')
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Scan a single frontend file for performance issues.
 */
function analyzeFrontendFile(
  absolutePath: string,
  projectRoot: string
): PerfIssue[] {
  let sourceFile: ts.SourceFile;
  try {
    sourceFile = parseSourceFile(absolutePath);
  } catch {
    return [];
  }

  const relPath = path.relative(projectRoot, absolutePath).replace(/\\/g, '/');
  const fullText = sourceFile.getFullText();
  const issues: PerfIssue[] = [];

  // Quick short-circuit: skip files with no relevant content
  const hasFrontendContent =
    fullText.includes('useQuery') ||
    fullText.includes('.map(') ||
    fullText.includes('Suspense') ||
    fullText.includes('socket') ||
    fullText.includes('ErrorBoundary') ||
    fullText.includes('io(') ||
    fullText.includes('io.connect');

  if (!hasFrontendContent) return [];

  // Track whether this file contains any virtualization tags (for list check)
  let hasVirtualizationInFile = false;
  // Track array.map() in JSX positions
  const arrayMapJsxLines: number[] = [];
  // Track Suspense / ErrorBoundary presence
  let hasSuspense = false;
  let hasErrorBoundary = false;
  // Track socket.io usage
  const socketCallLines: number[] = [];
  let hasReconnectionConfig = false;

  visitNodes(sourceFile, (node) => {
    // ── 1. useQuery without keepPreviousData or pagination ──────────────────
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier((node as ts.CallExpression).expression) &&
      ((node as ts.CallExpression).expression as ts.Identifier).text === 'useQuery'
    ) {
      const callExpr = node as ts.CallExpression;
      if (!useQueryHasPaginationOrKeepPreviousData(callExpr)) {
        issues.push({
          type: 'missing_pagination',
          filePath: relPath,
          lineNumber: getLineNumber(sourceFile, node),
          severity: 'medium',
          description:
            '`useQuery` is used without `keepPreviousData` (or `placeholderData` in v5) ' +
            'or pagination parameters. This causes flash-of-empty-content on page changes ' +
            'and unbounded data fetches.',
          recommendation:
            'Pass `keepPreviousData: true` to `useQuery` options, or add `page`/`limit` ' +
            'query key elements and pass them to the API call so only one page is loaded ' +
            'at a time.',
        });
      }
    }

    // ── 2. Virtualization tag detection (for list check below) ──────────────
    if (isVirtualizationTag(node)) {
      hasVirtualizationInFile = true;
    }

    // ── 3. Array.map() inside JSX — potential large unvirtualized list ───────
    // Detect: `{someArray.map(…)}` where the parent is a JSX expression container.
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression((node as ts.CallExpression).expression)
    ) {
      const callExpr = node as ts.CallExpression;
      const propAccess = callExpr.expression as ts.PropertyAccessExpression;

      if (
        ts.isIdentifier(propAccess.name) &&
        propAccess.name.text === 'map'
      ) {
        // Check whether this call is inside a JsxExpression (JSX slot)
        let parent: ts.Node | undefined = node.parent;
        while (parent && parent.kind !== ts.SyntaxKind.SourceFile) {
          if (parent.kind === ts.SyntaxKind.JsxExpression) {
            arrayMapJsxLines.push(getLineNumber(sourceFile, node));
            break;
          }
          parent = parent.parent;
        }
      }
    }

    // ── 4a. Suspense presence ────────────────────────────────────────────────
    if (
      (node.kind === ts.SyntaxKind.JsxOpeningElement ||
        node.kind === ts.SyntaxKind.JsxSelfClosingElement) &&
      ts.isIdentifier(
        (node as ts.JsxOpeningElement | ts.JsxSelfClosingElement).tagName
      ) &&
      ((node as ts.JsxOpeningElement | ts.JsxSelfClosingElement)
        .tagName as ts.Identifier).text === 'Suspense'
    ) {
      hasSuspense = true;
    }

    // ── 4b. ErrorBoundary presence ───────────────────────────────────────────
    if (
      node.kind === ts.SyntaxKind.JsxOpeningElement ||
      node.kind === ts.SyntaxKind.JsxSelfClosingElement
    ) {
      const el = node as ts.JsxOpeningElement | ts.JsxSelfClosingElement;
      const tagName = ts.isIdentifier(el.tagName) ? el.tagName.text : '';
      if (
        tagName === 'ErrorBoundary' ||
        tagName.endsWith('ErrorBoundary') ||
        tagName === 'Sentry.ErrorBoundary' ||
        tagName === 'ReactQueryErrorResetBoundary'
      ) {
        hasErrorBoundary = true;
      }
    }

    // ── 5. socket.io-client usage ─────────────────────────────────────────────
    if (ts.isCallExpression(node)) {
      const callExpr = node as ts.CallExpression;
      const callee = callExpr.expression;
      const calleeText =
        ts.isIdentifier(callee)
          ? callee.text
          : ts.isPropertyAccessExpression(callee)
          ? `${callee.expression.getText(sourceFile)}.${callee.name.text}`
          : '';

      // Detect: `io('url', options)` or `io.connect(...)` or `socketIo(...)`
      if (
        calleeText === 'io' ||
        calleeText === 'io.connect' ||
        calleeText === 'socketIo' ||
        calleeText === 'socket.io-client' ||
        calleeText.startsWith('io.')
      ) {
        const lineNo = getLineNumber(sourceFile, node);
        socketCallLines.push(lineNo);

        // Check whether the options object includes reconnection config
        for (const arg of callExpr.arguments) {
          if (!ts.isObjectLiteralExpression(arg)) continue;
          for (const prop of (arg as ts.ObjectLiteralExpression).properties) {
            if (
              !ts.isPropertyAssignment(prop) &&
              !ts.isShorthandPropertyAssignment(prop)
            )
              continue;
            const key = ts.isIdentifier(prop.name) ? prop.name.text : '';
            if (
              key === 'reconnection' ||
              key === 'reconnectionAttempts' ||
              key === 'reconnectionDelay' ||
              key === 'reconnectionDelayMax'
            ) {
              hasReconnectionConfig = true;
            }
          }
        }
      }
    }
  });

  // ── 2+3. Large list render without virtualization ─────────────────────────
  if (arrayMapJsxLines.length > 0 && !hasVirtualizationInFile) {
    // Report the first occurrence to avoid flooding the report
    issues.push({
      type: 'missing_pagination',
      filePath: relPath,
      lineNumber: arrayMapJsxLines[0],
      severity: 'medium',
      description:
        `Found ${arrayMapJsxLines.length} array \`.map()\` render(s) in JSX without ` +
        'a virtualization library (Virtuoso, react-window, etc.). ' +
        'Rendering large lists without virtualization causes DOM bloat and jank.',
      recommendation:
        'Wrap large lists with `<Virtuoso>` (from `react-virtuoso`) or `FixedSizeList` ' +
        '(from `react-window`). Alternatively, implement server-side pagination so the ' +
        'dataset never grows large enough to require virtualization.',
    });
  }

  // ── 4. Missing Suspense/ErrorBoundary ─────────────────────────────────────
  // Only flag component files that do async work (use useQuery) but don't wrap
  // with Suspense or an ErrorBoundary. We check via full-text heuristic.
  const isComponentFile =
    absolutePath.endsWith('.tsx') ||
    (absolutePath.endsWith('.ts') && fullText.includes('JSX'));
  const hasAsyncFetch =
    fullText.includes('useQuery') ||
    fullText.includes('useSuspenseQuery') ||
    fullText.includes('Suspense');

  if (isComponentFile && hasAsyncFetch && !hasSuspense && !hasErrorBoundary) {
    issues.push({
      type: 'no_error_boundary',
      filePath: relPath,
      lineNumber: 1,
      severity: 'high',
      description:
        'Component performs async data fetching but has no `<Suspense>` fallback or ' +
        '`<ErrorBoundary>` wrapper. An uncaught error or unresolved promise will crash ' +
        'the entire component subtree.',
      recommendation:
        'Wrap async components with `<Suspense fallback={<Spinner />}>` and an ' +
        '`<ErrorBoundary>` (e.g., `react-error-boundary`). Place boundaries at route ' +
        'level to contain failures to a single page.',
    });
  }

  // ── 5. socket.io-client without reconnection config ──────────────────────
  if (socketCallLines.length > 0 && !hasReconnectionConfig) {
    issues.push({
      type: 'socket_config',
      filePath: relPath,
      lineNumber: socketCallLines[0],
      severity: 'high',
      description:
        'socket.io-client is used without explicit reconnection configuration ' +
        '(`reconnection`, `reconnectionAttempts`, `reconnectionDelay`). ' +
        'Without this, dropped connections may not recover in production.',
      recommendation:
        'Pass reconnection options when creating the socket: ' +
        '`io(url, { reconnection: true, reconnectionAttempts: 10, ' +
        'reconnectionDelay: 1000, reconnectionDelayMax: 5000 })`. ' +
        'Also ensure auth tokens are re-attached on the `reconnect` event.',
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run all backend and frontend performance checks against the project source
 * files and write the findings to `audit-results/static/perf-issues.json`.
 *
 * @param projectRoot - Absolute path to the project root (parent of `src/`
 *                      and `backend/`).
 * @returns           - Array of `PerfIssue` objects covering all detected
 *                      performance concerns.
 */
export async function analyzePerformance(
  projectRoot: string
): Promise<PerfIssue[]> {
  process.stderr.write('[perf-analyzer] Starting performance analysis…\n');

  // ── 1. Collect backend files ────────────────────────────────────────────
  const backendFiles = await walkFiles(projectRoot, BACKEND_PATTERNS);
  process.stderr.write(
    `[perf-analyzer] Scanning ${backendFiles.length} backend files…\n`
  );

  // ── 2. Collect frontend files ───────────────────────────────────────────
  const frontendFiles = await walkFiles(projectRoot, FRONTEND_PATTERNS);
  process.stderr.write(
    `[perf-analyzer] Scanning ${frontendFiles.length} frontend files…\n`
  );

  // ── 3. Analyze backend files ────────────────────────────────────────────
  const backendIssues: PerfIssue[] = [];
  for (const filePath of backendFiles) {
    const fileIssues = analyzeBackendFile(filePath, projectRoot);
    backendIssues.push(...fileIssues);
  }

  // ── 4. Analyze frontend files ───────────────────────────────────────────
  const frontendIssues: PerfIssue[] = [];
  for (const filePath of frontendFiles) {
    const fileIssues = analyzeFrontendFile(filePath, projectRoot);
    frontendIssues.push(...fileIssues);
  }

  const allIssues = [...backendIssues, ...frontendIssues];

  // ── 5. Write results ────────────────────────────────────────────────────
  const outputDir = path.join(projectRoot, 'audit-results', 'static');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'perf-issues.json');
  await fs.writeFile(outputPath, JSON.stringify(allIssues, null, 2), 'utf-8');

  // Summary logging
  const counts = {
    n_plus_1: allIssues.filter((i) => i.type === 'n_plus_1').length,
    missing_pagination: allIssues.filter((i) => i.type === 'missing_pagination').length,
    no_error_boundary: allIssues.filter((i) => i.type === 'no_error_boundary').length,
    no_cache: allIssues.filter((i) => i.type === 'no_cache').length,
    socket_config: allIssues.filter((i) => i.type === 'socket_config').length,
  };

  process.stderr.write(
    `[perf-analyzer] Found ${allIssues.length} issue(s): ` +
      `${counts.n_plus_1} n_plus_1, ` +
      `${counts.missing_pagination} missing_pagination, ` +
      `${counts.no_error_boundary} no_error_boundary, ` +
      `${counts.no_cache} no_cache, ` +
      `${counts.socket_config} socket_config → ${outputPath}\n`
  );

  return allIssues;
}
