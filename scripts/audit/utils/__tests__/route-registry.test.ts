/**
 * Unit tests for RouteRegistry.
 *
 * Strategy: write small NestJS controller source-code strings to a temp
 * directory on disk, then call `buildRouteRegistry()` against that temp dir
 * so that the real AST parser and file-walker code paths are exercised.
 *
 * Requirements: 4.2
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRouteRegistry } from '../route-registry.js';
import type { BackendRoute } from '../../types/audit-types.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/** Temp directory created fresh before each test. */
let tmpDir: string;

/**
 * Write a fake `<backendDir>/src/` tree with a single controller file and
 * return the `backendDir` path to pass to `buildRouteRegistry`.
 */
function createBackendFixture(controllerSource: string): string {
  const backendDir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-registry-test-'));
  const srcDir = path.join(backendDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'test.controller.ts'), controllerSource, 'utf-8');
  return backendDir;
}

/**
 * Write multiple controller files and return the `backendDir` path.
 */
function createMultiFileFixture(files: Record<string, string>): string {
  const backendDir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-registry-multi-'));
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(backendDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  }
  return backendDir;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rr-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 1. Basic decorator parsing
// ---------------------------------------------------------------------------

describe('buildRouteRegistry — basic decorator parsing', () => {
  it('parses a single @Get route with a controller prefix', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll() { return []; }
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject<Partial<BackendRoute>>({
      method: 'GET',
      path: '/users',
    });
  });

  it('parses @Post and returns method as uppercase POST', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Post } from '@nestjs/common';

@Controller('orders')
export class OrdersController {
  @Post()
  create() { return {}; }
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(1);
    expect(routes[0].method).toBe('POST');
    expect(routes[0].path).toBe('/orders');
  });

  it('parses @Put, @Patch, and @Delete methods correctly', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Put, Patch, Delete } from '@nestjs/common';

@Controller('items')
export class ItemsController {
  @Put(':id')
  replace() {}

  @Patch(':id')
  update() {}

  @Delete(':id')
  remove() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    const methods = routes.map((r) => r.method).sort();
    expect(methods).toEqual(['DELETE', 'PATCH', 'PUT']);
  });

  it('includes the controllerFile path in each route', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes[0].controllerFile).toContain('test.controller.ts');
  });
});

// ---------------------------------------------------------------------------
// 2. Path combination — prefix + sub-path
// ---------------------------------------------------------------------------

describe('buildRouteRegistry — path combination', () => {
  it('combines controller prefix with a method-level sub-path', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

@Controller('api/v1/products')
export class ProductsController {
  @Get('featured')
  getFeatured() { return []; }
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({ method: 'GET', path: '/api/v1/products/featured' });
  });

  it('handles sub-path with a leading slash without double slashes', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

@Controller('orders')
export class OrdersController {
  @Get('/history')
  getHistory() { return []; }
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes[0].path).toBe('/orders/history');
    // Ensure no double slash
    expect(routes[0].path).not.toContain('//');
  });

  it('handles prefix with a trailing slash without double slashes', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

@Controller('invoices/')
export class InvoicesController {
  @Get('pending')
  getPending() { return []; }
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes[0].path).toBe('/invoices/pending');
    expect(routes[0].path).not.toContain('//');
  });

  it('produces the correct path for a multi-segment prefix and sub-path', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get, Post } from '@nestjs/common';

@Controller('api/v2/inventory')
export class InventoryController {
  @Get('list')
  list() {}

  @Post('receive')
  receive() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(2);
    const paths = routes.map((r) => r.path).sort();
    expect(paths).toEqual([
      '/api/v2/inventory/list',
      '/api/v2/inventory/receive',
    ]);
  });
});

// ---------------------------------------------------------------------------
// 3. Edge cases
// ---------------------------------------------------------------------------

describe('buildRouteRegistry — no controller prefix', () => {
  it('@Controller() with empty parens → method path used as-is', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get('ping')
  ping() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe('/ping');
  });

  it('@Get() with no argument yields the controller prefix as the full path', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

@Controller('status')
export class StatusController {
  @Get()
  getStatus() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe('/status');
  });

  it('@Controller() with no arg and @Get() with no arg yields "/"', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe('/');
  });
});

describe('buildRouteRegistry — nested paths with leading slashes', () => {
  it('handles method-level path with leading slash and no prefix', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

@Controller()
export class MetaController {
  @Get('/version')
  version() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes[0].path).toBe('/version');
    expect(routes[0].path).not.toContain('//');
  });

  it('handles nested sub-paths like ":id/details"', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

@Controller('products')
export class ProductsController {
  @Get(':id/details')
  getDetails() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes[0].path).toBe('/products/:id/details');
  });
});

describe('buildRouteRegistry — multiple HTTP methods on the same controller', () => {
  it('returns one route per HTTP-method decorator on the same class', async () => {
    const backendDir = createBackendFixture(`
import { Controller, Get, Post, Put, Patch, Delete } from '@nestjs/common';

@Controller('resources')
export class ResourcesController {
  @Get()
  findAll() {}

  @Get(':id')
  findOne() {}

  @Post()
  create() {}

  @Put(':id')
  replace() {}

  @Patch(':id')
  update() {}

  @Delete(':id')
  remove() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(6);

    const methodPaths = routes.map((r) => `${r.method} ${r.path}`).sort();
    expect(methodPaths).toEqual([
      'DELETE /resources/:id',
      'GET /resources',
      'GET /resources/:id',
      'PATCH /resources/:id',
      'POST /resources',
      'PUT /resources/:id',
    ]);
  });
});

// ---------------------------------------------------------------------------
// 4. Multiple controller files
// ---------------------------------------------------------------------------

describe('buildRouteRegistry — multiple controller files', () => {
  it('aggregates routes from multiple controller files', async () => {
    const backendDir = createMultiFileFixture({
      'src/users.controller.ts': `
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll() {}
}
`,
      'src/orders.controller.ts': `
import { Controller, Post } from '@nestjs/common';

@Controller('orders')
export class OrdersController {
  @Post()
  create() {}
}
`,
    });

    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(2);

    const methodPaths = routes.map((r) => `${r.method} ${r.path}`).sort();
    expect(methodPaths).toEqual(['GET /users', 'POST /orders']);
  });

  it('distinguishes routes by their controllerFile path', async () => {
    const backendDir = createMultiFileFixture({
      'src/a.controller.ts': `
import { Controller, Get } from '@nestjs/common';

@Controller('a')
export class AController {
  @Get()
  get() {}
}
`,
      'src/b.controller.ts': `
import { Controller, Get } from '@nestjs/common';

@Controller('b')
export class BController {
  @Get()
  get() {}
}
`,
    });

    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(2);

    const files = routes.map((r) => path.basename(r.controllerFile)).sort();
    expect(files).toEqual(['a.controller.ts', 'b.controller.ts']);
  });
});

// ---------------------------------------------------------------------------
// 5. Non-controller classes are ignored
// ---------------------------------------------------------------------------

describe('buildRouteRegistry — non-controller classes', () => {
  it('ignores classes without @Controller decorator', async () => {
    const backendDir = createBackendFixture(`
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findAll() { return []; }
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(0);
  });

  it('ignores plain classes with no decorators', async () => {
    const backendDir = createBackendFixture(`
export class HelperClass {
  doThing() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    expect(routes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Missing or empty directories
// ---------------------------------------------------------------------------

describe('buildRouteRegistry — missing or empty directories', () => {
  it('returns empty array when backendDir does not exist', async () => {
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const routes = await buildRouteRegistry('/nonexistent/backend/path/xyz');
    expect(routes).toEqual([]);
    spy.mockRestore();
  });

  it('returns empty array when no controller files exist under src/', async () => {
    const emptyBackendDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-backend-'));
    fs.mkdirSync(path.join(emptyBackendDir, 'src'), { recursive: true });
    // Write a non-controller file so walkFiles finds no matches
    fs.writeFileSync(path.join(emptyBackendDir, 'src', 'app.service.ts'), '', 'utf-8');

    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const routes = await buildRouteRegistry(emptyBackendDir);
    expect(routes).toEqual([]);
    spy.mockRestore();

    fs.rmSync(emptyBackendDir, { recursive: true, force: true });
  });

  it('emits a warning to stderr when no controller files are found', async () => {
    const emptyBackendDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-warn-'));
    fs.mkdirSync(path.join(emptyBackendDir, 'src'), { recursive: true });

    const messages: string[] = [];
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation((msg: unknown) => {
      messages.push(String(msg));
      return true;
    });

    await buildRouteRegistry(emptyBackendDir);

    expect(messages.some((m) => m.includes('WARNING'))).toBe(true);
    spy.mockRestore();

    fs.rmSync(emptyBackendDir, { recursive: true, force: true });
  });
});

// ---------------------------------------------------------------------------
// 7. Malformed or dynamic decorator arguments are skipped gracefully
// ---------------------------------------------------------------------------

describe('buildRouteRegistry — dynamic/template decorator arguments', () => {
  it('skips routes whose path cannot be statically determined (template literal)', async () => {
    // Template-literal paths → extractDecoratorPath returns null → route skipped
    const prefix = 'dynamic';
    const backendDir = createBackendFixture(`
import { Controller, Get } from '@nestjs/common';

const PREFIX = 'dynamic';

@Controller('stable')
export class DynamicController {
  @Get(\`\${PREFIX}/path\`)
  dynamic() {}

  @Get('static')
  static() {}
}
`);
    const routes = await buildRouteRegistry(backendDir);
    // Only the static route should appear
    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe('/stable/static');
    // Suppress the unused variable warning in this test
    void prefix;
  });
});
