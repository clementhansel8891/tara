
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Roles } from "@/core/security/roles";
import type { SessionContext } from "@/core/security/session";
import { paymentService } from "./paymentService";

// ─── Mock the HTTP layer ──────────────────────────────────────────────────────
vi.mock("@/core/api/apiClient", () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public message: string, public status: number, public data: any = null) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

import { apiRequest } from "@/core/api/apiClient";
import { ApiError } from "@/core/api/apiClient";

// ─── Session (snake_case per SessionContext) ──────────────────────────────────
const tenantId = "tenant-payment-test";
const session: SessionContext = {
  user_id: "payment-ops",
  tenant_id: tenantId,
  role: Roles.SUPERADMIN,
  department_id: "FINANCE",
  location_id: "LOC-HQ",
  permissions: [],
};

const mockOnce = (value: unknown) => (apiRequest as any).mockResolvedValueOnce(value);

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("paymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an execution request", async () => {
    const txId = "tx-vendor-001";
    mockOnce({ id: txId, status: "PENDING", type: "VENDOR_PAYOUT", amount: 1_000_000 });

    const first = await paymentService.createExecutionRequest(tenantId, session, {
      type: "VENDOR_PAYOUT",
      amount: 1_000_000,
      destination: "PT Vendor One",
    });
    expect(first.id).toBe(txId);
    expect(first.status).toBe("PENDING");
    expect(apiRequest).toHaveBeenCalledOnce();
  });

  it("completes approval → routing → execution → settlement and generates evidence", async () => {
    const txId = "tx-treasury-001";

    // Step 1: Create
    mockOnce({ id: txId, status: "PENDING", type: "TREASURY_TRANSFER", amount: 2_500_000 });
    const created = await paymentService.createExecutionRequest(tenantId, session, {
      type: "TREASURY_TRANSFER",
      amount: 2_500_000,
      destination: "Branch Treasury",
      channel: "BANK_TRANSFER",
    });
    expect(created.id).toBe(txId);

    // Step 2: Approve
    mockOnce({ id: txId, status: "APPROVED" });
    await paymentService.approveRequest(tenantId, session, created.id);

    // Step 3: Select provider / route
    mockOnce({ id: txId, status: "ROUTED", provider_id: "BCA" });
    await paymentService.selectProvider(tenantId, session, created.id);

    // Step 4: Execute
    mockOnce({ id: txId, status: "SETTLEMENT_PENDING" });
    const executed = await paymentService.executePayment(tenantId, session, created.id);
    expect(executed.status).toBe("SETTLEMENT_PENDING");

    // Step 5: Confirm settlement
    mockOnce({
      id: txId,
      status: "SETTLED",
      ledgerSyncTriggeredAt: new Date().toISOString(),
    });
    const settled = await paymentService.confirmSettlement(tenantId, session, created.id);
    expect(settled.status).toBe("SETTLED");
    expect(settled.ledgerSyncTriggeredAt).toBeTruthy();

    // Step 6: List evidence packs
    mockOnce([{ id: "ep-001", paymentId: txId, attachments: [] }]);
    const evidence = await paymentService.listEvidencePacks(tenantId, session);
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0]?.paymentId).toBe(created.id);
  });

  it("creates chargeback when dispute is resolved", async () => {
    const settledTxId = "tx-settled-001";

    // List transactions — find a SETTLED one
    mockOnce([
      { id: "tx-other", status: "PENDING" },
      { id: settledTxId, status: "SETTLED", amount: 500_000 },
    ]);
    const transactions = await paymentService.listTransactions(tenantId, session);
    const seedPayment = transactions.find((item) => item.status === "SETTLED");
    expect(seedPayment).toBeTruthy();

    // Open dispute
    const disputeId = "dispute-001";
    mockOnce({ id: disputeId, payment_id: seedPayment!.id, status: "OPEN", amount: 100_000 });
    const dispute = await paymentService.openDispute(tenantId, session, {
      paymentId: seedPayment!.id,
      amount: 100_000,
      reason: "Unauthorized charge",
    });
    expect(dispute.id).toBe(disputeId);

    // Attach evidence
    mockOnce({ id: disputeId, status: "OPEN", evidence: ["slip-001"] });
    await paymentService.attachDisputeEvidence(tenantId, session, dispute.id, "slip-001");

    // Progress dispute
    mockOnce({ id: disputeId, status: "PROVIDER_SUBMITTED" });
    await paymentService.progressDispute(tenantId, session, dispute.id, "PROVIDER_SUBMITTED");

    // Resolve dispute
    mockOnce({ id: disputeId, status: "RESOLVED", resolution: "WON" });
    await paymentService.resolveDispute(tenantId, session, dispute.id, "WON");

    // List chargebacks
    mockOnce([{ id: "cb-001", disputeId: dispute.id, amount: 100_000 }]);
    const chargebacks = await paymentService.listChargebacks(tenantId, session);
    expect(chargebacks.length).toBeGreaterThan(0);
    expect(chargebacks[0]?.disputeId).toBe(dispute.id);
  });

  it("lists providers, routing policies, and settlement records", async () => {
    // listProviders
    mockOnce([
      { id: "BCA", name: "BCA", status: "ONLINE" },
      { id: "MANDIRI", name: "Mandiri", status: "ONLINE" },
    ]);
    const providers = await paymentService.listProviders(tenantId, session);
    expect(providers.length).toBeGreaterThan(0);

    // listRoutingPolicies
    mockOnce([{ id: "policy-1", name: "Default Policy" }]);
    const policies = await paymentService.listRoutingPolicies(tenantId, session);
    expect(policies.length).toBeGreaterThan(0);

    // listSettlements
    mockOnce([{ id: "settlement-1", amount: 10_000_000, status: "SETTLED" }]);
    const settlements = await paymentService.listSettlements(tenantId, session);
    expect(settlements.length).toBeGreaterThan(0);
  });

  it("creates and processes refund", async () => {
    const paymentId = "tx-001";
    const refundId = "refund-001";

    // createRefund
    mockOnce({ id: refundId, payment_id: paymentId, status: "PENDING", amount: 250_000 });
    const refund = await paymentService.createRefund(tenantId, session, {
      paymentId,
      type: "FULL",
      amount: 250_000,
      reason: "Customer returned goods",
    });
    expect(refund.id).toBe(refundId);
    expect(refund.status).toBe("PENDING");

    // approveRefund
    mockOnce({ id: refundId, status: "APPROVED" });
    const approved = await paymentService.approveRefund(tenantId, session, refundId);
    expect(approved.status).toBe("APPROVED");

    // executeRefund
    mockOnce({ id: refundId, status: "EXECUTED" });
    const executed = await paymentService.executeRefund(tenantId, session, refundId);
    expect(executed.status).toBe("EXECUTED");
  });

  it("runs provider health check and updates device status", async () => {
    // runProviderHealthCheck
    mockOnce([
      { id: "BCA", status: "ONLINE" },
      { id: "GOPAY", status: "DEGRADED" },
    ]);
    const providers = await paymentService.runProviderHealthCheck(tenantId, session);
    expect(providers.length).toBeGreaterThan(0);

    // setDeviceStatus
    mockOnce({ id: "device-001", status: "OFFLINE" });
    const device = await paymentService.setDeviceStatus(tenantId, session, "device-001", "OFFLINE");
    expect(device.status).toBe("OFFLINE");
  });
});
