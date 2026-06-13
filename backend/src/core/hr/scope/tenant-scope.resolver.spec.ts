// Feature: hr-module-stabilization, Property 2: Effective scope derives from verified context, not client input
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { ForbiddenException } from "@nestjs/common";

import {
  computeScopeIntent,
  TenantScopeResolver,
} from "./tenant-scope.resolver";
import { TenantContext } from "../../../gateway/tenant-context.interface";
import { RequestedScope } from "./tenant-scope";
import { UserRole } from "../../../shared/roles";

/**
 * Property 2: Effective scope derives from verified context, not client input.
 *
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 7.2
 *
 * This property asserts three facets of the design's scope-resolution rules:
 *   (A) The effective/persisted `tenant_id` always equals the verified context
 *       `tenant_id`, no matter what a client supplies in the request body/headers,
 *       and the resolved `company_id` is NEVER silently set equal to `tenant_id`
 *       (the distinct-identifier rule, Requirement 2.4).
 *   (B) A non-privileged caller that requests a `location_id`/`company_id` outside
 *       its verified context (a scope-widening attempt) is rejected with a
 *       Forbidden client error (Requirements 2.3, 2.5).
 *   (C) A requested `location_id`/`company_id` that does not belong to the caller's
 *       `tenant_id` is rejected with a Forbidden client error — verified against a
 *       mocked Prisma ownership boundary (Requirements 2.5, 7.2).
 *
 * The pure decision logic (`computeScopeIntent`) is exercised with property
 * generation; ownership validation (`TenantScopeResolver.resolve`) is exercised
 * with a mocked Prisma boundary so no live DB is required.
 */

const NON_PRIVILEGED_ROLES = [UserRole.MANAGER, UserRole.MEMBER] as const;
const PRIVILEGED_ROLES = [
  UserRole.SUPERADMIN,
  UserRole.OWNER,
  UserRole.ADMIN,
] as const;
const ALL_ROLES = [...PRIVILEGED_ROLES, ...NON_PRIVILEGED_ROLES] as const;

// Context-owned identifiers are plain UUIDs.
const idArb = fc.uuid();
// Client-requested identifiers are prefixed so they can never collide with a
// context UUID — this lets us construct guaranteed scope-widening attempts.
const requestedIdArb = fc.uuid().map((u) => `req-${u}`);

/** A verified tenant context with any role and optional company/location scope. */
const ctxArb: fc.Arbitrary<TenantContext> = fc
  .record({
    tenant_id: idArb,
    company_id: fc.option(idArb, { nil: undefined }),
    location_id: fc.option(idArb, { nil: undefined }),
    role: fc.option(fc.constantFrom(...ALL_ROLES), { nil: undefined }),
    user_id: idArb,
  })
  .map((c) => c as unknown as TenantContext);

/**
 * Same as ctxArb but sometimes forces `company_id === tenant_id` to exercise the
 * distinct-identifier rule (the resolver must drop such a company_id).
 */
const ctxWithTenantEqCompanyArb: fc.Arbitrary<TenantContext> = fc.oneof(
  ctxArb,
  ctxArb.map((c) => ({ ...c, company_id: c.tenant_id }) as TenantContext),
);

/** An optional requested scope filter, possibly empty. */
const requestedArb: fc.Arbitrary<RequestedScope | undefined> = fc.option(
  fc.record({
    location_id: fc.option(requestedIdArb, { nil: undefined }),
    company_id: fc.option(requestedIdArb, { nil: undefined }),
  }),
  { nil: undefined },
);

function tryComputeScopeIntent(ctx: TenantContext, requested?: RequestedScope) {
  try {
    return { ok: true as const, intent: computeScopeIntent(ctx, requested) };
  } catch (err) {
    return { ok: false as const, err };
  }
}

describe("Property 2: Effective scope derives from verified context, not client input", () => {
  // (A) tenant_id is always the context tenant_id; company_id is never == tenant_id.
  it("derives tenant_id from context and never equates company_id to tenant_id", () => {
    fc.assert(
      fc.property(
        ctxWithTenantEqCompanyArb,
        requestedArb,
        // A spoofed client-supplied tenant/company that must be ignored entirely.
        fc.record({ tenant_id: idArb, company_id: idArb }),
        (ctx, requested, spoofedClientInput) => {
          // The resolver signature physically cannot accept a client tenant_id;
          // spoofedClientInput models a hostile body/header that is simply ignored.
          void spoofedClientInput;

          const result = tryComputeScopeIntent(ctx, requested);

          if (!result.ok) {
            // Any rejection must be a client-side Forbidden error, never a 500.
            expect(result.err).toBeInstanceOf(ForbiddenException);
            return;
          }

          const { intent } = result;
          // Effective tenant_id always equals the verified context tenant_id.
          expect(intent.tenant_id).toBe(ctx.tenant_id);
          // company_id is never silently set equal to tenant_id.
          if (intent.company_id !== undefined) {
            expect(intent.company_id).not.toBe(intent.tenant_id);
            expect(intent.company_id).not.toBe(ctx.tenant_id);
          }
        },
      ),
      { numRuns: 300 },
    );
  });

  // (B) Non-privileged callers cannot widen scope beyond their context.
  it("rejects non-privileged scope-widening with a Forbidden client error", () => {
    const nonPrivCtxArb = fc.record({
      tenant_id: idArb,
      company_id: fc.option(idArb, { nil: undefined }),
      location_id: fc.option(idArb, { nil: undefined }),
      role: fc.constantFrom(...NON_PRIVILEGED_ROLES),
      user_id: idArb,
    });

    fc.assert(
      fc.property(
        nonPrivCtxArb,
        // A requested filter that widens scope: at least one prefixed (foreign) id,
        // guaranteed distinct from any context UUID.
        fc.record({
          location_id: fc.option(requestedIdArb, { nil: undefined }),
          company_id: fc.option(requestedIdArb, { nil: undefined }),
        }),
        (ctxRecord, requested) => {
          const ctx = ctxRecord as unknown as TenantContext;

          // Only consider genuine widening attempts (a non-empty requested filter).
          const widens =
            requested.location_id !== undefined ||
            requested.company_id !== undefined;
          fc.pre(widens);

          const result = tryComputeScopeIntent(ctx, requested);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.err).toBeInstanceOf(ForbiddenException);
          }
        },
      ),
      { numRuns: 300 },
    );
  });

  // (C) A requested company/location not owned by tenant_id is rejected (ownership boundary).
  it("rejects requested company/location not belonging to tenant_id via the ownership boundary", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Privileged caller so the requested filter reaches the ownership check.
        fc.record({
          tenant_id: idArb,
          company_id: fc.option(idArb, { nil: undefined }),
          location_id: fc.option(idArb, { nil: undefined }),
          role: fc.constantFrom(...PRIVILEGED_ROLES),
          user_id: idArb,
        }),
        fc.record({
          location_id: requestedIdArb,
          company_id: requestedIdArb,
        }),
        // Whether the mocked DB considers the requested ids owned by the tenant.
        fc.boolean(),
        async (ctxRecord, requested, owned) => {
          const ctx = ctxRecord as unknown as TenantContext;

          // Mocked Prisma boundary: ownership decided solely by `owned`.
          const prismaMock = {
            companies: {
              findFirst: async () => (owned ? { id: requested.company_id } : null),
            },
            locations: {
              findFirst: async () => (owned ? { id: requested.location_id } : null),
            },
          };

          const resolver = new TenantScopeResolver(prismaMock as any);

          if (!owned) {
            // Foreign company/location must be rejected with a Forbidden error.
            await expect(resolver.resolve(ctx, requested)).rejects.toBeInstanceOf(
              ForbiddenException,
            );
          } else {
            const scope = await resolver.resolve(ctx, requested);
            // Effective tenant_id is still the context tenant_id.
            expect(scope.tenant_id).toBe(ctx.tenant_id);
            // company_id, when present, is never equal to tenant_id.
            if (scope.company_id !== undefined) {
              expect(scope.company_id).not.toBe(scope.tenant_id);
            }
            // Owned requested filters are honored for the privileged caller.
            expect(scope.location_id).toBe(requested.location_id);
            expect(scope.company_id).toBe(requested.company_id);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
