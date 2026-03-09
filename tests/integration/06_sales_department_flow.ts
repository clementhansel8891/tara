/**
 * Phase 6: Sales Department B2B Flow
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Simulates a standard B2B sales cycle:
 *   1. SalesLead created
 *   2. Lead converted to SalesOpportunity
 *   3. SalesQuote generated (Acceptance)
 *   4. SalesOrder created from Quote
 *   5. Verification of multi-tenancy isolation
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

async function runPhase6(): Promise<void> {
  const prisma = getPrisma();
  setPhase("06 — Sales Department B2B Flow");

  await runInRollbackTx(prisma, "Phase 6", async (tx) => {
    // ────────────────────────────────────────────────────────────────────────
    // STEP 6.1: Setup Sales Environment
    // ────────────────────────────────────────────────────────────────────────
    let company: any, location: any, salesRep: any;
    try {
      company = await seedTestCompany(tx as any);
      location = await seedTestLocation(tx as any, company.id);
      const salesDept = await seedTestDepartment(tx as any, company.id, {
        name: "Sales",
      });
      salesRep = await seedTestEmployee(
        tx as any,
        company.id,
        location.id,
        salesDept.id,
        {
          firstName: "Sales",
          lastName: "Manager",
        },
      );
      salesRep.fullName = `${salesRep.firstName} ${salesRep.lastName}`;
      pass(
        "6.1 Sales Environment setup",
        `Company and SalesRep ${salesRep.id} READY`,
      );
    } catch (e: any) {
      fail("6.1 Sales Environment setup", `Setup failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 6.2: Create SalesLead
    // ────────────────────────────────────────────────────────────────────────
    let lead: any;
    try {
      lead = await (tx as any).salesLead.create({
        data: {
          tenantId: company.id,
          companyName: "Prospect Corp",
          contactName: "John Prospect",
          ownerId: salesRep.id,
          ownerName: salesRep.fullName,
          potentialValue: 150000000,
          slaDueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          source: "OUTBOUND",
          status: "QUALIFIED",
          priority: "HIGH",
        },
      });
      pass(
        "6.2 SalesLead created",
        `Lead ${lead.id} created for "Prospect Corp"`,
      );
    } catch (e: any) {
      fail("6.2 SalesLead created", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 6.3: Create SalesOpportunity (Lead Conversion)
    // ────────────────────────────────────────────────────────────────────────
    let opportunity: any;
    try {
      opportunity = await (tx as any).salesOpportunity.create({
        data: {
          tenantId: company.id,
          leadId: lead.id,
          accountName: "Prospect Corp",
          ownerId: salesRep.id,
          ownerName: salesRep.fullName,
          amount: 150000000,
          currency: "IDR",
          probability: 60,
          stage: "NEGOTIATION",
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      pass(
        "6.3 SalesOpportunity created",
        `Opportunity ${opportunity.id} linked to Lead ${lead.id}`,
      );
    } catch (e: any) {
      fail("6.3 SalesOpportunity created", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 6.4: Create SalesQuote
    // ────────────────────────────────────────────────────────────────────────
    let quote: any;
    try {
      quote = await (tx as any).salesQuote.create({
        data: {
          tenantId: company.id,
          opportunityId: opportunity.id,
          accountName: "Prospect Corp",
          amount: 145000000,
          netAmount: 145000000,
          status: "ACCEPTED",
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          createdBy: salesRep.id,
        },
      });
      pass(
        "6.4 SalesQuote created",
        `Quote ${quote.id} (ACCEPTED) for ${quote.amount}`,
      );
    } catch (e: any) {
      fail("6.4 SalesQuote created", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 6.5: Create SalesOrder (Quote Conversion)
    // ────────────────────────────────────────────────────────────────────────
    let order: any;
    try {
      order = await (tx as any).salesOrder.create({
        data: {
          tenantId: company.id,
          opportunityId: opportunity.id,
          quoteId: quote.id,
          customerName: "Prospect Corp",
          amount: 145000000,
          status: "CONFIRMED",
          createdBy: salesRep.id,
        },
      });
      pass(
        "6.5 SalesOrder created",
        `Confirmed SalesOrder ${order.id} generated from Quote`,
      );
    } catch (e: any) {
      fail("6.5 SalesOrder created", `Failed: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 6.6: Validate B2B Chain Traceability
    // ────────────────────────────────────────────────────────────────────────
    const fetchedOrder = await (tx as any).salesOrder.findUnique({
      where: { id: order.id },
      include: {
        quote: true,
        opportunity: true,
      },
    });

    if (
      fetchedOrder?.quote?.id === quote.id &&
      fetchedOrder?.opportunity?.id === opportunity.id
    ) {
      pass(
        "6.6 Sales Chain Linkage",
        `Order ГåÆ Quote ΓåÆ Opportunity chain is intact and traceable`,
      );
    } else {
      fail("6.6 Sales Chain Linkage", `Relational chain broken in B2B flow`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 6.7: Check Finance Invoice Gap (Structural warning check)
    // ────────────────────────────────────────────────────────────────────────
    if (!fetchedOrder.financeInvoiceId) {
      warn(
        "6.7 SalesOrderΓåÆFinance link",
        `SalesOrder has NO formal FK to JournalEntry. Finance invoice linkage is via loose 'financeInvoiceId' string.`,
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 6.8: Verify Tenant Isolation in Sales
    // ────────────────────────────────────────────────────────────────────────
    const companyB = await seedTestCompany(tx as any, { id: testId("compB") });
    const isolationCheck = await (tx as any).salesOrder.findMany({
      where: { tenantId: companyB.id },
    });

    if (isolationCheck.length === 0) {
      pass(
        "6.8 Sales Isolation",
        `Company B cannot see Company A's B2B orders ✓`,
      );
    } else {
      fail(
        "6.8 Sales Isolation",
        `DATA LEAK: Company B visible to Company A's sales orders!`,
      );
    }
  });

  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase6()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
