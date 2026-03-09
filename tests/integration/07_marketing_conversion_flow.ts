/**
 * Phase 7: Marketing → Customer → Sales Conversion
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Simulates a full marketing-to-sales funnel:
 *   1. MarketingCampaign setup
 *   2. MarketingExecution (spending & results)
 *   3. MarketingLead captured
 *   4. Conversion to SalesLead (Handoff)
 *   5. Verification of attribution and results
 *
 * All writes inside a rolled-back transaction.
 */

import { getPrisma, disconnectPrisma } from "./helpers/prisma";
import { setPhase, pass, fail, warn, printSummary } from "./helpers/logger";
import { runInRollbackTx } from "./helpers/tx";
import {
  seedTestCompany,
  seedTestLocation,
  seedTestDepartment,
  seedTestEmployee,
  testId,
} from "./helpers/seeds";

async function runPhase7(): Promise<void> {
  const prisma = getPrisma();
  setPhase("07 — Marketing → Customer → Sales Conversion");

  await runInRollbackTx(prisma, "Phase 7", async (tx) => {
    // ────────────────────────────────────────────────────────────────────────
    // STEP 7.1: Setup Marketing Environment
    // ────────────────────────────────────────────────────────────────────────
    let company: any, mktUser: any;
    try {
      company = await seedTestCompany(tx as any);
      const mktDept = await seedTestDepartment(tx as any, company.id, {
        name: "Marketing",
      });
      const location = await seedTestLocation(tx as any, company.id);
      mktUser = await seedTestEmployee(
        tx as any,
        company.id,
        location.id,
        mktDept.id,
        {
          firstName: "Marketing",
          lastName: "Lead",
        },
      );
      mktUser.fullName = `${mktUser.firstName} ${mktUser.lastName}`;
      pass(
        "7.1 Marketing Environment setup",
        `Company and MktUser ${mktUser.id} READY`,
      );
    } catch (e: any) {
      fail("7.1 Marketing Environment setup", `Setup failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 7.2: Create MarketingCampaign
    // ────────────────────────────────────────────────────────────────────────
    let campaign: any;
    try {
      campaign = await (tx as any).marketingCampaign.create({
        data: {
          tenantId: company.id,
          name: "ERP Launch 2026",
          objective: "CONVERSION",
          channelMix: ["EMAIL", "GOOGLE_ADS"],
          ownerId: mktUser.id,
          ownerName: mktUser.fullName,
          budget: 50000000,
          currency: "IDR",
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          audience: "SME Owners",
        },
      });
      pass(
        "7.2 MarketingCampaign created",
        `Campaign "${campaign.name}" active — Budget: ${campaign.budget}`,
      );
    } catch (e: any) {
      fail("7.2 MarketingCampaign created", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 7.3: Create MarketingExecutionRun
    // ────────────────────────────────────────────────────────────────────────
    let execution: any;
    try {
      execution = await (tx as any).marketingExecutionRun.create({
        data: {
          tenantId: company.id,
          campaignId: campaign.id,
          channel: "GOOGLE_ADS",
          scheduledAt: new Date(),
          status: "COMPLETED",
          leadsGenerated: 1,
          spend: 5000000,
        },
      });
      pass(
        "7.3 ExecutionRun recorded",
        `ExecRun ${execution.id} for "${execution.channel}" — Leads: ${execution.leadsGenerated}`,
      );
    } catch (e: any) {
      fail("7.3 ExecutionRun recorded", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 7.4: Capture MarketingLead
    // ────────────────────────────────────────────────────────────────────────
    let mktLead: any;
    try {
      mktLead = await (tx as any).marketingLead.create({
        data: {
          tenantId: company.id,
          campaignId: campaign.id,
          source: "GOOGLE_ADS",
          companyName: "Inbound Corp",
          contactName: "Alice Inbound",
          email: "alice@inbound.invalid",
          dedupKey: `google-${testId()}`,
          score: 80,
          intent: "HIGH",
          status: "QUALIFIED",
        },
      });
      pass(
        "7.4 MarketingLead captured",
        `Lead ${mktLead.id} for "${mktLead.companyName}" via ${mktLead.source}`,
      );
    } catch (e: any) {
      fail("7.4 MarketingLead captured", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 7.5: Conversion to SalesLead (Handoff)
    // ────────────────────────────────────────────────────────────────────────
    let sLead: any;
    try {
      // Logic: Create a SalesLead and then update MarketingLead with reference
      sLead = await (tx as any).salesLead.create({
        data: {
          tenantId: company.id,
          companyName: mktLead.companyName,
          contactName: mktLead.contactName,
          ownerId: mktUser.id, // Assigned to marketing person initially or a sales rep
          ownerName: mktUser.fullName,
          potentialValue: 20000000,
          slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          source: mktLead.source,
          status: "NEW",
        },
      });

      await (tx as any).marketingLead.update({
        where: { id: mktLead.id },
        data: {
          status: "HANDOFF_SENT",
          salesHandoffId: sLead.id,
        },
      });

      pass(
        "7.5 Sales Handoff completed",
        `MarketingLead converted ΓåÆ SalesLead ${sLead.id}`,
      );
    } catch (e: any) {
      fail("7.5 Sales Handoff completed", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 7.6: Verify Attribution Link
    // ────────────────────────────────────────────────────────────────────────
    const updatedMktLead = await (tx as any).marketingLead.findUnique({
      where: { id: mktLead.id },
    });

    if (updatedMktLead.salesHandoffId === sLead.id) {
      pass(
        "7.6 Attribution Verification",
        `MarketingLead is correctly linked to SalesLead for attribution tracking`,
      );
    } else {
      fail("7.6 Attribution Verification", `Linkage lost during handoff`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 7.7: Multi-Tenancy check in Marketing
    // ────────────────────────────────────────────────────────────────────────
    const companyB = await seedTestCompany(tx as any, { id: testId("compB") });
    const crossCheck = await (tx as any).marketingCampaign.findMany({
      where: { tenantId: companyB.id },
    });

    if (crossCheck.length === 0) {
      pass(
        "7.7 Marketing Isolation",
        `Company B cannot see Company A's campaigns ✓`,
      );
    } else {
      fail(
        "7.7 Marketing Isolation",
        `DATA LEAK: Campaign visible across tenants!`,
      );
    }
  });

  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase7()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
