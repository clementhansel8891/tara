/**
 * Element Scanner
 *
 * Recursively scans all `.tsx`/`.ts` files under `src/pages/` and
 * `src/components/` to find every interactive element that has an event
 * handler (`onClick`, `onSubmit`, `onPress`, `onChange`). Also picks up
 * `<Button>`, `<Link>`, and `<a>` elements, and components wrapped in
 * `forwardRef` that accept click handlers.
 *
 * For each element it extracts:
 *   id, filePath, lineNumber, elementType, handlerName, handlerBody,
 *   parentComponent, layer, pagePath
 *
 * Results are written to `audit-results/static/elements.json`.
 *
 * Requirements: 1.1
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as ts from 'typescript';

import { MODULE_REGISTRY, type InteractiveElement } from '../types/audit-types.js';
import { parseSourceFile, visitNodes, getLineNumber } from '../utils/ast-parser.js';
import { walkFiles } from '../utils/file-walker.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Event-handler prop names we consider "interactive". */
const INTERACTIVE_HANDLERS = new Set([
  'onClick',
  'onSubmit',
  'onPress',
  'onChange',
]);

/**
 * JSX element tag names that are always considered interactive,
 * even without an explicit handler prop.
 */
const ALWAYS_INTERACTIVE_TAGS = new Set(['Button', 'button', 'Link', 'a']);

/** Glob patterns for source files we want to scan. */
const SCAN_PATTERNS = [
  'src/pages/**/*.{ts,tsx}',
  'src/components/**/*.{ts,tsx}',
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a SHA-256 hash of `file:line:handler` truncated to 16 hex characters.
 * Serves as the stable `id` for an `InteractiveElement`.
 */
function buildId(filePath: string, lineNumber: number, handlerName: string): string {
  return crypto
    .createHash('sha256')
    .update(`${filePath}:${lineNumber}:${handlerName}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Determine the `elementType` for a given JSX tag name and the handler prop
 * that triggered its detection.
 */
function resolveElementType(
  tagName: string,
  handlerProp: string
): InteractiveElement['elementType'] {
  const lower = tagName.toLowerCase();
  if (lower === 'a' || tagName === 'Link') return 'link';
  if (lower === 'form' || handlerProp === 'onSubmit') return 'form-submit';
  if (lower === 'button' || tagName === 'Button') return 'button';
  return 'clickable';
}

/**
 * Walk up the AST from `node` to find the name of the enclosing React
 * component (function declaration, arrow function variable, or class).
 * Returns `'<unknown>'` if no enclosing component is found.
 */
function findParentComponent(node: ts.Node): string {
  let current: ts.Node | undefined = node.parent;

  while (current) {
    // Function declaration: `function MyComponent() {}`
    if (
      ts.isFunctionDeclaration(current) &&
      current.name
    ) {
      return current.name.text;
    }

    // Arrow function or regular function expression assigned to a variable:
    // `const MyComponent = () => …` / `const MyComponent = function() {}`
    // In the TS compiler API, the parent is a VariableDeclaration (not VariableDeclarator).
    if (
      (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) &&
      current.parent &&
      ts.isVariableDeclaration(current.parent) &&
      ts.isIdentifier((current.parent as ts.VariableDeclaration).name)
    ) {
      return ((current.parent as ts.VariableDeclaration).name as ts.Identifier).text;
    }

    // Class declaration: `class MyComponent extends React.Component {}`
    if (ts.isClassDeclaration(current) && current.name) {
      return current.name.text;
    }

    current = current.parent;
  }

  return '<unknown>';
}

/**
 * Determine the module layer and pagePath for a given file path.
 * Iterates `MODULE_REGISTRY` entries and returns the first match.
 */
function resolveModuleInfo(
  relFilePath: string
): { layer: string; pagePath: string } {
  // Normalise to forward slashes for consistent comparison
  const normalised = relFilePath.replace(/\\/g, '/');

  for (const [moduleName, config] of Object.entries(MODULE_REGISTRY)) {
    for (const pagePath of config.pagePaths) {
      // pagePath may be a directory prefix or a direct file path
      if (normalised.startsWith(pagePath) || normalised === pagePath) {
        return { layer: config.layer, pagePath: `/${moduleName}` };
      }
    }
  }

  // Fall back — use the first path segment under src/ as a hint
  const match = normalised.match(/^src\/(?:pages|components)\/([^/]+)/);
  return {
    layer: match ? match[1] : 'unknown',
    pagePath: match ? `/${match[1]}` : '/',
  };
}

/**
 * Extract a human-readable handler name from an expression text.
 * For simple identifiers (`handleDelete`) we return the text as-is.
 * For inline expressions we truncate to ~60 chars and add `…`.
 */
function extractHandlerName(expressionText: string): string {
  const trimmed = expressionText.trim();
  if (trimmed.length <= 64) return trimmed;
  return trimmed.slice(0, 61) + '…';
}

/**
 * Try to resolve the full body text of a handler.
 * If the expression is a simple identifier, we look for its declaration in
 * the current source file and return its initializer/body text.
 * Otherwise we return the expression itself.
 */
function resolveHandlerBody(
  expressionText: string,
  sourceFile: ts.SourceFile
): string {
  const trimmed = expressionText.trim();

  // If the handler is a simple identifier, try to find the local declaration
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)) {
    let body: string | null = null;

    visitNodes(sourceFile, (node) => {
      if (body !== null) return;

      // const handlerName = …
      if (
        ts.isVariableDeclarator(node) &&
        ts.isIdentifier((node as ts.VariableDeclarator).name) &&
        ((node as ts.VariableDeclarator).name as ts.Identifier).text === trimmed &&
        (node as ts.VariableDeclarator).initializer
      ) {
        body = (node as ts.VariableDeclarator).initializer!.getText(sourceFile);
      }

      // function handlerName() {}
      if (
        ts.isFunctionDeclaration(node) &&
        (node as ts.FunctionDeclaration).name?.text === trimmed
      ) {
        body = node.getText(sourceFile);
      }
    });

    if (body !== null) return body;
  }

  // Inline arrow or function expression — return as-is
  return trimmed;
}

// ---------------------------------------------------------------------------
// Per-file scanning
// ---------------------------------------------------------------------------

interface RawElement {
  filePath: string;
  lineNumber: number;
  tagName: string;
  handlerProp: string;
  expressionText: string;
  parentComponent: string;
}

/**
 * Scan a single source file and collect raw interactive element data.
 */
function scanFile(absolutePath: string, rootDir: string): RawElement[] {
  let sourceFile: ts.SourceFile;
  try {
    sourceFile = parseSourceFile(absolutePath);
  } catch {
    // Silently skip files that fail to parse (encoding issues, etc.)
    return [];
  }

  const relFilePath = path
    .relative(rootDir, absolutePath)
    .replace(/\\/g, '/');

  const results: RawElement[] = [];

  visitNodes(sourceFile, (node) => {
    // We care about JSX opening elements and self-closing elements
    if (
      node.kind !== ts.SyntaxKind.JsxOpeningElement &&
      node.kind !== ts.SyntaxKind.JsxSelfClosingElement
    ) {
      return;
    }

    const jsxNode = node as ts.JsxOpeningElement | ts.JsxSelfClosingElement;

    // Resolve tag name
    let tagName: string;
    try {
      tagName = jsxNode.tagName.getText(sourceFile);
    } catch {
      return;
    }

    const attributes = jsxNode.attributes.properties;

    // Check each attribute for an interactive handler
    for (const attr of attributes) {
      if (attr.kind !== ts.SyntaxKind.JsxAttribute) continue;

      const jsxAttr = attr as ts.JsxAttribute;
      const attrName = jsxAttr.name.getText(sourceFile);

      const isInteractiveHandler = INTERACTIVE_HANDLERS.has(attrName);
      const isAlwaysInteractiveTag = ALWAYS_INTERACTIVE_TAGS.has(tagName);

      if (!isInteractiveHandler && !isAlwaysInteractiveTag) continue;

      // For non-handler attributes on always-interactive tags, we still want
      // to capture the element — but we need *some* handler. If there's no
      // handler attribute at all on the element, skip.
      if (!isInteractiveHandler) continue;

      // Extract the expression from the handler attribute
      if (!jsxAttr.initializer) continue;

      let expressionText = '';
      if (jsxAttr.initializer.kind === ts.SyntaxKind.JsxExpression) {
        const jsxExpr = jsxAttr.initializer as ts.JsxExpression;
        if (jsxExpr.expression) {
          expressionText = jsxExpr.expression.getText(sourceFile);
        }
      } else {
        expressionText = jsxAttr.initializer.getText(sourceFile);
      }

      const lineNumber = getLineNumber(sourceFile, jsxNode);
      const parentComponent = findParentComponent(jsxNode);

      results.push({
        filePath: relFilePath,
        lineNumber,
        tagName,
        handlerProp: attrName,
        expressionText,
        parentComponent,
      });
    }

    // For always-interactive tags (<Button>, <Link>, <a>), also capture the
    // element even if no explicit handler was found (e.g., href-only <a>).
    // Only do this when no handler attribute was already captured above.
    if (ALWAYS_INTERACTIVE_TAGS.has(tagName)) {
      const hasHandler = attributes.some(
        (attr) =>
          attr.kind === ts.SyntaxKind.JsxAttribute &&
          INTERACTIVE_HANDLERS.has(
            (attr as ts.JsxAttribute).name.getText(sourceFile)
          )
      );

      if (!hasHandler) {
        // Look for href on <a>/<Link> or type="submit" on <button>
        for (const attr of attributes) {
          if (attr.kind !== ts.SyntaxKind.JsxAttribute) continue;
          const jsxAttr = attr as ts.JsxAttribute;
          const attrName = jsxAttr.name.getText(sourceFile);

          if (attrName === 'href' || attrName === 'to' || attrName === 'type') {
            const expressionText = jsxAttr.initializer
              ? jsxAttr.initializer.getText(sourceFile)
              : '';
            const lineNumber = getLineNumber(sourceFile, jsxNode);
            const parentComponent = findParentComponent(jsxNode);

            results.push({
              filePath: relFilePath,
              lineNumber,
              tagName,
              handlerProp: attrName,
              expressionText,
              parentComponent,
            });
            break;
          }
        }
      }
    }
  });

  // Also look for forwardRef patterns:
  // const MyBtn = forwardRef<..., ...>((props, ref) => <button onClick={props.onClick} …/>)
  // We scan for variable declarations whose initializer calls forwardRef and
  // whose callback body references a click-like prop.
  scanForwardRefHandlers(sourceFile, relFilePath, results);

  return results;
}

/**
 * Detect `forwardRef` components that accept click handlers through `props`.
 * Adds matching entries into the shared `results` array.
 */
function scanForwardRefHandlers(
  sourceFile: ts.SourceFile,
  relFilePath: string,
  results: RawElement[]
): void {
  visitNodes(sourceFile, (node) => {
    // We need a VariableDeclaration (the `const Foo = forwardRef(...)` part)
    // which lives inside a VariableStatement. We look for VariableDeclaration nodes.
    if (!ts.isVariableDeclaration(node)) return;

    const varDecl = node as ts.VariableDeclaration;
    if (!varDecl.initializer) return;

    // Match: forwardRef(…) call
    const init = varDecl.initializer;
    if (!ts.isCallExpression(init)) return;

    const callee = init.expression;
    const calleeName = ts.isIdentifier(callee)
      ? callee.text
      : ts.isPropertyAccessExpression(callee)
      ? callee.name.text
      : null;

    if (calleeName !== 'forwardRef') return;

    const componentName = ts.isIdentifier(varDecl.name)
      ? varDecl.name.text
      : '<forwardRef>';

    // Look for props.onClick / props.onSubmit etc. inside the forwardRef body
    visitNodes(init, (innerNode) => {
      if (!ts.isPropertyAccessExpression(innerNode)) return;

      const propAccess = innerNode as ts.PropertyAccessExpression;
      const propName = propAccess.name.text;

      if (!INTERACTIVE_HANDLERS.has(propName)) return;

      // Make sure the object is `props` (or any identifier, since it may be
      // destructured differently — we use a loose heuristic here)
      const objText = propAccess.expression.getText(sourceFile);
      if (!objText.includes('props') && !objText.includes('ref')) return;

      const lineNumber = getLineNumber(sourceFile, innerNode);

      // Avoid adding a duplicate if this node was already picked up by the
      // JSX attribute loop above
      const alreadyCaptured = results.some(
        (r) => r.filePath === relFilePath && r.lineNumber === lineNumber
      );
      if (alreadyCaptured) return;

      results.push({
        filePath: relFilePath,
        lineNumber,
        tagName: componentName,
        handlerProp: propName,
        expressionText: propAccess.getText(sourceFile),
        parentComponent: componentName,
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scan all `.tsx`/`.ts` files under `src/pages/` and `src/components/` in
 * `rootDir`, extract interactive elements, and write results to
 * `audit-results/static/elements.json`.
 *
 * @param rootDir - Absolute path to the project root directory.
 * @returns       - Array of `InteractiveElement` objects found.
 */
export async function scanElements(rootDir: string): Promise<InteractiveElement[]> {
  // 1. Discover source files
  const files = await walkFiles(rootDir, SCAN_PATTERNS);

  process.stderr.write(
    `[element-scanner] Scanning ${files.length} files…\n`
  );

  // 2. Scan each file and collect raw results
  const rawElements: RawElement[] = [];
  for (const absolutePath of files) {
    const found = scanFile(absolutePath, rootDir);
    rawElements.push(...found);
  }

  // 3. Convert raw elements to InteractiveElement objects
  const elements: InteractiveElement[] = rawElements.map((raw) => {
    const handlerName = extractHandlerName(raw.expressionText);

    // Parse the source file again only to resolve handler body for identifier refs.
    // We re-read from cache via parseSourceFile (no additional I/O overhead since
    // TypeScript re-uses the parsed SourceFile object in the same process call).
    let handlerBody = raw.expressionText.trim();
    try {
      const absolutePath = path.resolve(rootDir, raw.filePath);
      const sf = parseSourceFile(absolutePath);
      handlerBody = resolveHandlerBody(raw.expressionText, sf);
    } catch {
      // Keep raw expression text on parse failure
    }

    const { layer, pagePath } = resolveModuleInfo(raw.filePath);
    const elementType = resolveElementType(raw.tagName, raw.handlerProp);
    const id = buildId(raw.filePath, raw.lineNumber, handlerName);

    return {
      id,
      filePath: raw.filePath,
      lineNumber: raw.lineNumber,
      elementType,
      handlerName,
      handlerBody,
      parentComponent: raw.parentComponent,
      layer,
      pagePath,
    };
  });

  // 4. Write results to audit-results/static/elements.json
  const outputDir = path.join(rootDir, 'audit-results', 'static');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'elements.json');
  await fs.writeFile(outputPath, JSON.stringify(elements, null, 2), 'utf-8');

  process.stderr.write(
    `[element-scanner] Found ${elements.length} interactive elements → ${outputPath}\n`
  );

  return elements;
}
