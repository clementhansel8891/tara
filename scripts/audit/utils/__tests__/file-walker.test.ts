/**
 * Unit tests for the file-walker utility.
 *
 * These tests use a small in-memory fixture directory tree written to the OS
 * temp folder so they exercise the real Node.js `fs.readdir` recursive path
 * without depending on the live project source tree.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { walkFiles } from '../file-walker.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let fixtureRoot: string;

/** Create the fixture directory tree once for the whole test suite. */
async function createFixtures(root: string): Promise<void> {
  const dirs = [
    'src/pages/auth',
    'src/pages/core/finance',
    'src/components/ui',
    'src/lib',
    'backend/src/modules',
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(root, dir), { recursive: true });
  }

  const files: Record<string, string> = {
    'src/pages/auth/Login.tsx': '// login page',
    'src/pages/auth/Register.tsx': '// register page',
    'src/pages/core/finance/Invoice.tsx': '// invoice page',
    'src/pages/core/finance/invoice.service.ts': '// service',
    'src/components/ui/Button.tsx': '// button',
    'src/components/ui/dialog.ts': '// dialog',
    'src/lib/api.ts': '// api util',
    'src/lib/utils.js': '// js util — should NOT match ts patterns',
    'backend/src/modules/finance.controller.ts': '// controller',
    'README.md': '// docs — should NOT match ts patterns',
  };

  for (const [rel, content] of Object.entries(files)) {
    await fs.writeFile(path.join(root, rel), content, 'utf8');
  }
}

beforeAll(async () => {
  fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'file-walker-test-'));
  await createFixtures(fixtureRoot);
});

afterAll(async () => {
  await fs.rm(fixtureRoot, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Core functionality
// ---------------------------------------------------------------------------

describe('walkFiles — core functionality', () => {
  it('returns only .tsx files when pattern targets tsx', async () => {
    const results = await walkFiles(fixtureRoot, ['src/pages/**/*.tsx']);
    const names = results.map((p) => path.basename(p)).sort();
    expect(names).toEqual(['Invoice.tsx', 'Login.tsx', 'Register.tsx']);
  });

  it('returns both .ts and .tsx files with brace expansion', async () => {
    const results = await walkFiles(fixtureRoot, [
      'src/pages/**/*.{ts,tsx}',
    ]);
    const names = results.map((p) => path.basename(p)).sort();
    expect(names).toEqual([
      'Invoice.tsx',
      'Login.tsx',
      'Register.tsx',
      'invoice.service.ts',
    ]);
  });

  it('handles brace expansion for directory segments', async () => {
    const results = await walkFiles(fixtureRoot, [
      'src/{pages,components}/**/*.{ts,tsx}',
    ]);
    const names = results.map((p) => path.basename(p)).sort();
    expect(names).toEqual([
      'Button.tsx',
      'Invoice.tsx',
      'Login.tsx',
      'Register.tsx',
      'dialog.ts',
      'invoice.service.ts',
    ]);
  });

  it('matches files at the root of a directory (no subdirectory)', async () => {
    const results = await walkFiles(fixtureRoot, ['src/lib/*.ts']);
    const names = results.map((p) => path.basename(p));
    expect(names).toContain('api.ts');
    expect(names).not.toContain('utils.js');
  });

  it('returns all matched files across multiple patterns', async () => {
    const results = await walkFiles(fixtureRoot, [
      'src/lib/*.ts',
      'backend/src/**/*.ts',
    ]);
    const names = results.map((p) => path.basename(p)).sort();
    expect(names).toEqual(['api.ts', 'finance.controller.ts']);
  });

  it('returns absolute paths', async () => {
    const results = await walkFiles(fixtureRoot, ['src/pages/**/*.tsx']);
    for (const p of results) {
      expect(path.isAbsolute(p)).toBe(true);
    }
  });

  it('does not return directories', async () => {
    const results = await walkFiles(fixtureRoot, ['src/**/*']);
    for (const p of results) {
      const stat = await fs.stat(p);
      expect(stat.isFile()).toBe(true);
    }
  });

  it('does not return files that do not match any pattern', async () => {
    const results = await walkFiles(fixtureRoot, ['src/pages/**/*.tsx']);
    const names = results.map((p) => path.basename(p));
    expect(names).not.toContain('utils.js');
    expect(names).not.toContain('README.md');
    expect(names).not.toContain('finance.controller.ts');
  });
});

// ---------------------------------------------------------------------------
// Missing / invalid directory handling
// ---------------------------------------------------------------------------

describe('walkFiles — missing directory handling', () => {
  it('returns empty array when rootDir does not exist', async () => {
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const results = await walkFiles('/nonexistent/path/that/does/not/exist', [
      '**/*.ts',
    ]);
    expect(results).toEqual([]);
    spy.mockRestore();
  });

  it('logs a warning to stderr when rootDir does not exist', async () => {
    const messages: string[] = [];
    const spy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation((msg: unknown) => {
        messages.push(String(msg));
        return true;
      });

    await walkFiles('/nonexistent/path/12345', ['**/*.ts']);

    expect(messages.some((m) => m.includes('WARNING'))).toBe(true);
    expect(messages.some((m) => m.includes('nonexistent'))).toBe(true);
    spy.mockRestore();
  });

  it('returns empty array when pattern matches nothing', async () => {
    const results = await walkFiles(fixtureRoot, ['**/*.nonexistent']);
    expect(results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Relative vs absolute rootDir
// ---------------------------------------------------------------------------

describe('walkFiles — relative and absolute rootDir', () => {
  it('accepts an absolute rootDir', async () => {
    const results = await walkFiles(fixtureRoot, ['src/pages/**/*.tsx']);
    expect(results.length).toBeGreaterThan(0);
  });

  it('accepts a relative rootDir resolved against cwd', async () => {
    // Change cwd temporarily is fragile in parallel tests; instead verify that
    // a relative path matching the fixture root (from cwd) resolves correctly.
    // We compute the relative path from the current working directory.
    const relRoot = path.relative(process.cwd(), fixtureRoot);
    const results = await walkFiles(relRoot, ['src/pages/**/*.tsx']);
    expect(results.length).toBeGreaterThan(0);
    // Returned paths must still be absolute
    for (const p of results) {
      expect(path.isAbsolute(p)).toBe(true);
    }
  });
});
