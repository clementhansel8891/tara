/**
 * Structured test result logger.
 * Outputs PASS / FAIL / WARN with diagnostics to stdout.
 */

export type ResultLevel = "PASS" | "FAIL" | "WARN";

export interface TestResult {
  phase: string;
  test: string;
  level: ResultLevel;
  message: string;
  detail?: string | object;
}

const COLORS = {
  PASS: "\x1b[32m", // green
  FAIL: "\x1b[31m", // red
  WARN: "\x1b[33m", // yellow
  RESET: "\x1b[0m",
  DIM: "\x1b[2m",
  BOLD: "\x1b[1m",
};

const results: TestResult[] = [];
let _currentPhase = "UNKNOWN";

export function setPhase(name: string): void {
  _currentPhase = name;
  console.log(
    `\n${COLORS.BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  );
  console.log(`  PHASE: ${name}`);
  console.log(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.RESET}\n`,
  );
}

export function logResult(
  level: ResultLevel,
  test: string,
  message: string,
  detail?: string | object,
): void {
  const color = COLORS[level];
  const icon = level === "PASS" ? "✓" : level === "FAIL" ? "✗" : "⚠";
  const entry: TestResult = {
    phase: _currentPhase,
    test,
    level,
    message,
    detail,
  };
  results.push(entry);

  console.log(`  ${color}${icon} [${level}]${COLORS.RESET} ${test}`);
  console.log(`    ${COLORS.DIM}${message}${COLORS.RESET}`);

  if (detail) {
    const detailStr =
      typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
    console.log(`    ${COLORS.DIM}${detailStr}${COLORS.RESET}`);
  }
}

export function pass(test: string, message: string): void {
  logResult("PASS", test, message);
}

export function fail(
  test: string,
  message: string,
  detail?: string | object,
): void {
  logResult("FAIL", test, message, detail);
}

export function warn(
  test: string,
  message: string,
  detail?: string | object,
): void {
  logResult("WARN", test, message, detail);
}

export function printSummary(): {
  passed: number;
  failed: number;
  warned: number;
  hasCriticalFailure: boolean;
} {
  const passed = results.filter((r) => r.level === "PASS").length;
  const failed = results.filter((r) => r.level === "FAIL").length;
  const warned = results.filter((r) => r.level === "WARN").length;
  const hasCriticalFailure = failed > 0;

  console.log(
    `\n${COLORS.BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  );
  console.log(`  PHASE SUMMARY: ${_currentPhase}`);
  console.log(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.RESET}`,
  );
  console.log(`  ${COLORS.PASS}PASS: ${passed}${COLORS.RESET}`);
  console.log(`  ${COLORS.FAIL}FAIL: ${failed}${COLORS.RESET}`);
  console.log(`  ${COLORS.WARN}WARN: ${warned}${COLORS.RESET}`);
  console.log(
    `  Critical failure: ${hasCriticalFailure ? COLORS.FAIL + "YES" : COLORS.PASS + "NO"}${COLORS.RESET}\n`,
  );

  if (failed > 0) {
    console.log(`\n${COLORS.FAIL}${COLORS.BOLD}  FAILED TESTS:${COLORS.RESET}`);
    results
      .filter((r) => r.level === "FAIL")
      .forEach((r) => {
        console.log(
          `  ${COLORS.FAIL}✗ [${r.phase}] ${r.test}: ${r.message}${COLORS.RESET}`,
        );
        if (r.detail) console.log(`    ${JSON.stringify(r.detail)}`);
      });
  }

  return { passed, failed, warned, hasCriticalFailure };
}

export function getAllResults(): TestResult[] {
  return [...results];
}
