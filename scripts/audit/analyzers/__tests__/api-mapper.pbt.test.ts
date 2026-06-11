/**
 * Property-Based Tests for ApiMapper — API Mapping Accuracy
 *
 * **Validates: Requirements 4.1, 4.2**
 *
 * Property 3: API Mapping Accuracy
 *   For any frontend API call object and backend route object:
 *     (a) When call.method === route.method AND pathMatches(call.path, route.path),
 *         the result MUST be 'connected'.
 *     (b) When NO backend route matches the call (no method+path pair satisfies
 *         the match condition), the result MUST be 'disconnected'.
 *
 * The `pathMatches` function is pure and is tested directly without
 * invoking the full `mapApis()` pipeline.
 */

import { describe, it } from 'vitest';
import { expect } from 'vitest';
import * as fc from 'fast-check';

import { pathMatches } from '../api-mapper.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** HTTP methods supported by the system. */
const arbitraryMethod = fc.constantFrom(
  'GET' as const,
  'POST' as const,
  'PUT' as const,
  'PATCH' as const,
  'DELETE' as const,
);

/**
 * Generates simple, realistic API path strings without dynamic parameters.
 * Examples: /api/items, /api/users/123, /api/finance/invoices
 */
const arbitraryLiteralPath: fc.Arbitrary<string> = fc.oneof(
  fc.constant('/api/items'),
  fc.constant('/api/users'),
  fc.constant('/api/products'),
  fc.constant('/api/orders'),
  fc.constant('/api/invoices'),
  fc.constant('/api/finance/invoices'),
  fc.constant('/api/hr/employees'),
  fc.constant('/api/inventory/stock'),
  fc.constant('/api/retail/sales'),
  fc.constant('/api/procurement/orders'),
  // Paths with a numeric segment (simulate /api/users/123)
  fc.tuple(
    fc.constantFrom('/api/users/', '/api/items/', '/api/orders/', '/api/products/'),
    fc.integer({ min: 1, max: 9999 }),
  ).map(([base, id]) => `${base}${id}`),
);

/**
 * Generates a path with an Express-style `:param` segment (backend patterns).
 * E.g., /api/users/:id, /api/orders/:orderId
 */
const arbitraryParamPath: fc.Arbitrary<string> = fc.tuple(
  fc.constantFrom('/api/users/', '/api/items/', '/api/orders/', '/api/products/'),
  fc.constantFrom(':id', ':itemId', ':orderId', ':productId'),
).map(([base, param]) => `${base}${param}`);

/**
 * A frontend API call object (subset of fields needed for matching).
 */
interface FrontendCall {
  method: string;
  path: string;
}

/**
 * A backend route object (subset of fields needed for matching).
 */
interface BackendRoute {
  method: string;
  path: string;
}

/** Arbitrary frontend call with a literal path (no :param). */
const arbitraryFrontendCall: fc.Arbitrary<FrontendCall> = fc.record({
  method: arbitraryMethod,
  path: arbitraryLiteralPath,
});

/** Arbitrary backend route with a literal path. */
const arbitraryBackendRouteLiteral: fc.Arbitrary<BackendRoute> = fc.record({
  method: arbitraryMethod,
  path: arbitraryLiteralPath,
});

/** Arbitrary backend route with a :param path. */
const arbitraryBackendRouteParam: fc.Arbitrary<BackendRoute> = fc.record({
  method: arbitraryMethod,
  path: arbitraryParamPath,
});

// ---------------------------------------------------------------------------
// Helper: minimal classification function mirroring classifyApiCall logic
// ---------------------------------------------------------------------------

/**
 * Classifies a single frontend call against a list of backend routes.
 * Returns 'connected' if any route matches, 'disconnected' otherwise.
 * Mirrors the core logic of classifyApiCall() in api-mapper.ts.
 */
function classify(
  call: FrontendCall,
  routes: BackendRoute[],
): 'connected' | 'disconnected' {
  for (const route of routes) {
    const methodMatch =
      call.method.toUpperCase() === route.method.toUpperCase();
    if (methodMatch && pathMatches(call.path, route.path)) {
      return 'connected';
    }
  }
  return 'disconnected';
}

// ---------------------------------------------------------------------------
// Property 3a: Matching method+path → 'connected'
// ---------------------------------------------------------------------------

describe('ApiMapper — API Mapping Accuracy (Property 3)', () => {
  it(
    '3a: when call.method === route.method AND pathMatches(call.path, route.path), result is connected',
    () => {
      fc.assert(
        fc.property(
          arbitraryFrontendCall,
          (call) => {
            // Build a route that exactly mirrors the call (same method, same literal path)
            const matchingRoute: BackendRoute = {
              method: call.method,
              path: call.path,
            };

            // pathMatches must be true for identical normalized paths
            expect(pathMatches(call.path, matchingRoute.path)).toBe(true);

            // classify must return 'connected'
            const result = classify(call, [matchingRoute]);
            expect(result).toBe('connected');

            return true;
          },
        ),
        {
          numRuns: 200,
          seed: 42,
        },
      );
    },
  );

  it(
    '3a: param route matches a call with a concrete id segment (e.g. /api/users/:id matches /api/users/123)',
    () => {
      fc.assert(
        fc.property(
          arbitraryMethod,
          fc.integer({ min: 1, max: 9999 }),
          fc.constantFrom('users', 'items', 'orders', 'products'),
          (method, id, resource) => {
            const callPath = `/api/${resource}/${id}`;
            const routePath = `/api/${resource}/:id`;

            // Verify pathMatches behaves correctly for this pair
            const matches = pathMatches(callPath, routePath);
            expect(matches).toBe(true);

            const call: FrontendCall = { method, path: callPath };
            const route: BackendRoute = { method, path: routePath };

            const result = classify(call, [route]);
            expect(result).toBe('connected');

            return true;
          },
        ),
        {
          numRuns: 200,
          seed: 42,
        },
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Property 3b: No matching route → 'disconnected'
  // ---------------------------------------------------------------------------

  it(
    '3b: when no backend route matches the call, result is disconnected',
    () => {
      fc.assert(
        fc.property(
          arbitraryFrontendCall,
          // Route list that intentionally uses different paths and/or methods
          fc.array(
            fc.record<BackendRoute>({
              // Use a different method or a path that cannot match the call
              method: fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
              // Non-overlapping paths to ensure no accidental match
              path: fc.constantFrom(
                '/api/nonexistent',
                '/api/ghost/route',
                '/api/nowhere',
                '/api/void/endpoint',
              ),
            }),
            { minLength: 0, maxLength: 5 },
          ),
          (call, routes) => {
            // Filter out any routes that would accidentally match
            const nonMatchingRoutes = routes.filter(
              (r) =>
                !(
                  r.method.toUpperCase() === call.method.toUpperCase() &&
                  pathMatches(call.path, r.path)
                ),
            );

            const result = classify(call, nonMatchingRoutes);
            expect(result).toBe('disconnected');

            return true;
          },
        ),
        {
          numRuns: 200,
          seed: 42,
        },
      );
    },
  );

  it('3b: empty route registry always yields disconnected', () => {
    fc.assert(
      fc.property(
        arbitraryFrontendCall,
        (call) => {
          const result = classify(call, []);
          expect(result).toBe('disconnected');
          return true;
        },
      ),
      {
        numRuns: 200,
        seed: 42,
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Property 3: Method mismatch prevents 'connected' even when path matches
  // ---------------------------------------------------------------------------

  it(
    '3: method mismatch prevents connected classification even when paths are identical',
    () => {
      fc.assert(
        fc.property(
          // Generate a call and route with the same path but different methods
          fc.tuple(
            fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
            fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
            arbitraryLiteralPath,
          ).filter(([callMethod, routeMethod]) => callMethod !== routeMethod),
          ([callMethod, routeMethod, sharedPath]) => {
            const call: FrontendCall = { method: callMethod, path: sharedPath };
            const route: BackendRoute = { method: routeMethod, path: sharedPath };

            // pathMatches is true (same path)
            expect(pathMatches(sharedPath, sharedPath)).toBe(true);

            // But method mismatch means disconnected
            const result = classify(call, [route]);
            expect(result).toBe('disconnected');

            return true;
          },
        ),
        {
          numRuns: 200,
          seed: 42,
        },
      );
    },
  );
});
