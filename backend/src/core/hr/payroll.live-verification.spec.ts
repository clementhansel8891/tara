import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../persistence/prisma.service";
import { HRDbRepository } from "./repositories/hr.db.repository";
import { HrSettlementService } from "./hr-settlement.service";
import { FinanceService } from "../finance/finance.service";
import { FinanceDbRepository } from "../finance/repositories/finance.db.repository";
import { AuditService } from "../../shared/audit/audit.service";
import { EventBusService } from "../../shared/events/event-bus.service";

/**
 * Task 10.6 — Live-DB verification test for Phase 5 (Payroll & Finance).
 *
 * Goal (Requirements 10.4, 10.5, 12.1, 12.2, 13.4): exercise the Phase 5 payroll
 * lifecycle write paths (`approvePayrollRun` -> `disbursePayrollRun` ->
 * `settlePayrollRun` on {@link HrSettlementService}, backed by
 * {@link HRDbRepository} and {@link FinanceService}) against the REAL database
 * using the live test tenant `tnt-3rlhko`, asserting the writes succeed with
 * **no missing column, invalid foreign key, or hardcoded identifier** — the exact
 * defect classes Requirement 12.2 says must be corrected before a phase is
 * complete. It also confirms that a SETTLED run produced balanced Finance
 * journal entries (Req 10.4) and that an invalid transition is rejected (Req 10.5).
 *
 * Connectivity model (identical to the Phase 1–4 live-DB verification tests):
 * - The connection string is read from the environment (`DATABASE_URL`), exactly
 *   as the running app does via `PrismaService` -> `PrismaClient`.
 * - The live production tenant `tnt-3rlhko` lives in the VPS production database.
 *   When this test runs in an environment whose `DATABASE_URL` does not point at
 *   a database containing that tenant (e.g. a local dev DB, or no DB at all), the
 *   suite SKIPS gracefully with a clear message rather than fabricating a pass.
 * - When the live DB IS reachable and the tenant exists, the suite runs for real
 *   and cleans up every record it creates (payroll run + finance journals +
 *   audit/event rows), scoped strictly to `tnt-3rlhko`.
 *
 * This is an integration/smoke test, not a property test.
 */

const LIVE_TENANT = "tnt-3rlhko";

interface ProbeResult {
  available: boolean;
  reason?: string;
  company_id?: string;
  currency?: string | null;
}

/**
 * Probe whether the live test tenant is reachable in the currently-configured
 * database, and that it has a company record (so currency resolution + the
 * Finance journal company FK can be satisfied). Returns availability plus the
 * seed company to use.
 */
async function probeLiveTenant(): Promise<ProbeResult> {
  if (!process.env.DATABASE_URL) {
    return { available: false, reason: "DATABASE_URL is not set" };
  }
  const prisma = new PrismaService();
  try {
    await prisma.$connect();
    const tenant = await prisma.tenants.findUnique({ where: { id: LIVE_TENANT } });
    if (!tenant) {
      return {
        available: false,
        reason: `tenant '${LIVE_TENANT}' not found in the connected database (DATABASE_URL points at a database without the live test tenant)`,
      };
    }
    const company = await prisma.companies.findFirst({
      where: { tenant_id: LIVE_TENANT },
      select: { id: true, currency: true },
    });
    if (!company) {
      return {
        available: false,
        reason: `tenant '${LIVE_TENANT}' has no company to resolve currency / satisfy Finance journal FKs`,
      };
    }
    return { available: true, company_id: company.id, currency: company.currency };
  } catch (e) {
    return {
      available: false,
      reason: `database connection failed: ${(e as Error).message.split("\n")[0]}`,
    };
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

// Resolve connectivity once, before the suite is registered, so we can report a
// true SKIP (not a false PASS) when the live DB / tenant is unavailable.
const probe = await probeLiveTenant();

if (!probe.available) {
  // eslint-disable-next-line no-console
  console.warn(
    `\n[Phase 5 live-DB verification] SKIPPED — ${probe.reason}.\n` +
      `  This test is structured to run against the live test tenant '${LIVE_TENANT}'.\n` +
      `  Point DATABASE_URL at a database containing that tenant to execute it for real.\n`,
  );
}

const describeLive = probe.available ? describe : describe.skip;

describeLive(
  "Phase 5 live-DB verification — payroll lifecycle write paths (tnt-3rlhko)",
  () => {
    let prisma: PrismaService;
    let repo: HRDbRepository;
    let auditService: AuditService;
    let service: HrSettlementService;

    const runMarker = randomUUID().slice(0, 8);
    const createdRunIds: string[] = [];
    const createdJournalRefs: string[] = [];

    beforeAll(async () => {
      prisma = new PrismaService();
      await prisma.$connect();
      repo = new HRDbRepository(prisma);
      auditService = new AuditService(prisma);
      const eventBus = new EventBusService(prisma);
      const financeRepository = new FinanceDbRepository(prisma);
      const financeService = new FinanceService(financeRepository);
      service = new HrSettlementService(
        repo,
        financeService,
        prisma,
        eventBus,
        auditService,
      );
    });

    afterAll(async () => {
      if (prisma) {
        // FK-safe cleanup, scoped strictly to the live tenant: journal lines ->
        // journal entries -> payroll run, plus best-effort audit/event sweep.
        for (const ref of createdJournalRefs) {
          const entries = await prisma.finance_journal_entries
            .findMany({ where: { tenant_id: LIVE_TENANT, ref } })
            .catch(() => [] as any[]);
          for (const entry of entries) {
            await prisma.finance_journal_lines
              .deleteMany({ where: { journal_entry_id: entry.id } })
              .catch(() => undefined);
          }
          await prisma.finance_journal_entries
            .deleteMany({ where: { tenant_id: LIVE_TENANT, ref } })
            .catch(() => undefined);
        }
        for (const id of createdRunIds) {
          await prisma.hr_payroll_runs
            .deleteMany({ where: { id, tenant_id: LIVE_TENANT } })
            .catch(() => undefined);
          await prisma.domain_events
            .deleteMany({ where: { entity_id: id, tenant_id: LIVE_TENANT } })
            .catch(() => undefined);
          await prisma.audit_logs
            .deleteMany({ where: { entity_id: id, tenant_id: LIVE_TENANT } })
            .catch(() => undefined);
        }
        auditService?.onModuleDestroy?.();
        await prisma.$disconnect().catch(() => undefined);
      }
    });

    async function createDraftRun() {
      const run = await repo.createPayrollRun(LIVE_TENANT, {
        period_start: new Date("2024-01-01T00:00:00.000Z"),
        period_end: new Date("2024-01-31T00:00:00.000Z"),
        status: "DRAFT",
        totalGrossPay: 1000,
        totalNetPay: 800,
        baseCurrency: probe.currency ?? "USD",
      } as any);
      createdRunIds.push(run.id);
      createdJournalRefs.push(`PAY-DISB-${run.id}`, `PAY-SETTLE-${run.id}`);
      return run;
    }

    it("approve -> disburse -> settle persists against the live DB with no missing-column / invalid-FK / hardcoded-id errors", async () => {
      let run: any;
      try {
        run = await createDraftRun();
      } catch (e) {
        throw new Error(
          `createPayrollRun failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
        );
      }
      expect(run.id).toBeTruthy();
      expect(run.tenant_id).toBe(LIVE_TENANT);

      const approved = await service.approvePayrollRun(LIVE_TENANT, run.id, "live-verify");
      expect(approved.status).toBe("APPROVED");

      const disbursed = await service.disbursePayrollRun(LIVE_TENANT, run.id, "live-verify");
      expect(disbursed.status).toBe("DISBURSING");

      const settled = await service.settlePayrollRun(LIVE_TENANT, run.id, "live-verify");
      expect(settled.status).toBe("SETTLED");

      // (Req 10.4) The settlement journal exists and balances (debit == credit).
      const settleEntries = await prisma.finance_journal_entries.findMany({
        where: { tenant_id: LIVE_TENANT, ref: `PAY-SETTLE-${run.id}` },
      });
      expect(settleEntries.length).toBeGreaterThan(0);
      const lines = await prisma.finance_journal_lines.findMany({
        where: { journal_entry_id: settleEntries[0].id },
      });
      const debit = lines.reduce((a: number, l: any) => a + (Number(l.debit) || 0), 0);
      const credit = lines.reduce((a: number, l: any) => a + (Number(l.credit) || 0), 0);
      expect(debit).toBe(credit);
      expect(debit).toBeGreaterThan(0);
    });

    it("rejects an invalid transition (settle while DRAFT) with a client error (400) live", async () => {
      const run = await createDraftRun();
      let status: number | undefined;
      try {
        await service.settlePayrollRun(LIVE_TENANT, run.id, "live-verify");
      } catch (e: any) {
        status = typeof e.getStatus === "function" ? e.getStatus() : undefined;
      }
      expect(status).toBe(400);
    });
  },
);
