/**
 * AST Parser Utilities
 *
 * Shared TypeScript Compiler API helpers for parsing and traversing
 * TypeScript/TSX source files. Used by all static analyzers.
 *
 * Requirements: 1.1, 4.1
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

// ---------------------------------------------------------------------------
// Core parsing
// ---------------------------------------------------------------------------

/**
 * Read a source file from disk and parse it into a TypeScript `SourceFile`
 * AST node. TSX/JSX syntax is always enabled so that `.tsx` files (the
 * majority of files we scan) parse correctly. Plain `.ts` files also parse
 * fine under `ScriptKind.TSX`.
 *
 * @param filePath - Absolute or relative path to the `.ts`/`.tsx` file.
 * @returns        - A `ts.SourceFile` ready for AST traversal.
 */
export function parseSourceFile(filePath: string): ts.SourceFile {
  const absolutePath = path.resolve(filePath);
  const source = fs.readFileSync(absolutePath, 'utf-8');

  return ts.createSourceFile(
    absolutePath,
    source,
    ts.ScriptTarget.ESNext,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX
  );
}

// ---------------------------------------------------------------------------
// Node traversal
// ---------------------------------------------------------------------------

/**
 * Recursively visit every node in the AST subtree rooted at `node`.
 * The supplied `visitor` is called once for each node (pre-order traversal).
 *
 * @param node    - The root node to start traversal from.
 * @param visitor - Callback invoked for each visited node.
 */
export function visitNodes(
  node: ts.Node,
  visitor: (node: ts.Node) => void
): void {
  visitor(node);
  ts.forEachChild(node, (child) => visitNodes(child, visitor));
}

// ---------------------------------------------------------------------------
// JSX helpers
// ---------------------------------------------------------------------------

/**
 * Extract the tag name of a JSX element or self-closing element node.
 *
 * Returns the string tag name (e.g., `"Button"`, `"a"`, `"DialogContent"`)
 * when `node` is a `JsxOpeningElement` or `JsxSelfClosingElement`, and
 * `null` for any other node kind.
 *
 * Handles:
 *  - Simple identifiers:       `<Button>`     → `"Button"`
 *  - Member expressions:       `<Foo.Bar>`    → `"Foo.Bar"`
 *  - Namespaced names:         `<Foo:Bar>`    → `"Foo:Bar"`
 *
 * @param node - Any AST node.
 * @returns    - The element name string, or `null` if not a JSX element.
 */
export function getJsxElementName(node: ts.Node): string | null {
  if (
    node.kind !== ts.SyntaxKind.JsxOpeningElement &&
    node.kind !== ts.SyntaxKind.JsxSelfClosingElement
  ) {
    return null;
  }

  const element = node as ts.JsxOpeningElement | ts.JsxSelfClosingElement;
  return tagNameToString(element.tagName);
}

/**
 * Recursively convert a JSX tag name expression to a plain string.
 * Handles `Identifier`, `PropertyAccessExpression`, and `JsxNamespacedName`.
 */
function tagNameToString(tagName: ts.JsxTagNameExpression): string {
  if (ts.isIdentifier(tagName)) {
    return tagName.text;
  }
  if (ts.isPropertyAccessExpression(tagName)) {
    return `${tagNameToString(tagName.expression as ts.JsxTagNameExpression)}.${tagName.name.text}`;
  }
  // JsxNamespacedName (e.g., Foo:Bar)
  const namespaced = tagName as ts.JsxNamespacedName;
  if (namespaced.namespace && namespaced.name) {
    return `${namespaced.namespace.text}:${namespaced.name.text}`;
  }
  return tagName.getText();
}

// ---------------------------------------------------------------------------
// Handler-expression helpers
// ---------------------------------------------------------------------------

/**
 * Given a JSX attribute node whose value is an event handler (e.g.,
 * `onClick={handleSubmit}` or `onClick={() => doSomething()}`), return the
 * handler expression as a source-code string.
 *
 * Returns `null` when:
 * - `node` is not a `JsxAttribute`.
 * - The attribute has no initializer (boolean shorthand like `disabled`).
 * - The initializer is not a JSX expression container.
 *
 * @param node - Any AST node (only acts on `JsxAttribute` nodes).
 * @returns    - Handler expression text, or `null`.
 */
export function getHandlerExpression(node: ts.Node): string | null {
  if (node.kind !== ts.SyntaxKind.JsxAttribute) {
    return null;
  }

  const attr = node as ts.JsxAttribute;
  if (!attr.initializer) {
    return null;
  }

  // The initializer of a handler attribute is always a JsxExpression: {expr}
  if (attr.initializer.kind !== ts.SyntaxKind.JsxExpression) {
    return null;
  }

  const jsxExpr = attr.initializer as ts.JsxExpression;
  if (!jsxExpr.expression) {
    // Empty braces `onClick={}`
    return '';
  }

  return jsxExpr.expression.getText();
}

// ---------------------------------------------------------------------------
// Source location helpers
// ---------------------------------------------------------------------------

/**
 * Return a snippet of source text surrounding `node` in `sourceFile`.
 * Useful for giving context when reporting an issue.
 *
 * The returned string spans from the start of the line at the beginning of
 * the window to the end of the line at the end of the window.
 *
 * @param sourceFile - The parsed source file containing `node`.
 * @param node       - The node whose surrounding text is requested.
 * @param range      - Number of characters to include before and after the
 *                     node. Defaults to 200.
 * @returns          - A substring of the original source text.
 */
export function getSurroundingText(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  range = 200
): string {
  const fullText = sourceFile.getFullText();
  const start = Math.max(0, node.getStart(sourceFile) - range);
  const end = Math.min(fullText.length, node.getEnd() + range);
  return fullText.slice(start, end);
}

/**
 * Return the 1-based line number of `node` within `sourceFile`.
 *
 * TypeScript's internal `getLineAndCharacterOfPosition` is 0-based, so we
 * add 1 to make the result human-readable (matches editor line numbers).
 *
 * @param sourceFile - The parsed source file containing `node`.
 * @param node       - The node whose line number is requested.
 * @returns          - 1-based line number.
 */
export function getLineNumber(
  sourceFile: ts.SourceFile,
  node: ts.Node
): number {
  const { line } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile)
  );
  return line + 1;
}
