/**
 * Preservation Property Tests — Retail Module Stabilization (service / contract / security layer)
 *
 * Property 2: Preservation — Existing Physical, Operational, Context, And Contract Behavior
 *   Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7, 3.8
 * Property 3: Preservation — Legacy E-Commerce Endpoint Compatibility
 *   Validates: Requirements 2.5, 3.6
 *
 * METHODOLOGY (observation-first): these tests capture the ACTUAL request contract and
 * outputs produced by the UNFIXED code (`isBugCondition` === false inputs) and assert them,
 * so they PASS on unfixed code and act as a regression fence for the fix (re-run in task 3.8).
 *
 * The retail service layer is a thin client over `apiRequest`. The observable, deterministic
 * "result" of these non-buggy operations is the request the client emits (path, method,
 * payload mapping, headers) plus the resolved response. We mock `apiRequest` to echo the
 * request, then assert the contract is exactly what the unfixed code produces.
 *
 * NOTE: server-side effects called out in the requirements — shift conflict rejection,
 * inventory updates, payment processing (3.3/3.4) — are enforced by the backend and are
 * out of scope for this frontend unit; the preserved surface here is the client contract
 * that drives them. Fleet-view store-list gating (3.8) is enforced in the backend
 * controller; the exported frontend security manifestation of privileged-role bypass
 * (`ensureTenant`) is preserved here, and the privileged-role UI predicate is covered in
 * the companion React preservation suite.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import type { SessionContext } from "@/core/security/session";

// Echo the request back so a resolved response is inspectable and the call args are captured.
vi.mock("@/core/api/apiClient", () => ({
  apiRequest: vi.fn(
    async (
      _path: string,
      _method: string,
      _session: unknown,
      body?: unknown,
      _headers?: unknown,
    ) => {
      if (body && typeof body === "object" && !(body instanceof FormData)) {
        return { id: "srv_generated_id", ...(body as Record<string, unknown>) };
      }
      return { id: "srv_generated_id", ok: true };
    },
  ),
  ApiError: class ApiError extends Error {},
}));

import { apiRequest } from "@/core/api/apiClient";
import { retailService } from "@/core/services/retail/retailService";
import { ecommerceHubService } from "@/core/services/retail/ecommerceHubService";
import { retailModule } from "@/modules/retail";
import { ensureTenant } from "@/core/security/session";
import { Roles, RoleList } from "@/core/security/roles";

const apiMock = apiRequest as unknown as ReturnType<typeof vi.fn>;

const session = {
  tenant_id: "tenant_1",
  user_id: "user_1",
  location_id: "loc_1",
  department_id: "dept_1",
  role: Roles.OWNER,
  permissions: [],
} as unknown as SessionContext;

// Convenience accessor for the first recorded apiRequest call.
const firstCall = () => apiMock.mock.calls[0] as [string, string, unknown, unknown, unknown];

beforeEach(() => {
  apiMock.mockClear();
});

// ============================================================
// PHYSICAL-STORE CRUD PRESERVATION (3.1, 3.2)
// ============================================================
describe("Preservation — physical-store CRUD contract (3.1, 3.2)", () => {
  const physicalType = fc.constantFrom("flagship", "satellite", "warehouse");

  const createStoreArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    code: fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
    locationId: fc.uuid(),
    managerId: fc.uuid(),
    inventoryPoolId: fc.uuid(),
    taxZone: fc.constantFrom("ID-JK", "ID-BD", "US-CA"),
    type: physicalType,
  });

  it("3.1 — createStore POSTs /v1/retail/stores mapping camelCase identity fields to snake_case", async () => {
    await fc.assert(
      fc.asyncProperty(createStoreArb, async (store) => {
        apiMock.mockClear();
        await retailService.createStore(session.tenant_id!, session, store as any);

        const [path, method, , body] = firstCall();
        const b = body as Record<string, unknown>;
        expect(path).toBe("/v1/retail/stores");
        expect(method).toBe("POST");
        // identity mapping preserved
        expect(b.location_id).toBe(store.locationId);
        expect(b.manager_id).toBe(store.managerId);
        expect(b.inventory_pool_id).toBe(store.inventoryPoolId);
        expect(b.tax_zone).toBe(store.taxZone);
        // physical type carried through unchanged
        expect(b.type).toBe(store.type);
        expect(b.name).toBe(store.name);
      }),
      { numRuns: 30 },
    );
  });

  const operationalConfigArb = fc.record({
    business_hours_template: fc.string({ minLength: 1, maxLength: 12 }),
    pos_device_limit: fc.integer({ min: 1, max: 50 }),
    self_checkout_enabled: fc.boolean(),
  });
  const supplyConfigArb = fc.record({
    default_inbound_warehouse_id: fc.uuid(),
    transfer_priority_policy: fc.constantFrom("speed", "cost", "balanced"),
  });
  const governanceArb = fc.record({
    license_status: fc.constantFrom("active", "expired", "frozen"),
    activation_source: fc.constantFrom("LAN-first", "Cloud"),
    compliance_level: fc.integer({ min: 0, max: 5 }),
    audit_frequency_tier: fc.constantFrom("standard", "high", "critical"),
  });

  const updateStoreArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    locationId: fc.uuid(),
    type: physicalType,
    status: fc.constantFrom("active", "frozen", "archived", "decommissioned"),
    operationalConfig: operationalConfigArb,
    supplyConfig: supplyConfigArb,
    governance: governanceArb,
  });

  it("3.2 — updateStore PUTs /v1/retail/stores/:id preserving all config blocks without data loss", async () => {
    await fc.assert(
      fc.asyncProperty(updateStoreArb, async (store) => {
        apiMock.mockClear();
        await retailService.updateStore(session.tenant_id!, session, store as any);

        const [path, method, , body] = firstCall();
        const b = body as Record<string, any>;
        expect(path).toBe(`/v1/retail/stores/${store.id}`);
        expect(method).toBe("PUT");
        expect(b.name).toBe(store.name);
        expect(b.location_id).toBe(store.locationId);
        expect(b.type).toBe(store.type);
        expect(b.status).toBe(store.status);

        // hierarchical config blocks survive the pick-and-clean mapping intact
        expect(b.operational_config).toEqual({
          business_hours_template: store.operationalConfig.business_hours_template,
          pos_device_limit: store.operationalConfig.pos_device_limit,
          self_checkout_enabled: store.operationalConfig.self_checkout_enabled,
        });
        expect(b.supply_config).toEqual({
          default_inbound_warehouse_id: store.supplyConfig.default_inbound_warehouse_id,
          transfer_priority_policy: store.supplyConfig.transfer_priority_policy,
        });
        expect(b.governance).toEqual({
          license_status: store.governance.license_status,
          activation_source: store.governance.activation_source,
          compliance_level: store.governance.compliance_level,
          audit_frequency_tier: store.governance.audit_frequency_tier,
        });
      }),
      { numRuns: 30 },
    );
  });
});

// ============================================================
// SHIFT / CHECKOUT PRESERVATION (3.3, 3.4)
// ============================================================
describe("Preservation — shift-open & checkout client contract (3.3, 3.4)", () => {
  it("3.3 — openShift POSTs /v1/retail/shifts/open with store_id, opening_cash, terminal_id", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.option(fc.string({ minLength: 1, maxLength: 12 }), { nil: undefined }),
        async (storeId, openingCash, terminalId) => {
          apiMock.mockClear();
          if (terminalId === undefined) {
            await retailService.openShift(session.tenant_id!, session, storeId, openingCash);
          } else {
            await retailService.openShift(
              session.tenant_id!,
              session,
              storeId,
              openingCash,
              terminalId,
            );
          }

          const [path, method, , body] = firstCall();
          expect(path).toBe("/v1/retail/shifts/open");
          expect(method).toBe("POST");
          expect(body).toEqual({
            store_id: storeId,
            opening_cash: openingCash,
            terminal_id: terminalId ?? "terminal-pos",
          });
        },
      ),
      { numRuns: 30 },
    );
  });

  const checkoutArb = fc.record({
    store_id: fc.uuid(),
    terminal_id: fc.uuid(),
    items: fc.array(
      fc.record({
        product_id: fc.uuid(),
        quantity: fc.integer({ min: 1, max: 5 }),
        unit_price: fc.integer({ min: 1, max: 1000 }),
      }),
      { minLength: 1, maxLength: 4 },
    ),
    payment_method: fc.constantFrom("cash", "card", "qr"),
    payment_received: fc.integer({ min: 0, max: 100_000 }),
    grand_total: fc.integer({ min: 0, max: 100_000 }),
    currency: fc.option(fc.constantFrom("IDR", "USD", "EUR"), { nil: undefined }),
  });

  it("3.4 — checkout POSTs /v1/retail/checkout, defaults currency to IDR, forwards idempotency header", async () => {
    await fc.assert(
      fc.asyncProperty(
        checkoutArb,
        fc.option(fc.uuid(), { nil: undefined }),
        async (data, idempotencyKey) => {
          apiMock.mockClear();
          // Drop the undefined currency key so the "default to IDR" path is exercised cleanly.
          const payload = { ...data } as Record<string, unknown>;
          if (payload.currency === undefined) delete payload.currency;

          await retailService.checkout(session.tenant_id!, session, payload as any, idempotencyKey);

          const [path, method, , body, headers] = firstCall();
          const b = body as Record<string, any>;
          expect(path).toBe("/v1/retail/checkout");
          expect(method).toBe("POST");
          expect(b.store_id).toBe(data.store_id);
          expect(b.terminal_id).toBe(data.terminal_id);
          expect(b.items).toEqual(data.items);
          expect(b.payment_method).toBe(data.payment_method);
          expect(b.grand_total).toBe(data.grand_total);
          expect(b.currency).toBe(data.currency ?? "IDR");

          if (idempotencyKey) {
            expect((headers as Record<string, string>)["x-idempotency-key"]).toBe(idempotencyKey);
          } else {
            expect(headers).toEqual({});
          }
        },
      ),
      { numRuns: 30 },
    );
  });
});

// ============================================================
// LEGACY E-COMMERCE ENDPOINT COMPATIBILITY — Property 3 (2.5, 3.6)
// ============================================================
describe("Property 3 — legacy ecommerce-hub endpoint compatibility (2.5, 3.6)", () => {
  it("3.6 — connector CRUD / key rotation / test target stable legacy paths and methods", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }),
          platform: fc.constantFrom("shopify", "woocommerce", "tokopedia", "shopee"),
          domain: fc.string({ minLength: 1, maxLength: 20 }).map((s) => `${s}.example.com`),
        }),
        async (id, payload) => {
          // create
          apiMock.mockClear();
          await ecommerceHubService.createConnector(session, payload as any);
          expect(firstCall().slice(0, 2)).toEqual(["/retail/ecommerce-hub/connectors", "POST"]);
          expect(firstCall()[3]).toEqual(payload);

          // update
          apiMock.mockClear();
          await ecommerceHubService.updateConnector(session, id, { status: "active" });
          expect(firstCall().slice(0, 2)).toEqual([
            `/retail/ecommerce-hub/connectors/${id}`,
            "PUT",
          ]);

          // delete
          apiMock.mockClear();
          await ecommerceHubService.deleteConnector(session, id);
          expect(firstCall().slice(0, 2)).toEqual([
            `/retail/ecommerce-hub/connectors/${id}`,
            "DELETE",
          ]);

          // rotate key
          apiMock.mockClear();
          await ecommerceHubService.rotateConnectorKey(session, id);
          expect(firstCall().slice(0, 2)).toEqual([
            `/retail/ecommerce-hub/connectors/${id}/rotate-key`,
            "POST",
          ]);

          // connection test
          apiMock.mockClear();
          await ecommerceHubService.testConnector(session, id);
          expect(firstCall().slice(0, 2)).toEqual([
            `/retail/ecommerce-hub/connectors/${id}/test`,
            "POST",
          ]);
        },
      ),
      { numRuns: 25 },
    );
  });

  it("3.6 — channel CRUD / credential rotation / revoke / connection-test target stable legacy paths", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom("DIRECT", "OWNED", "MARKETPLACE"),
        }),
        async (id, payload) => {
          apiMock.mockClear();
          await ecommerceHubService.createChannel(session, payload as any);
          expect(firstCall().slice(0, 2)).toEqual(["/retail/ecommerce-hub/channels", "POST"]);
          expect(firstCall()[3]).toEqual(payload);

          apiMock.mockClear();
          await ecommerceHubService.updateChannel(session, id, { status: "active" });
          expect(firstCall().slice(0, 2)).toEqual([
            `/retail/ecommerce-hub/channels/${id}`,
            "PUT",
          ]);

          apiMock.mockClear();
          await ecommerceHubService.deleteChannel(session, id);
          expect(firstCall().slice(0, 2)).toEqual([
            `/retail/ecommerce-hub/channels/${id}`,
            "DELETE",
          ]);

          apiMock.mockClear();
          await ecommerceHubService.rotateChannelCredentials(session, id);
          expect(firstCall().slice(0, 2)).toEqual([
            `/retail/ecommerce-hub/channels/${id}/rotate-credentials`,
            "POST",
          ]);

          apiMock.mockClear();
          await ecommerceHubService.revokeChannelCredentials(session, id);
          expect(firstCall().slice(0, 2)).toEqual([
            `/retail/ecommerce-hub/channels/${id}/revoke-credentials`,
            "POST",
          ]);

          apiMock.mockClear();
          await ecommerceHubService.testChannelConnection(session, id);
          expect(firstCall().slice(0, 2)).toEqual([
            `/retail/ecommerce-hub/channels/${id}/test-connection`,
            "POST",
          ]);
        },
      ),
      { numRuns: 25 },
    );
  });

  it("3.6 — list endpoints stay GET on the legacy collection paths", async () => {
    apiMock.mockClear();
    await ecommerceHubService.listConnectors(session);
    expect(firstCall().slice(0, 2)).toEqual(["/retail/ecommerce-hub/connectors", "GET"]);

    apiMock.mockClear();
    await ecommerceHubService.listChannels(session);
    expect(firstCall().slice(0, 2)).toEqual(["/retail/ecommerce-hub/channels", "GET"]);
  });
});

// ============================================================
// PAGE CONTRACT PRESERVATION (3.7)
// ============================================================
describe("Preservation — ModuleContract.getPages() contract (3.7)", () => {
  const baseline = retailModule.getPages({} as any);

  it("3.7 — exposes the full 30+ page set with stable ids, routes, and grouping", () => {
    expect(baseline.length).toBe(31);

    const expectedIds = [
      "workspace",
      "mgt-dashboard",
      "mgt-profile",
      "mgt-staff",
      "mgt-shifts",
      "mgt-ecommerce",
      "mgt-infrastructure",
      "mgt-orders",
      "mgt-pricing",
      "mgt-inventory",
      "mgt-devices",
      "mgt-audit",
      "mgt-schedule",
      "mgt-attendance",
      "mgt-admin",
      "mgt-prs",
      "mgt-portal",
      "mgt-logs",
      "mgt-workflow",
      "mgt-infra-map",
      "mgt-nexus-command",
      "mgt-workforce-compliance",
      "ops-gateway",
      "ops-cash-movement",
      "ops-pos",
      "ops-refund",
      "ops-opname",
      "ops-receiving",
      "ops-kiosk",
      "ops-shift-open",
      "ops-shift-close",
    ];
    expect(baseline.map((p) => p.id)).toEqual(expectedIds);

    for (const page of baseline) {
      expect(page.moduleId).toBe("retail");
      expect(page.route.startsWith("/m/retail")).toBe(true);
      expect(typeof page.icon).toBe("string");
      expect(page.icon.length).toBeGreaterThan(0);
      expect(["overview", "management", "operational"]).toContain(page.menuGroup);
      expect(Array.isArray(page.requiredPermissions)).toBe(true);
      expect(page.requiredPermissions.length).toBeGreaterThan(0);
      expect(typeof page.component).toBe("function");
    }
  });

  it("3.7 — page contract is independent of the supplied module config", () => {
    fc.assert(
      fc.property(fc.object(), (cfg) => {
        const pages = retailModule.getPages(cfg as any);
        expect(pages.map((p) => ({ id: p.id, route: p.route, group: p.menuGroup }))).toEqual(
          baseline.map((p) => ({ id: p.id, route: p.route, group: p.menuGroup })),
        );
      }),
      { numRuns: 20 },
    );
  });
});

// ============================================================
// PRIVILEGED-ROLE GATING BYPASS — security layer (3.8)
// ============================================================
describe("Preservation — privileged-role gating bypass at the security layer (3.8)", () => {
  const baseSession = {
    user_id: "u1",
    location_id: "loc_1",
    department_id: "d1",
    permissions: [],
  };

  it("3.8 — SUPERADMIN bypasses tenant gating for any tenant id", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), (ownTenant, otherTenant) => {
        const s = { ...baseSession, role: Roles.SUPERADMIN, tenant_id: ownTenant } as SessionContext;
        expect(() => ensureTenant(otherTenant, s)).not.toThrow();
        expect(() => ensureTenant(ownTenant, s)).not.toThrow();
      }),
      { numRuns: 25 },
    );
  });

  it("3.8 — non-privileged roles remain gated to their own tenant", () => {
    const nonSuper = RoleList.filter((r) => r !== Roles.SUPERADMIN);
    fc.assert(
      fc.property(fc.constantFrom(...nonSuper), fc.uuid(), fc.uuid(), (role, a, b) => {
        fc.pre(a !== b);
        const s = { ...baseSession, role, tenant_id: a } as SessionContext;
        expect(() => ensureTenant(b, s)).toThrow();
        expect(() => ensureTenant(a, s)).not.toThrow();
      }),
      { numRuns: 25 },
    );
  });
});
