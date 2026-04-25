/**
 * Integration test runner shim — runs from the backend/ directory
 * where CJS module resolution works correctly for ts-node.
 *
 * Usage (from project root):
 *   cd backend && npx ts-node run-integration-tests.ts [phase]
 *
 * Examples:
 *   npx ts-node run-integration-tests.ts 01
 *   npx ts-node run-integration-tests.ts all
 */

import { execSync } from "child_process";
import path from "path";

const TESTS_DIR = path.resolve(__dirname, "..", "tests", "integration");

const PHASES = [
  "01_system_topology_test.ts",
  "02_database_integrity_test.ts",
  "03_hr_payroll_finance_chain.ts",
  "04_purchase_inventory_accounting_chain.ts",
  "05_pos_inventory_payment_finance.ts",
  "06_sales_department_flow.ts",
  "07_marketing_conversion_flow.ts",
  "08_multi_company_isolation.ts",
  "09_multi_channel_sales_test.ts",
  "10_financial_integrity_guard.ts",
  "11_financial_projections.ts",
  "12_financial_reporting.ts",
  "13_saas_isolation.ts",
  "14_consolidation_engine.ts",
  "15_inventory_subledger_costing_test.ts",
];

const arg = process.argv[2] ?? "all";

function runPhase(filename: string): boolean {
  const filePath = path.join(TESTS_DIR, filename);
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Running: ${filename}`);
  console.log(`${"═".repeat(60)}\n`);
  try {
    execSync(`npx ts-node "${filePath}"`, {
      stdio: "inherit",
      cwd: path.resolve(__dirname),
      env: { ...process.env },
    });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (arg === "all") {
    for (const phase of PHASES) {
      const phaseFile = path.join(TESTS_DIR, phase);
      // Skip phases that don't exist yet
      try {
        require("fs").accessSync(phaseFile);
      } catch {
        console.log(`  [SKIP] ${phase} — not yet generated`);
        continue;
      }
      const passed = runPhase(phase);
      if (!passed) {
        console.error(
          `\n🛑 [STOP] Critical failure in ${phase}. Halting execution.`,
        );
        process.exit(1);
      }
    }
    console.log("\n✅ All phases completed.\n");
  } else {
    // Run specific phase number
    const match = PHASES.find((p) => p.startsWith(arg));
    if (!match) {
      console.error(
        `Unknown phase: ${arg}. Available: ${PHASES.map((p) => p.slice(0, 2)).join(", ")}`,
      );
      process.exit(1);
    }
    runPhase(match);
  }
}

main().catch(console.error);
