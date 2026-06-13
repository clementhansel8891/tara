import { describe, it, expect, vi } from "vitest";
import { HttpException } from "@nestjs/common";
import { HrSettlementService } from "./hr-settlement.service";

/**
 * Task 10.6 — Example/edge unit tests for the Phase 5 payroll lifecycle
 * (Requirements 10.4, 10.5).
 *
 * {@link HrSettlementService} is the canonical owner of the payroll
 * approve -> disburse -> settle lifecycle. These tests pin two behaviours per
 * the acceptance criteria:
 *
 *   (Req 10.5) Each transition only succeeds from its valid predecessor state:
 *     - approve:  DRAFT      -> APPROVED   (invalid status -> 400, missing -> 404)
 *     - disburse: APPROVED   -> DISBURSING (invalid status -> 400)
 *     - settle:   DISBURSING -> SETTLED    (invalid status -> 400)
 *     Invalid edges raise a NestJS `BadRequestException` whose HTTP status is
 *     exactly 400; a missing run raises `NotFoundException` (404).
 *
 *   (Req 10.4) A SETTLED run produces BALANCED Finance journal lines — the sum
 *     of debits equals the sum of credits (and is > 0 for a non-zero net). The
 *     disburse journal is asserted to balance too.
 *
 * The Prisma / repository / Finance / event / audit boundaries are mocked so
 * the test is fast, deterministic, and exercises only the service's own
 * lifecycle + journal-construction logic. Constructor order matches the source:
 * `new HrSettlementService(hrRepository, financeService, prisma, eventBus, auditService)`.
 */

const TENANT = "tnt-test";
const RUN_ID = "run-1";
const USER = "user-1";

type RunOverrides = Partial<{
  status: string;
  totalGrossPay: number;
  totalNetPay: number;
  baseCurrency: string;
}>;

function buildRun(overrides: RunOverrides = {}) {
  return {
    id: RUN_ID,
    tenant_id: TENANT,
    period_start: new Date("2024-01-01T00:00:00.000Z"),
    period_end: new Date("2024-01-31T00:00:00.000Z"),
    status: overrides.status ?? "DRAFT",
    totalGrossPay: overrides.totalGrossPay ?? 1000,
    totalNetPay: overrides.totalNetPay ?? 800,
    baseCurrency: overrides.baseCurrency ?? "USD",
    created_at: new Date("2024-01-01T00:00:00.000Z"),
    updated_at: new Date("2024-01-01T00:00:00.000Z"),
  };
}

/**
 * Build a service with all collaborators mocked. `run` is the payroll run the
 * repository returns (pass `null` to simulate not-found). Captures the journal
 * line-sets handed to FinanceService.createJournal so balancing can be asserted.
 */
function buildService(run: ReturnType<typeof buildRun> | null) {
  const capturedJournals: Array<{
    ref: string;
    lines: Array<{ accountCode: string; debit: number; credit: number }>;
  }> = [];

  // tx stub: companies.findFirst resolves the tenant's company (id + currency).
  const tx = {
    companies: {
      findFirst: vi.fn().mockResolvedValue({ id: "co-1", currency: "IDR" }),
    },
  };

  const prisma: any = {
    // Pass-through transaction: invoke the callback with the tx stub.
    $transaction: vi.fn(async (cb: (t: any) => any) => cb(tx)),
  };

  const hrRepository: any = {
    getPayrollRunById: vi.fn().mockResolvedValue(run),
    updatePayrollRun: vi.fn(
      async (_tenant: string, _id: string, data: any) => ({
        ...(run ?? {}),
        ...data,
      }),
    ),
  };

  const financeService: any = {
    createJournal: vi.fn(async (_ctx: any, journal: any) => {
      capturedJournals.push({ ref: journal.ref, lines: journal.lines });
      return { id: "je-1", ref: journal.ref };
    }),
  };

  const eventBus: any = { publish: vi.fn().mockResolvedValue(undefined) };
  const auditService: any = { log: vi.fn().mockResolvedValue(undefined) };

  const service = new HrSettlementService(
    hrRepository,
    financeService,
    prisma,
    eventBus,
    auditService,
  );

  return {
    service,
    capturedJournals,
    hrRepository,
    financeService,
    eventBus,
    auditService,
    tx,
  };
}

/** Assert the thrown error is an HttpException with the exact HTTP status. */
async function expectStatus(promise: Promise<unknown>, status: number) {
  let err: unknown;
  try {
    await promise;
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(HttpException);
  expect((err as HttpException).getStatus()).toBe(status);
}

function sum(lines: Array<{ debit: number; credit: number }>, key: "debit" | "credit") {
  return lines.reduce((acc, l) => acc + (Number(l[key]) || 0), 0);
}

describe("HrSettlementService — payroll lifecycle transitions (Req 10.5)", () => {
  describe("approvePayrollRun (DRAFT -> APPROVED)", () => {
    it("approves a run in DRAFT and writes APPROVED", async () => {
      const { service, hrRepository } = buildService(buildRun({ status: "DRAFT" }));

      const result = await service.approvePayrollRun(TENANT, RUN_ID, USER);

      expect(result.status).toBe("APPROVED");
      expect(hrRepository.updatePayrollRun).toHaveBeenCalledWith(
        TENANT,
        RUN_ID,
        expect.objectContaining({ status: "APPROVED" }),
        expect.anything(),
      );
    });

    it("rejects approving a run not in DRAFT with 400", async () => {
      const { service, hrRepository } = buildService(buildRun({ status: "APPROVED" }));

      await expectStatus(service.approvePayrollRun(TENANT, RUN_ID, USER), 400);
      expect(hrRepository.updatePayrollRun).not.toHaveBeenCalled();
    });

    it("returns 404 when the run does not exist", async () => {
      const { service } = buildService(null);

      await expectStatus(service.approvePayrollRun(TENANT, RUN_ID, USER), 404);
    });
  });

  describe("disbursePayrollRun (APPROVED -> DISBURSING)", () => {
    it("disburses a run in APPROVED, writes DISBURSING and posts a GL journal", async () => {
      const { service, hrRepository, financeService } = buildService(
        buildRun({ status: "APPROVED" }),
      );

      const result = await service.disbursePayrollRun(TENANT, RUN_ID, USER);

      expect(result.status).toBe("DISBURSING");
      expect(hrRepository.updatePayrollRun).toHaveBeenCalledWith(
        TENANT,
        RUN_ID,
        expect.objectContaining({ status: "DISBURSING" }),
        expect.anything(),
      );
      expect(financeService.createJournal).toHaveBeenCalledTimes(1);
    });

    it("rejects disbursing a run not in APPROVED with 400", async () => {
      const { service, financeService } = buildService(buildRun({ status: "DRAFT" }));

      await expectStatus(service.disbursePayrollRun(TENANT, RUN_ID, USER), 400);
      expect(financeService.createJournal).not.toHaveBeenCalled();
    });
  });

  describe("settlePayrollRun (DISBURSING -> SETTLED)", () => {
    it("settles a run in DISBURSING, writes SETTLED and emits the settlement event", async () => {
      const { service, hrRepository, eventBus } = buildService(
        buildRun({ status: "DISBURSING" }),
      );

      const result = await service.settlePayrollRun(TENANT, RUN_ID, USER);

      expect(result.status).toBe("SETTLED");
      expect(hrRepository.updatePayrollRun).toHaveBeenCalledWith(
        TENANT,
        RUN_ID,
        expect.objectContaining({ status: "SETTLED" }),
        expect.anything(),
      );
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
    });

    it("rejects settling a run not in DISBURSING with 400", async () => {
      const { service, eventBus } = buildService(buildRun({ status: "APPROVED" }));

      await expectStatus(service.settlePayrollRun(TENANT, RUN_ID, USER), 400);
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });
});

describe("HrSettlementService — Finance journals balance (Req 10.4)", () => {
  it("settle produces a BALANCED journal (sum debit === sum credit, > 0 for non-zero net)", async () => {
    const { service, capturedJournals } = buildService(
      buildRun({ status: "DISBURSING", totalGrossPay: 1000, totalNetPay: 800 }),
    );

    await service.settlePayrollRun(TENANT, RUN_ID, USER);

    const settleJournal = capturedJournals.find((j) => j.ref.startsWith("PAY-SETTLE-"));
    expect(settleJournal).toBeTruthy();
    const debit = sum(settleJournal!.lines, "debit");
    const credit = sum(settleJournal!.lines, "credit");
    expect(debit).toBe(credit);
    expect(debit).toBeGreaterThan(0);
  });

  it("disburse produces a BALANCED journal including the deductions leg", async () => {
    const { service, capturedJournals } = buildService(
      buildRun({ status: "APPROVED", totalGrossPay: 1000, totalNetPay: 800 }),
    );

    await service.disbursePayrollRun(TENANT, RUN_ID, USER);

    const disbJournal = capturedJournals.find((j) => j.ref.startsWith("PAY-DISB-"));
    expect(disbJournal).toBeTruthy();
    // DR 6200 gross 1000 / CR 1001 net 800 / CR 2100 deductions 200 -> balances.
    const debit = sum(disbJournal!.lines, "debit");
    const credit = sum(disbJournal!.lines, "credit");
    expect(debit).toBe(credit);
    expect(debit).toBe(1000);
  });

  it("disburse journal balances even when net === gross (no deductions leg)", async () => {
    const { service, capturedJournals } = buildService(
      buildRun({ status: "APPROVED", totalGrossPay: 500, totalNetPay: 500 }),
    );

    await service.disbursePayrollRun(TENANT, RUN_ID, USER);

    const disbJournal = capturedJournals.find((j) => j.ref.startsWith("PAY-DISB-"));
    expect(disbJournal).toBeTruthy();
    expect(sum(disbJournal!.lines, "debit")).toBe(sum(disbJournal!.lines, "credit"));
  });
});
