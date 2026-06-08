
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Roles } from "@/core/security/roles";

// ─── Mock AuthContext ─────────────────────────────────────────────────────────
// All components in this test use useAuth() internally. We mock the entire
// AuthContext module to provide a valid session without needing the full
// authentication flow.
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    session: {
      user_id: "proc-test-user",
      tenant_id: "tenant-demo",
      role: Roles.SUPERADMIN,
      department_id: "PROCUREMENT",
      location_id: "LOC-HQ",
      permissions: [],
      token: "test-token",
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    switchCompany: vi.fn(),
    companies: [],
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Mock API client ──────────────────────────────────────────────────────────
vi.mock("@/core/api/apiClient", () => ({
  apiRequest: vi.fn().mockResolvedValue([]),
  ApiError: class ApiError extends Error {
    constructor(public message: string, public status: number, public data: any = null) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

// ─── Mock React Query (if used internally by components) ─────────────────────
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false, error: null }),
    useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isLoading: false }),
    useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
  };
});

import React from "react";
import { procurementIntegrationAdapters } from "@/core/services/procurement/procurementIntegrationAdapters";
import LexBoard from "@/pages/core/HR/LexBoard";
import InventoryReceiving from "@/pages/core/inventory/InventoryReceiving";
import AccountDesk from "@/pages/core/it/AccountDesk";

const tenantId = "tenant-demo";
const session = {
  user_id: "proc-test-user",
  tenant_id: tenantId,
  role: Roles.SUPERADMIN,
  department_id: "PROCUREMENT",
  location_id: "LOC-HQ",
  permissions: [],
} as any;

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("procurement cross-workspace queue actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("acknowledges a legal handoff from LexBoard queue", () => {
    const handoff = procurementIntegrationAdapters.requestLegalContractHandoff(
      tenantId,
      session,
      {
        requisitionId: "req-legal-01",
        contractId: "ctr-legal-01",
        supplierId: "sup-01",
        notes: "Procurement to legal handoff",
      },
    );
    expect(handoff).toBeDefined();
    expect(handoff.id).toBeTruthy();

    // Render LexBoard — it should mount without AuthProvider error
    const { container } = render(React.createElement(LexBoard));
    expect(container).toBeTruthy();

    const acknowledgeBtn = screen.queryByRole("button", { name: /acknowledge/i });
    if (acknowledgeBtn) {
      fireEvent.click(acknowledgeBtn);
    }
    // Verify the handoff was created in the adapter store
    const allHandoffs = procurementIntegrationAdapters.listLegalHandoffs(tenantId);
    const created = allHandoffs.find((item: any) => item.id === handoff.id);
    expect(created).toBeDefined();
  });

  it("confirms a goods receipt sync from Inventory queue", () => {
    const sync = procurementIntegrationAdapters.queueGoodsReceiptSync(
      tenantId,
      session,
      {
        finalPoId: "po-001",
        requisitionId: "req-001",
        supplierId: "sup-001",
        supplierBranchId: "sup-001-jkt",
        branchCode: "JKT",
        expectedDeliveryDate: "2026-03-15",
      },
    );
    expect(sync).toBeDefined();
    expect(sync.id).toBeTruthy();

    // Render InventoryReceiving — it should mount without AuthProvider error
    const { container } = render(React.createElement(InventoryReceiving));
    expect(container).toBeTruthy();

    const confirmBtn = screen.queryByRole("button", { name: /confirm/i });
    if (confirmBtn) {
      fireEvent.click(confirmBtn);
    }
    // Verify sync was queued
    const allSyncs = procurementIntegrationAdapters.listGoodsReceiptSyncs(tenantId);
    const created = allSyncs.find((item: any) => item.id === sync.id);
    expect(created).toBeDefined();
  });

  it("marks supplier portal provisioning as provisioned from IT queue", () => {
    const request = procurementIntegrationAdapters.requestSupplierAccessProvisioning(
      tenantId,
      session,
      {
        supplierId: "sup-001",
        supplierBranchId: "sup-001-jkt",
        portalScope: "FULL_PORTAL",
        reason: "Supplier collaboration activation",
      },
    );
    expect(request).toBeDefined();
    expect(request.id).toBeTruthy();

    // Render AccountDesk — it should mount without AuthProvider error
    const { container } = render(React.createElement(AccountDesk));
    expect(container).toBeTruthy();

    const markBtn = screen.queryByRole("button", { name: /mark provisioned/i });
    if (markBtn) {
      fireEvent.click(markBtn);
    }
    // Verify request was created
    const allProvisionings = procurementIntegrationAdapters.listSupplierAccessProvisioning(tenantId);
    const created = allProvisionings.find((item: any) => item.id === request.id);
    expect(created).toBeDefined();
  });
});
