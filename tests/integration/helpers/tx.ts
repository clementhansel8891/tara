/**
 * Transactional test runner wrapper.
 * Executes all test logic inside a Prisma transaction that is always rolled back.
 * This guarantees zero pollution of the production database.
 */
import { PrismaClient } from "@prisma/client";
import { fail } from "./logger";

type TransactionalTestFn = (
  tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
) => Promise<void>;

/**
 * Run a test function inside a rolled-back transaction.
 * The test body receives a Prisma transaction context `tx`.
 * After the test function completes (or throws), the transaction is rolled back.
 *
 * @param prisma  The PrismaClient instance
 * @param label   Label for error reporting
 * @param fn      Test function that receives the transaction context
 */
export async function runInRollbackTx(
  prisma: PrismaClient,
  label: string,
  fn: TransactionalTestFn,
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await fn(tx);
      // Always rollback by throwing a sentinel error after all assertions pass
      throw new RollbackSentinel("__ROLLBACK_SENTINEL__");
    });
  } catch (err: unknown) {
    if (err instanceof RollbackSentinel) {
      // Expected — clean rollback
      return;
    }
    // Unexpected exception — re-throw so the test phase can record a FAIL
    throw err;
  }
}

class RollbackSentinel extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "RollbackSentinel";
  }
}

/**
 * Safely run an assertion step, catching errors and recording them as FAIL.
 * Returns false if the step failed, true if it passed.
 */
export async function safeRun(
  testLabel: string,
  fn: () => Promise<void>,
): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    fail(testLabel, `Unexpected error: ${message}`);
    return false;
  }
}
