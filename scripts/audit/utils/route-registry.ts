/**
 * Route Registry
 *
 * Scans NestJS controller files via AST and builds a registry of all
 * backend routes by combining controller-level `@Controller('prefix')`
 * decorators with method-level HTTP verb decorators.
 *
 * Requirements: 4.1, 4.2
 */

import * as ts from 'typescript';
import * as path from 'node:path';
import { walkFiles } from './file-walker.js';
import { parseSourceFile, visitNodes } from './ast-parser.js';
import type { BackendRoute } from '../types/audit-types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** HTTP method decorator names supported by NestJS. */
const HTTP_METHOD_DECORATORS = new Set(['Get', 'Post', 'Put', 'Patch', 'Delete']);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to extract the first string-literal argument from a decorator call
 * expression such as `@Controller('api/v1/users')` or `@Get(':id')`.
 *
 * Returns `''` when the decorator has no arguments or the first argument is
 * not a string literal (e.g. a bare `@Get()` call means "root of controller").
 */
function extractDecoratorPath(
  decorator: ts.Decorator,
  sourceFile: ts.SourceFile,
): string | null {
  const expr = decorator.expression;

  // `@Get()` — CallExpression with no args → path is ''
  if (ts.isCallExpression(expr)) {
    const args = expr.arguments;
    if (args.length === 0) {
      return '';
    }
    const firstArg = args[0];
    if (ts.isStringLiteral(firstArg)) {
      return firstArg.text;
    }
    // Template literals or expressions → can't statically determine; skip
    return null;
  }

  // `@Get` without parentheses (unusual but valid in some NestJS versions)
  // Treat as empty path
  if (ts.isIdentifier(expr)) {
    return '';
  }

  return null;
}

/**
 * Return the plain identifier name of a decorator, e.g. `"Get"` for `@Get()`,
 * `"Controller"` for `@Controller('foo')`.
 */
function getDecoratorName(decorator: ts.Decorator): string | null {
  const expr = decorator.expression;

  if (ts.isIdentifier(expr)) {
    return expr.text;
  }

  if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
    return expr.expression.text;
  }

  // Could be a property access like `@nestjs/common.Get()` — not common in
  // real NestJS code, but handle gracefully
  if (ts.isCallExpression(expr) && ts.isPropertyAccessExpression(expr.expression)) {
    return expr.expression.name.text;
  }

  return null;
}

/**
 * Normalize two path segments into a single forward-slash path.
 *
 * Rules:
 * - Strip leading/trailing whitespace from each segment.
 * - Ensure exactly one `/` separator between prefix and sub-path.
 * - Preserve leading `/` if the full path starts with one (NestJS ignores it,
 *   but we keep it for easy cross-referencing with frontend calls).
 * - Collapse multiple consecutive `/` into one.
 */
function joinPaths(prefix: string, subPath: string): string {
  const a = prefix.trim().replace(/\/+$/, '');
  const b = subPath.trim().replace(/^\/+/, '');

  if (!a && !b) return '/';
  if (!a) return `/${b}`;
  if (!b) return `/${a}`;
  return `/${a}/${b}`;
}

// ---------------------------------------------------------------------------
// Core parsing function
// ---------------------------------------------------------------------------

/**
 * Parse a single controller file and return all routes it declares.
 */
function parseControllerRoutes(filePath: string): BackendRoute[] {
  let sourceFile: ts.SourceFile;
  try {
    sourceFile = parseSourceFile(filePath);
  } catch (err) {
    process.stderr.write(
      `[route-registry] WARNING: Failed to parse "${filePath}": ${(err as Error).message}\n`,
    );
    return [];
  }

  const routes: BackendRoute[] = [];

  visitNodes(sourceFile, (node) => {
    // We only care about class declarations (NestJS controllers are classes).
    if (!ts.isClassDeclaration(node)) {
      return;
    }

    // ── Extract controller prefix ────────────────────────────────────────────
    let controllerPrefix = '';

    const classDecorators = ts.getDecorators(node) ?? [];
    for (const decorator of classDecorators) {
      const name = getDecoratorName(decorator);
      if (name === 'Controller') {
        const extracted = extractDecoratorPath(decorator, sourceFile);
        if (extracted !== null) {
          controllerPrefix = extracted;
        }
        break;
      }
    }

    // If the class has no @Controller decorator it is not a controller — skip.
    const hasControllerDecorator = classDecorators.some(
      (d) => getDecoratorName(d) === 'Controller',
    );
    if (!hasControllerDecorator) {
      return;
    }

    // ── Walk class members for HTTP method decorators ────────────────────────
    for (const member of node.members) {
      if (!ts.isMethodDeclaration(member)) {
        continue;
      }

      const methodDecorators = ts.getDecorators(member) ?? [];
      for (const decorator of methodDecorators) {
        const decoratorName = getDecoratorName(decorator);
        if (!decoratorName || !HTTP_METHOD_DECORATORS.has(decoratorName)) {
          continue;
        }

        const subPath = extractDecoratorPath(decorator, sourceFile);
        if (subPath === null) {
          // Dynamic path — cannot determine statically; skip this route.
          continue;
        }

        const fullPath = joinPaths(controllerPrefix, subPath);

        routes.push({
          method: decoratorName.toUpperCase(),
          path: fullPath,
          controllerFile: filePath,
        });
      }
    }
  });

  return routes;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a registry of all backend routes by scanning every
 * `*.controller.ts` file under `backendDir/src/`.
 *
 * @param backendDir - Absolute (or relative) path to the NestJS backend root.
 *                     The scan searches under `<backendDir>/src/`.
 * @returns          - Flat array of `BackendRoute` objects, one per HTTP
 *                     method+path combination found across all controllers.
 */
export async function buildRouteRegistry(
  backendDir: string,
): Promise<BackendRoute[]> {
  const srcDir = path.join(backendDir, 'src');

  const controllerFiles = await walkFiles(srcDir, ['**/*.controller.ts']);

  if (controllerFiles.length === 0) {
    process.stderr.write(
      `[route-registry] WARNING: No controller files found under "${srcDir}".\n`,
    );
  }

  const allRoutes: BackendRoute[] = [];

  for (const filePath of controllerFiles) {
    const routes = parseControllerRoutes(filePath);
    allRoutes.push(...routes);
  }

  return allRoutes;
}
