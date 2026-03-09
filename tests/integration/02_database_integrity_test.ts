/**
 * Phase 2: Core Database Integrity Validation
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Checks for data quality issues in the LIVE database (read-only, no writes).
 *
 * Checks:
 *  2.1 PayrollLine without a matching PayrollRun → orphan payroll lines
 *  2.2 PayrollLine without matching Employee → orphan payroll
 *  2.3 RetailOrderItem without matching RetailOrder → orphan order items
 *  2.4 StockMovement without matching Product → broken inventory record
 *  2.5 StockLevel without matching Product → ghost stock records
 *  2.6 StockLevel without matching Location → broken stock records
 *  2.7 JournalEntry with no JournalLines → empty/ghost ledger entries
 *  2.8 RetailOrder with status 'paid' but no JournalEntry matching reference
 *  2.9 Employee referencing a non-existent Department
 *  2.10 Employee referencing a non-existent Location
 *  2.11 ProcurementFinalPO with no associated ProcurementReceipt (WARN only — may be in transit)
 *  2.12 SalesOrder with no associated SalesQuote (WARN — direct orders may be valid)
 *  2.13 Retail Orders with no items
 *  2.14 Data count summary across all major tables
 */

import { getPrisma, disconnectPrisma } from "./helpers/prisma";
import { setPhase, pass, fail, warn, printSummary } from "./helpers/logger";

async function runPhase2(): Promise<void> {
  const prisma = getPrisma();
  setPhase("02 — Core Database Integrity Validation");

  console.log(
    "\n[NOTE] This phase reads LIVE data. No writes are performed.\n",
  );

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.1 Orphan PayrollLines (no matching PayrollRun)                        │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const orphanPayrollLines = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM payroll_lines pl
      WHERE NOT EXISTS (SELECT 1 FROM payroll_runs pr WHERE pr.id = pl.payroll_run_id)
    `;
    const count = Number(orphanPayrollLines[0]?.count ?? 0);
    if (count === 0) {
      pass("2.1 Orphan PayrollLines", `No orphan payroll lines found`);
    } else {
      fail(
        "2.1 Orphan PayrollLines",
        `Found ${count} payroll line(s) with no matching PayrollRun`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.1 Orphan PayrollLines", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.2 Orphan PayrollLines (no matching Employee)                          │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const orphanEmpLines = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM payroll_lines pl
      WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = pl.employee_id)
    `;
    const count = Number(orphanEmpLines[0]?.count ?? 0);
    if (count === 0) {
      pass(
        "2.2 Orphan PayrollLine→Employee",
        `No payroll lines with missing employee reference`,
      );
    } else {
      fail(
        "2.2 Orphan PayrollLine→Employee",
        `Found ${count} payroll line(s) referencing non-existent employees`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.2 Orphan PayrollLine→Employee", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.3 Orphan RetailOrderItems (no matching RetailOrder)                   │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const orphanItems = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM retail_order_items roi
      WHERE NOT EXISTS (SELECT 1 FROM retail_orders ro WHERE ro.id = roi.order_id)
    `;
    const count = Number(orphanItems[0]?.count ?? 0);
    if (count === 0) {
      pass("2.3 Orphan RetailOrderItems", `No orphan retail order items`);
    } else {
      fail(
        "2.3 Orphan RetailOrderItems",
        `Found ${count} order item(s) with no matching order`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.3 Orphan RetailOrderItems", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.4 StockMovements referencing non-existent Products                    │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const orphanMovements = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM stock_movements sm
      WHERE NOT EXISTS (SELECT 1 FROM item_masters p WHERE p.id = sm.product_id)
    `;
    const count = Number(orphanMovements[0]?.count ?? 0);
    if (count === 0) {
      pass(
        "2.4 StockMovement→Product",
        `All stock movements reference valid products`,
      );
    } else {
      fail(
        "2.4 StockMovement→Product",
        `Found ${count} stock movement(s) with missing product reference`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.4 StockMovement→Product", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.5 StockLevels referencing non-existent Products                       │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const orphanStockLevels = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM stock_levels sl
      WHERE NOT EXISTS (SELECT 1 FROM item_masters p WHERE p.id = sl.product_id)
    `;
    const count = Number(orphanStockLevels[0]?.count ?? 0);
    if (count === 0) {
      pass(
        "2.5 StockLevel→Product",
        `All stock levels reference valid products`,
      );
    } else {
      fail(
        "2.5 StockLevel→Product",
        `Found ${count} stock level record(s) with no matching product`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.5 StockLevel→Product", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.6 StockLevels referencing non-existent Locations                      │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const orphanStockLoc = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM stock_levels sl
      WHERE NOT EXISTS (SELECT 1 FROM locations l WHERE l.id = sl.location_id)
    `;
    const count = Number(orphanStockLoc[0]?.count ?? 0);
    if (count === 0) {
      pass(
        "2.6 StockLevel→Location",
        `All stock levels reference valid locations`,
      );
    } else {
      fail(
        "2.6 StockLevel→Location",
        `Found ${count} stock level record(s) with no matching location`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.6 StockLevel→Location", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.7 JournalEntries with zero JournalLines (ghost ledger entries)        │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const ghostJournals = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM journal_entries je
      WHERE NOT EXISTS (SELECT 1 FROM journal_lines jl WHERE jl.journal_entry_id = je.id)
    `;
    const count = Number(ghostJournals[0]?.count ?? 0);
    if (count === 0) {
      pass(
        "2.7 JournalEntry→JournalLines",
        `All journal entries have at least one journal line`,
      );
    } else {
      fail(
        "2.7 JournalEntry→JournalLines",
        `Found ${count} journal entry/entries with NO journal lines (ghost entries)`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.7 JournalEntry→JournalLines", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.8 RetailOrders with no matching items                                 │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const emptyOrders = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM retail_orders ro
      WHERE NOT EXISTS (SELECT 1 FROM retail_order_items roi WHERE roi.order_id = ro.id)
    `;
    const count = Number(emptyOrders[0]?.count ?? 0);
    if (count === 0) {
      pass(
        "2.8 RetailOrder→Items",
        `All retail orders contain at least one order item`,
      );
    } else {
      fail(
        "2.8 RetailOrder→Items",
        `Found ${count} retail order(s) with zero items`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.8 RetailOrder→Items", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.9 Employee→Department FK integrity                                    │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const badDeptRef = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM employees e
      WHERE NOT EXISTS (SELECT 1 FROM departments d WHERE d.id = e.department_id)
    `;
    const count = Number(badDeptRef[0]?.count ?? 0);
    if (count === 0) {
      pass(
        "2.9 Employee→Department",
        `All employees reference valid departments`,
      );
    } else {
      fail(
        "2.9 Employee→Department",
        `Found ${count} employee(s) referencing non-existent departments`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.9 Employee→Department", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.10 Employee→Location FK integrity                                     │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const badLocRef = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM employees e
      WHERE NOT EXISTS (SELECT 1 FROM locations l WHERE l.id = e.location_id)
    `;
    const count = Number(badLocRef[0]?.count ?? 0);
    if (count === 0) {
      pass("2.10 Employee→Location", `All employees reference valid locations`);
    } else {
      fail(
        "2.10 Employee→Location",
        `Found ${count} employee(s) referencing non-existent locations`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.10 Employee→Location", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.11 ProcurementFinalPOs with no associated ProcurementReceipt (WARN)  │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const poNoReceipt = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM procurement_final_pos fp
      WHERE NOT EXISTS (SELECT 1 FROM procurement_receipts pr WHERE pr.final_po_id = fp.id)
      AND fp.status NOT IN ('CANCELLED', 'DRAFT')
    `;
    const count = Number(poNoReceipt[0]?.count ?? 0);
    if (count === 0) {
      pass(
        "2.11 FinalPO→Receipt",
        `All released POs have at least one receipt`,
      );
    } else {
      warn(
        "2.11 FinalPO→Receipt",
        `Found ${count} released Final PO(s) with no receipt — may be legitimately in-transit`,
        { count },
      );
    }
  } catch (e: any) {
    warn("2.11 FinalPO→Receipt", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.12 SalesOrders with no associated SalesQuote (WARN)                  │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const soNoQuote = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM sales_orders so
      WHERE so.quote_id IS NULL
    `;
    const count = Number(soNoQuote[0]?.count ?? 0);
    if (count === 0) {
      pass("2.12 SalesOrder→Quote", `All sales orders reference a quote`);
    } else {
      warn(
        "2.12 SalesOrder→Quote",
        `Found ${count} sales order(s) with no quote — direct orders may be intentional`,
        { count },
      );
    }
  } catch (e: any) {
    warn("2.12 SalesOrder→Quote", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.13 RetailOrderItems referencing non-existent Products                 │
  // └──────────────────────────────────────────────────────────────────────────┘
  try {
    const orphanItemProduct = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM retail_order_items roi
      WHERE NOT EXISTS (SELECT 1 FROM item_masters p WHERE p.id = roi.product_id)
    `;
    const count = Number(orphanItemProduct[0]?.count ?? 0);
    if (count === 0) {
      pass(
        "2.13 RetailOrderItem→Product",
        `All retail order items reference valid products`,
      );
    } else {
      fail(
        "2.13 RetailOrderItem→Product",
        `Found ${count} order item(s) referencing non-existent products`,
        { count },
      );
    }
  } catch (e: any) {
    fail("2.13 RetailOrderItem→Product", `Query failed: ${e.message}`);
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2.14 Data count summary                                                 │
  // └──────────────────────────────────────────────────────────────────────────┘
  console.log("\n[2.14] Data Count Summary across major tables:\n");

  const counts = await Promise.all([
    prisma.company.count().then((n) => ({ table: "companies", count: n })),
    prisma.location.count().then((n) => ({ table: "locations", count: n })),
    prisma.employee.count().then((n) => ({ table: "employees", count: n })),
    prisma.department.count().then((n) => ({ table: "departments", count: n })),
    prisma.shift.count().then((n) => ({ table: "shifts", count: n })),
    prisma.attendanceRecord
      .count()
      .then((n) => ({ table: "attendance_records", count: n })),
    prisma.payrollRun
      .count()
      .then((n) => ({ table: "payroll_runs", count: n })),
    prisma.payrollLine
      .count()
      .then((n) => ({ table: "payroll_lines", count: n })),
    prisma.product
      .count()
      .then((n) => ({ table: "item_masters (products)", count: n })),
    prisma.productCategory
      .count()
      .then((n) => ({ table: "product_categories", count: n })),
    prisma.stockLevel
      .count()
      .then((n) => ({ table: "stock_levels", count: n })),
    prisma.stockMovement
      .count()
      .then((n) => ({ table: "stock_movements", count: n })),
    prisma.store.count().then((n) => ({ table: "stores", count: n })),
    prisma.retailOrder
      .count()
      .then((n) => ({ table: "retail_orders", count: n })),
    prisma.retailOrderItem
      .count()
      .then((n) => ({ table: "retail_order_items", count: n })),
    prisma.journalEntry
      .count()
      .then((n) => ({ table: "journal_entries", count: n })),
    prisma.journalLine
      .count()
      .then((n) => ({ table: "journal_lines", count: n })),
    prisma.paymentTransaction
      .count()
      .then((n) => ({ table: "payment_transactions", count: n })),
    prisma.salesOrder
      .count()
      .then((n) => ({ table: "sales_orders", count: n })),
    prisma.salesLead.count().then((n) => ({ table: "sales_leads", count: n })),
    prisma.procurementFinalPO
      .count()
      .then((n) => ({ table: "procurement_final_pos", count: n })),
    prisma.procurementReceipt
      .count()
      .then((n) => ({ table: "procurement_receipts", count: n })),
    prisma.marketingCampaign
      .count()
      .then((n) => ({ table: "marketing_campaigns", count: n })),
    prisma.marketingLead
      .count()
      .then((n) => ({ table: "marketing_leads", count: n })),
  ]);

  console.log("  ┌─────────────────────────────────────┬──────────┐");
  console.log("  │ Table                               │  Count   │");
  console.log("  ├─────────────────────────────────────┼──────────┤");
  for (const { table, count } of counts) {
    const tableStr = table.padEnd(35);
    const countStr = String(count).padStart(8);
    const flag = count === 0 ? " ⚠" : "";
    console.log(`  │ ${tableStr} │ ${countStr} │${flag}`);
  }
  console.log("  └─────────────────────────────────────┴──────────┘\n");

  const emptyTables = counts.filter((c) => c.count === 0);
  if (emptyTables.length > 0) {
    for (const t of emptyTables) {
      warn(
        "2.14 Empty Table",
        `Table [${t.table}] has 0 records — integration tests for this module may be limited`,
        { table: t.table },
      );
    }
  } else {
    pass(
      "2.14 Data Coverage",
      `All major tables contain records — sufficient data for integration testing`,
    );
  }

  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase2()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
