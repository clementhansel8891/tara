/**
 * Master Integration Test Runner
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Executes all 9 phases of the enterprise integration test suite
 * in sequence. Each phase runs in its own process for clean isolation.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const phases = [
  "01_system_topology_test.ts",
  "02_database_integrity_test.ts",
  "03_hr_payroll_finance_chain.ts",
  "04_purchase_inventory_accounting_chain.ts",
  "05_pos_inventory_payment_finance.ts",
  "06_sales_department_flow.ts",
  "07_marketing_conversion_flow.ts",
  "08_multi_company_isolation.ts",
  "09_multi_channel_sales_test.ts",
];

console.log("====================================================");
console.log("   ZENVIX ENTERPRISE INTEGRATION MASTER RUNNER      ");
console.log("====================================================\n");

let totalPass = 0;
let totalFail = 0;

for (const phaseFile of phases) {
  const phaseNum = phaseFile.substring(0, 2);
  console.log(`Running Phase ${phaseNum}...`);

  try {
    execSync(`node run-integration-tests.js ${phaseNum}`, {
      stdio: "inherit",
      cwd: path.join(__dirname, "../backend"),
    });
    totalPass++;
  } catch (e) {
    console.error(`\n[FATAL] Phase ${phaseNum} FAILED!`);
    totalFail++;
  }
}

console.log("\n====================================================");
console.log("   MASTER TEST SUMMARY");
console.log("====================================================");
console.log(`TOTAL PHASES: ${phases.length}`);
console.log(`SUCCESS:      ${totalPass}`);
console.log(`FAILED:       ${totalFail}`);
console.log("====================================================\n");

if (totalFail > 0) {
  process.exit(1);
} else {
  console.log("ALL INTEGRATION PHASES PASSED SUCCESSFULLY!");
  process.exit(0);
}
