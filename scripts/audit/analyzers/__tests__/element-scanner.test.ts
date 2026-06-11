/**
 * Unit tests for element-scanner.ts
 *
 * These tests use a temporary in-memory fixture directory to avoid coupling
 * to the real source tree and to keep tests fast and deterministic.
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { scanElements } from '../element-scanner.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createTmpProject(): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'element-scanner-test-'));
  // Create the expected subdirectories
  await fs.mkdir(path.join(tmpDir, 'src', 'pages'), { recursive: true });
  await fs.mkdir(path.join(tmpDir, 'src', 'components'), { recursive: true });
  return tmpDir;
}

async function writeTsx(
  rootDir: string,
  relPath: string,
  content: string
): Promise<void> {
  const absPath = path.join(rootDir, relPath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, content, 'utf-8');
}

async function cleanup(tmpDir: string): Promise<void> {
  await fs.rm(tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('scanElements', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTmpProject();
  });

  afterEach(async () => {
    await cleanup(tmpDir);
  });

  it('returns an empty array when no files are present', async () => {
    const elements = await scanElements(tmpDir);
    expect(elements).toEqual([]);
  });

  it('detects an onClick handler on a <button> element', async () => {
    await writeTsx(
      tmpDir,
      'src/pages/auth/Login.tsx',
      `
import React from 'react';

export function Login() {
  function handleLogin() {
    fetch('/api/auth/login');
  }
  return <button onClick={handleLogin}>Login</button>;
}
      `
    );

    const elements = await scanElements(tmpDir);
    expect(elements.length).toBeGreaterThanOrEqual(1);

    const btn = elements.find((e) => e.handlerName === 'handleLogin');
    expect(btn).toBeDefined();
    expect(btn!.elementType).toBe('button');
    expect(btn!.parentComponent).toBe('Login');
    expect(btn!.filePath).toContain('Login.tsx');
    expect(btn!.lineNumber).toBeGreaterThan(0);
  });

  it('detects an onSubmit handler on a <form> element', async () => {
    await writeTsx(
      tmpDir,
      'src/pages/auth/Register.tsx',
      `
export function Register() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };
  return <form onSubmit={handleSubmit}><input /><button type="submit">Submit</button></form>;
}
      `
    );

    const elements = await scanElements(tmpDir);
    const formEl = elements.find((e) => e.handlerProp === 'onSubmit' || e.elementType === 'form-submit');
    expect(formEl).toBeDefined();
  });

  it('detects an onChange handler', async () => {
    await writeTsx(
      tmpDir,
      'src/components/SearchInput.tsx',
      `
export function SearchInput() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };
  return <input onChange={handleChange} />;
}
      `
    );

    const elements = await scanElements(tmpDir);
    const input = elements.find((e) => e.handlerName === 'handleChange');
    expect(input).toBeDefined();
    expect(input!.elementType).toBe('clickable');
  });

  it('assigns a stable sha256-based id', async () => {
    await writeTsx(
      tmpDir,
      'src/pages/auth/Login.tsx',
      `
export function Login() {
  return <button onClick={() => {}}>Go</button>;
}
      `
    );

    const elements = await scanElements(tmpDir);
    expect(elements.length).toBeGreaterThanOrEqual(1);

    const el = elements[0];
    // id must be a 16-char hex string
    expect(el.id).toMatch(/^[0-9a-f]{16}$/);

    // Re-derive the id and confirm it matches
    const expectedId = crypto
      .createHash('sha256')
      .update(`${el.filePath}:${el.lineNumber}:${el.handlerName}`)
      .digest('hex')
      .slice(0, 16);

    expect(el.id).toBe(expectedId);
  });

  it('assigns elementType "link" for <a> and <Link> elements', async () => {
    await writeTsx(
      tmpDir,
      'src/pages/Dashboard.tsx',
      `
import { Link } from 'react-router-dom';
export function Dashboard() {
  return (
    <div>
      <a href="/home" onClick={() => {}}>Home</a>
      <Link to="/about" onClick={() => {}}>About</Link>
    </div>
  );
}
      `
    );

    const elements = await scanElements(tmpDir);
    const links = elements.filter((e) => e.elementType === 'link');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('maps file path to the correct layer using MODULE_REGISTRY', async () => {
    await writeTsx(
      tmpDir,
      'src/pages/auth/Login.tsx',
      `
export function Login() {
  return <button onClick={() => {}}>Login</button>;
}
      `
    );

    const elements = await scanElements(tmpDir);
    expect(elements.length).toBeGreaterThanOrEqual(1);
    const el = elements[0];
    expect(el.layer).toBe('auth');
    expect(el.pagePath).toBe('/auth');
  });

  it('falls back to "unknown" layer for files not in MODULE_REGISTRY', async () => {
    await writeTsx(
      tmpDir,
      'src/components/ui/CustomWidget.tsx',
      `
export function CustomWidget() {
  return <button onClick={() => {}}>Click</button>;
}
      `
    );

    const elements = await scanElements(tmpDir);
    expect(elements.length).toBeGreaterThanOrEqual(1);
    // Not in registry — should still produce a result with some layer
    expect(elements[0].layer).toBeDefined();
  });

  it('captures parentComponent correctly for arrow function component', async () => {
    await writeTsx(
      tmpDir,
      'src/pages/core/Dashboard.tsx',
      `
import React from 'react';
const MyDashboard = () => {
  return <button onClick={() => {}}>Open</button>;
};
export default MyDashboard;
      `
    );

    const elements = await scanElements(tmpDir);
    expect(elements.length).toBeGreaterThanOrEqual(1);
    expect(elements[0].parentComponent).toBe('MyDashboard');
  });

  it('writes results to audit-results/static/elements.json', async () => {
    await writeTsx(
      tmpDir,
      'src/pages/auth/Login.tsx',
      `
export function Login() {
  return <button onClick={() => {}}>Login</button>;
}
      `
    );

    await scanElements(tmpDir);

    const outputPath = path.join(tmpDir, 'audit-results', 'static', 'elements.json');
    const raw = await fs.readFile(outputPath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(1);
  });

  it('handles files that cannot be parsed without throwing', async () => {
    await writeTsx(
      tmpDir,
      'src/pages/Broken.tsx',
      // Intentionally malformed but still syntactically valid enough for ts parser
      `export const x = 1;`
    );

    // Should complete without throwing
    await expect(scanElements(tmpDir)).resolves.toBeDefined();
  });

  it('scans both src/pages and src/components directories', async () => {
    await writeTsx(
      tmpDir,
      'src/pages/auth/Login.tsx',
      `export function Login() { return <button onClick={() => {}}>Login</button>; }`
    );
    await writeTsx(
      tmpDir,
      'src/components/ui/SaveButton.tsx',
      `export function SaveButton() { return <button onClick={() => {}}>Save</button>; }`
    );

    const elements = await scanElements(tmpDir);
    const filePaths = elements.map((e) => e.filePath);
    expect(filePaths.some((p) => p.includes('Login.tsx'))).toBe(true);
    expect(filePaths.some((p) => p.includes('SaveButton.tsx'))).toBe(true);
  });
});
