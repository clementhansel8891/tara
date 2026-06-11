/**
 * Bug Condition Exploration Tests — Retail Module Stabilization
 *
 * Property 1: Bug Condition — E-Commerce Registers As Virtual Branch And Actions Complete
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 * (encodes Expected Behavior 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8 — the same tests validate
 *  the fix in task 3.7 once they pass)
 *
 * METHODOLOGY: These tests encode `isBugCondition` from design.md across the two defect
 * families and assert the CORRECTED behavior. They are EXPECTED TO FAIL on the unfixed
 * code — each failure is a counterexample proving the bug exists.
 *
 *   Family A (E-Commerce Hierarchy defect):
 *     - registering e-commerce SHALL produce a RetailStore with type "ecommerce" that
 *       participates in the branch hierarchy, via a single unified entry point, and be
 *       distinguishable by a virtual type indicator.
 *   Family B (Functional Stability defect):
 *     - a UI/operational action SHALL fire a resolved API call, persist data, and surface
 *       feedback; and an empty configuration SHALL drive a guided onboarding CTA.
 *
 * Scoped PBT approach (per design): deterministic defects (type union, stubbed handlers,
 * missing entry points) are scoped to concrete failing cases for reproducibility;
 * e-commerce registration payloads are generated randomly across the valid input space.
 *
 * To keep the unfixed code loadable, expected-but-missing capabilities are asserted as
 * members of modules that already exist (namespace imports), so a missing member fails the
 * specific assertion rather than breaking the whole test module.
 *
 * DO NOT "fix" these tests or the production code here — task 1 only documents the failures.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import type { SessionContext } from "@/core/security/session";

// Echo the request body back as the "persisted" entity so that, AFTER the fix, a real
// registration/API call resolves to an inspectable result. On UNFIXED code the stubbed /
// missing code paths never reach this mock, which is exactly what surfaces the bug.
vi.mock("@/core/api/apiClient", () => ({
  apiRequest: vi.fn(async (path: string, _method: string, _session: unknown, body: any) => {
    if (body && typeof body === "object") {
      return { id: "generated_id", locationId: body.location_id ?? body.locationId, ...body };
    }
    return { id: "generated_id", ok: true };
  }),
  ApiError: class ApiError extends Error {},
}));

import { apiRequest } from "@/core/api/apiClient";
import { ecommerceHubService } from "@/core/services/retail/ecommerceHubService";
import { retailService } from "@/core/services/retail/retailService";
// Namespace imports of EXISTING modules: the fix is expected to add the members asserted
// below. A missing member is `undefined` (assertion fails) instead of a module-load error.
import * as RetailModel from "@/core/types/retail/retail";
import * as RetailContextModule from "@/pages/retail/context/RetailContext";

const session = {
  tenant_id: "tenant_1",
  user_id: "user_1",
  location_id: "loc_1",
  department_id: "dept_1",
} as unknown as SessionContext;

beforeEach(() => {
  (apiRequest as unknown as ReturnType<typeof vi.fn>).mockClear();
});

// ============================================================
// FAMILY A — E-Commerce Hierarchy Defect
// ============================================================
describe("Property 1 / Family A — e-commerce registers as a virtual branch in the hierarchy", () => {
  // Smart generator: valid e-commerce registration payloads across the input space.
  const ecommerceRegistrationArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
    platform: fc.constantFrom(
      "shopify",
      "woocommerce",
      "tokopedia",
      "shopee",
      "lazada",
      "tiktok",
      "custom",
    ),
    domain: fc.webFragments().map((f) => `${f || "shop"}.example.com`),
    locationId: fc.uuid(),
  });

  it("1.1/2.1 — for all valid registration inputs, the result is a RetailStore typed 'ecommerce' inside the hierarchy", async () => {
    await fc.assert(
      fc.asyncProperty(ecommerceRegistrationArb, async (payload) => {
        const register = (ecommerceHubService as any).registerEcommerceBranch;
        // Unified entry point that places e-commerce INSIDE the branch hierarchy.
        expect(typeof register).toBe("function");

        const store = await register(session, payload);

        // Expected Behavior 2.1: virtual branch typed "ecommerce".
        expect(store?.type).toBe("ecommerce");
        // Participates in the branch hierarchy (carries an identity / locationId like a branch)
        // rather than being a standalone entity that links TO branches via branchIds[].
        expect(store?.id ?? store?.locationId).toBeTruthy();
        expect(store?.branchIds).toBeUndefined();
      }),
      { numRuns: 25 },
    );
  });

  it("1.4/1.5/2.3 — exposes a single unified 'register e-commerce as branch' entry point", () => {
    // Today there are three competing subsystems (legacy stores, hub connectors, hub channels),
    // none of which registers e-commerce as a branch. Expected: exactly one unified entry point
    // that places the new e-commerce presence INSIDE the branch hierarchy.
    expect(typeof (ecommerceHubService as any).registerEcommerceBranch).toBe("function");
  });

  it("2.2/2.4 — e-commerce is recognizable as a virtual branch via a type-indicator helper", () => {
    // The store/branch list must render e-commerce with a clear physical-vs-virtual indicator.
    // Expected: shared hierarchy helpers that classify stores and label their type.
    expect(typeof (RetailModel as any).isVirtualBranch).toBe("function");
    expect((RetailModel as any).isVirtualBranch({ type: "ecommerce" })).toBe(true);
    expect((RetailModel as any).isVirtualBranch({ type: "flagship" })).toBe(false);

    expect(typeof (RetailModel as any).getStoreTypeLabel).toBe("function");
    expect(String((RetailModel as any).getStoreTypeLabel("ecommerce")).toLowerCase()).toContain(
      "commerce",
    );
  });
});

// ============================================================
// FAMILY B — Functional Stability Defect
// ============================================================
describe("Property 1 / Family B — UI/operational actions complete end-to-end with a resolved API call", () => {
  it("1.6/1.7/2.6/2.7 — syncInventory fires a resolved API call instead of returning a no-op stub", async () => {
    // Concrete, deterministic functional-stability defect: the handler currently returns
    // { success: true } without ever calling the backend (no persistence, no real work),
    // so the "Sync Inventory" action does not complete end-to-end.
    await retailService.syncInventory(session.tenant_id!, session, { locationId: "loc_1" });

    // Expected Behavior 2.6/2.7: the operation completes through a resolved API call.
    expect(apiRequest).toHaveBeenCalled();
    const calledPath = (apiRequest as any).mock.calls[0]?.[0];
    expect(String(calledPath)).toMatch(/retail|inventory|sync/i);
  });

  it("1.8/2.8 — empty configuration drives a guided onboarding call-to-action", () => {
    // When no stores/channels exist (isConfigured === false), a guided onboarding decision
    // must direct the user to create the first location. Expected: an onboarding helper that
    // consumes the configuration state (without touching the ref-based anti-loop logic).
    expect(typeof (RetailContextModule as any).shouldShowOnboarding).toBe("function");
    expect(
      (RetailContextModule as any).shouldShowOnboarding({
        stores: [],
        channels: [],
        isConfigured: false,
      }),
    ).toBe(true);
    expect(
      (RetailContextModule as any).shouldShowOnboarding({
        stores: [{ id: "s1" }],
        channels: [],
        isConfigured: true,
      }),
    ).toBe(false);
  });
});
