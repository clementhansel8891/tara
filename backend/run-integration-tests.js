/**
 * Plain JS runner for integration tests.
 * Must be run from backend/ directory:
 *   node run-integration-tests.js [phase-number|all]
 *
 * Registers ts-node in CJS mode, then requires the phase test file.
 * This avoids the ESM conflict from the project root package.json.
 */

const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");

// Register ts-node globally so all require('.ts') calls work
require("ts-node").register({
  transpileOnly: true,
  project: path.resolve(__dirname, "tsconfig.json"),
});

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
];

const arg = process.argv[2] || "all";

function phaseExists(filename) {
  try {
    fs.accessSync(path.join(TESTS_DIR, filename));
    return true;
  } catch {
    return false;
  }
}

function runPhase(filename) {
  const filePath = path.join(TESTS_DIR, filename);
  console.log("\n" + "═".repeat(60));
  console.log(`  Running: ${filename}`);
  console.log("═".repeat(60) + "\n");

  try {
    // Each phase manages its own process.exit code via the logger.
    // We require() them in-process so they share the ts-node registration.
    require(filePath);
    return true;
  } catch (err) {
    if (err && err.message === "__ROLLBACK_SENTINEL__") {
      // Graceful rollback — not a failure
      return true;
    }
    console.error(`[ERROR] ${filename}:`, err.message || err);
    return false;
  }
}

if (arg === "all") {
  for (const phase of PHASES) {
    if (!phaseExists(phase)) {
      console.log(`  [SKIP] ${phase} — not yet generated`);
      continue;
    }
    const ok = runPhase(phase);
    if (!ok) {
      console.error(
        `\n🛑 [STOP] Critical failure in ${phase}. Halting execution.`,
      );
      process.exit(1);
    }
  }
  console.log("\n✅ All phases completed.\n");
} else {
  const match = PHASES.find((p) => p.startsWith(arg));
  if (!match) {
    console.error(`Unknown phase: ${arg}`);
    process.exit(1);
  }
  if (!phaseExists(match)) {
    console.error(`Phase file not found: ${match}`);
    process.exit(1);
  }
  runPhase(match);
}
