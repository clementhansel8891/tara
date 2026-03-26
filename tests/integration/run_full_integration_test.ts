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
  "16_retail_pos_inventory_integration_test.ts",
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
    execSync(`npx ts-node -T tests/integration/${phaseFile}`, {
      stdio: "inherit",
      cwd: path.join(__dirname, "../../"),
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
