/**
 * Unit tests for AST parser utilities.
 *
 * Requirements: 1.1, 4.1
 */

import { describe, it, expect } from 'vitest';
import * as ts from 'typescript';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import {
  parseSourceFile,
  visitNodes,
  getJsxElementName,
  getHandlerExpression,
  getLineNumber,
  getSurroundingText,
} from '../ast-parser.js';

// ---------------------------------------------------------------------------
// Helpers — create a temporary TSX source file on disk
// ---------------------------------------------------------------------------

function writeTempTsx(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-parser-test-'));
  const file = path.join(dir, 'test.tsx');
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

// ---------------------------------------------------------------------------
// parseSourceFile
// ---------------------------------------------------------------------------

describe('parseSourceFile', () => {
  it('returns a SourceFile for a valid TSX file', () => {
    const file = writeTempTsx(`const x = 1;`);
    const sf = parseSourceFile(file);
    expect(sf).toBeDefined();
    expect(sf.kind).toBe(ts.SyntaxKind.SourceFile);
  });

  it('parses JSX/TSX syntax without throwing', () => {
    const file = writeTempTsx(`export default function A() { return <div><Button onClick={() => {}} /></div>; }`);
    expect(() => parseSourceFile(file)).not.toThrow();
  });

  it('sets parent nodes so getStart() works on child nodes', () => {
    const file = writeTempTsx(`const a = 1;`);
    const sf = parseSourceFile(file);
    // If setParentNodes is true, every child can navigate to its parent
    let childNode: ts.Node | undefined;
    ts.forEachChild(sf, (n) => { childNode = n; });
    expect(childNode?.parent).toBe(sf);
  });
});

// ---------------------------------------------------------------------------
// visitNodes
// ---------------------------------------------------------------------------

describe('visitNodes', () => {
  it('visits every node in a simple file', () => {
    const file = writeTempTsx(`const x = 1;`);
    const sf = parseSourceFile(file);
    const visited: ts.SyntaxKind[] = [];
    visitNodes(sf, (n) => visited.push(n.kind));
    expect(visited.length).toBeGreaterThan(1);
    // SourceFile itself should be visited first
    expect(visited[0]).toBe(ts.SyntaxKind.SourceFile);
  });

  it('visits JSX elements in a TSX file', () => {
    const file = writeTempTsx(
      `function C() { return <Button onClick={() => {}} />; }`
    );
    const sf = parseSourceFile(file);
    const jsxKinds = [
      ts.SyntaxKind.JsxSelfClosingElement,
      ts.SyntaxKind.JsxOpeningElement,
    ];
    const found: ts.SyntaxKind[] = [];
    visitNodes(sf, (n) => {
      if (jsxKinds.includes(n.kind)) found.push(n.kind);
    });
    expect(found.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getJsxElementName
// ---------------------------------------------------------------------------

describe('getJsxElementName', () => {
  function collectNames(source: string): string[] {
    const file = writeTempTsx(source);
    const sf = parseSourceFile(file);
    const names: string[] = [];
    visitNodes(sf, (n) => {
      const name = getJsxElementName(n);
      if (name) names.push(name);
    });
    return names;
  }

  it('returns null for non-JSX nodes', () => {
    const file = writeTempTsx(`const x = 1;`);
    const sf = parseSourceFile(file);
    let anyNonNull = false;
    visitNodes(sf, (n) => {
      if (getJsxElementName(n) !== null) anyNonNull = true;
    });
    expect(anyNonNull).toBe(false);
  });

  it('extracts simple identifier element names', () => {
    const names = collectNames(`function C() { return <Button />; }`);
    expect(names).toContain('Button');
  });

  it('extracts lowercase HTML element names', () => {
    const names = collectNames(`function C() { return <div><a href="#">link</a></div>; }`);
    expect(names).toContain('div');
    expect(names).toContain('a');
  });

  it('extracts member-expression names (e.g. Dialog.Content)', () => {
    const names = collectNames(
      `function C() { return <Dialog.Content />; }`
    );
    expect(names).toContain('Dialog.Content');
  });

  it('handles opening and self-closing elements', () => {
    const names = collectNames(
      `function C() { return <Wrapper><Child /></Wrapper>; }`
    );
    expect(names).toContain('Wrapper');
    expect(names).toContain('Child');
  });
});

// ---------------------------------------------------------------------------
// getHandlerExpression
// ---------------------------------------------------------------------------

describe('getHandlerExpression', () => {
  function collectHandlers(source: string): string[] {
    const file = writeTempTsx(source);
    const sf = parseSourceFile(file);
    const handlers: string[] = [];
    visitNodes(sf, (n) => {
      const h = getHandlerExpression(n);
      if (h !== null) handlers.push(h);
    });
    return handlers;
  }

  it('returns null for non-JsxAttribute nodes', () => {
    const file = writeTempTsx(`const x = 1;`);
    const sf = parseSourceFile(file);
    let anyNonNull = false;
    visitNodes(sf, (n) => {
      if (getHandlerExpression(n) !== null) anyNonNull = true;
    });
    expect(anyNonNull).toBe(false);
  });

  it('extracts arrow-function handler text', () => {
    const handlers = collectHandlers(
      `function C() { return <Button onClick={() => doSomething()} />; }`
    );
    expect(handlers.some(h => h.includes('doSomething'))).toBe(true);
  });

  it('extracts identifier handler reference', () => {
    const handlers = collectHandlers(
      `function C() { return <Button onClick={handleClick} />; }`
    );
    expect(handlers).toContain('handleClick');
  });

  it('returns empty string for empty handler braces', () => {
    const handlers = collectHandlers(
      `function C() { return <Button onClick={} />; }`
    );
    expect(handlers).toContain('');
  });

  it('returns null for boolean shorthand attributes (no initializer)', () => {
    const file = writeTempTsx(
      `function C() { return <Button disabled />; }`
    );
    const sf = parseSourceFile(file);
    const results: Array<string | null> = [];
    visitNodes(sf, (n) => {
      if (n.kind === ts.SyntaxKind.JsxAttribute) {
        results.push(getHandlerExpression(n));
      }
    });
    // `disabled` has no initializer → null
    expect(results).toContain(null);
  });
});

// ---------------------------------------------------------------------------
// getLineNumber
// ---------------------------------------------------------------------------

describe('getLineNumber', () => {
  it('returns 1 for a node on the first line', () => {
    const file = writeTempTsx(`const x = 1;`);
    const sf = parseSourceFile(file);
    let firstStatement: ts.Node | undefined;
    ts.forEachChild(sf, (n) => { if (!firstStatement) firstStatement = n; });
    expect(getLineNumber(sf, firstStatement!)).toBe(1);
  });

  it('returns correct line number for nodes on later lines', () => {
    const file = writeTempTsx(`const a = 1;\nconst b = 2;\nconst c = 3;`);
    const sf = parseSourceFile(file);
    // Use the statements array from the SourceFile directly
    const statements = sf.statements;
    expect(statements.length).toBeGreaterThanOrEqual(3);
    expect(getLineNumber(sf, statements[0])).toBe(1);
    expect(getLineNumber(sf, statements[1])).toBe(2);
    expect(getLineNumber(sf, statements[2])).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getSurroundingText
// ---------------------------------------------------------------------------

describe('getSurroundingText', () => {
  it('returns a non-empty substring of the source', () => {
    const source = `const x = 1;\nconst y = 2;`;
    const file = writeTempTsx(source);
    const sf = parseSourceFile(file);
    let firstNode: ts.Node | undefined;
    ts.forEachChild(sf, (n) => { if (!firstNode) firstNode = n; });
    const result = getSurroundingText(sf, firstNode!, 50);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('does not exceed source bounds', () => {
    const source = `const x = 1;`;
    const file = writeTempTsx(source);
    const sf = parseSourceFile(file);
    let firstNode: ts.Node | undefined;
    ts.forEachChild(sf, (n) => { if (!firstNode) firstNode = n; });
    // range larger than the file itself
    const result = getSurroundingText(sf, firstNode!, 10_000);
    expect(result).toBe(source);
  });

  it('contains the node text in the surrounding snippet', () => {
    const source = `const targetNode = 42;`;
    const file = writeTempTsx(source);
    const sf = parseSourceFile(file);
    let firstNode: ts.Node | undefined;
    ts.forEachChild(sf, (n) => { if (!firstNode) firstNode = n; });
    const result = getSurroundingText(sf, firstNode!, 200);
    expect(result).toContain('targetNode');
  });

  it('uses default range of 200 when not specified', () => {
    const source = `const x = 1;`;
    const file = writeTempTsx(source);
    const sf = parseSourceFile(file);
    let firstNode: ts.Node | undefined;
    ts.forEachChild(sf, (n) => { if (!firstNode) firstNode = n; });
    // Should not throw with default range
    expect(() => getSurroundingText(sf, firstNode!)).not.toThrow();
  });
});
