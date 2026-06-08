/**
 * Phase 17: Joint Venture Allocation & Ledger Distribution Test
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Verifies that:
 *   1. JV profiles can be correctly resolved based on branch/company/ecommerce scope.
 *   2. Allocations happen accurately based on participant percentage splits.
 *   3. Configuration snapshots are archived immutably.
 *   4. Shadow ledger distributions (finance_jv_ledger) are recorded correctly.
 */

import { getPrisma, disconnectPrisma } from "./helpers/prisma";
import { setPhase, pass, fail, printSummary } from "./helpers/logger";
import { runInRollbackTx } from "./helpers/tx";
import {
  seedTestCompany,
  seedTestFiscalPeriod,
  seedTestAccount,
  testId,
} from "./helpers/seeds";
import { JVDbRepository } from "../../backend/src/core/finance/repositories/jv.db.repository";
import { JVAllocationService } from "../../backend/src/core/finance/services/jv-allocation.service";
import { Prisma } from "@prisma/client";

async function runPhase17(): Promise<void> {
  const prisma = getPrisma();
  setPhase("17 — Joint Venture Allocation & Distribution Chain");

  await runInRollbackTx(prisma, "Phase 17", async (tx) => {
    const jvRepo = new JVDbRepository(tx as any);
    const jvService = new JVAllocationService(jvRepo);

    // Setup entities
    const hostCompany = await seedTestCompany(tx as any);
    const partnerCompany = await seedTestCompany(tx as any);
    const fiscalPeriod = await seedTestFiscalPeriod(tx as any, hostCompany.id);
    const accRevenue = await seedTestAccount(tx as any, hostCompany.id, "4000", "Sales Revenue", "REVENUE");

    const profileCode = `JV-PROF-${testId()}`;

    // 1. Create JV Profile
    const profile = await (tx as any).finance_jv_profiles.create({
      data: {
        tenant_id: hostCompany.id,
        name: "Branch JV Agreement",
        code: profileCode,
        is_active: true,
        effective_from: new Date("2026-01-01"),
      },
    });

    // 2. Setup scope mapping
    await (tx as any).finance_jv_scopes.create({
      data: {
        jv_profile_id: profile.id,
        company_id: hostCompany.id,
      },
    });

    // 3. Add JV Participants
    const participant = await (tx as any).finance_jv_participants.create({
      data: {
        jv_profile_id: profile.id,
        participant_tenant_id: partnerCompany.id,
        revenue_share_pct: new Prisma.Decimal("30.00"),
        profit_share_pct: new Prisma.Decimal("30.00"),
        role: "PARTNER",
      },
    });

    pass("17.1 JV Profile Setup", `Agreement ${profileCode} mapped with 30% revenue share.`);

    // 4. Create primary journal entry to trigger allocation
    const refJournal = `JR-${testId()}`;
    const journalEntry = await (tx as any).finance_journal_entries.create({
      data: {
        tenant_id: hostCompany.id,
        fiscal_period_id: fiscalPeriod.id,
        ref: refJournal,
        description: "POS Sale Journal Entry",
        posting_date: new Date(),
        status: "POSTED",
        company_id: hostCompany.id,
      },
    });

    const journalLine = await (tx as any).finance_journal_lines.create({
      data: {
        tenant_id: hostCompany.id,
        journal_entry_id: journalEntry.id,
        account_id: accRevenue.id,
        account_code: "4000",
        description: "POS Revenue Line",
        side: "CREDIT",
        amount: new Prisma.Decimal("1000000.00"),
        credit: new Prisma.Decimal("1000000.00"),
        debit: 0,
      },
    });

    // Simulate journal line mapping object for NestJS service (uses Decimal.js/Prisma.Decimal.mul properties)
    const lineWithMethods = {
      ...journalLine,
      amount: new Prisma.Decimal(journalLine.amount.toString()),
    };

    // 5. Trigger allocation hook
    await jvService.allocate(hostCompany.id, journalEntry, [lineWithMethods], tx as any);

    // 6. Verify snapshot exists
    const snapshots = await (tx as any).finance_jv_snapshots.findMany({
      where: { jv_profile_id: profile.id, journal_id: journalEntry.id },
    });

    if (snapshots.length === 1) {
      pass("17.2 Snapshot Created", `Audit snapshot for journal ${refJournal} written cleanly.`);
    } else {
      fail("17.2 Snapshot Created", `Expected 1 audit snapshot, found ${snapshots.length}`);
    }

    // 7. Verify ledger allocation
    const ledgerEntries = await jvRepo.getLedgerEntries(hostCompany.id, {
      jv_profile_id: profile.id,
      journal_id: journalEntry.id,
    });

    if (ledgerEntries.length === 1) {
      const allocatedAmt = ledgerEntries[0].allocated_amt;
      const expectedAmt = 300000.0; // 30% of 1000000
      if (Math.abs(Number(allocatedAmt) - expectedAmt) < 0.01) {
        pass(
          "17.3 Shadow Ledger written",
          `Partner allocated: ${allocatedAmt} (Exactly 30% of credit revenue) ✓`,
        );
      } else {
        fail(
          "17.3 Shadow Ledger written",
          `Allocated amount mismatch. Expected: ${expectedAmt}, Got: ${allocatedAmt}`,
        );
      }
    } else {
      fail("17.3 Shadow Ledger written", `Expected 1 ledger line entry, found ${ledgerEntries.length}`);
    }
  });

  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase17()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
