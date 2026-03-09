/**
 * Singleton Prisma client for integration tests.
 * All tests share this instance to avoid connection pool exhaustion.
 */
import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient({
      log:
        process.env.DEBUG_SQL === "true"
          ? ["query", "warn", "error"]
          : ["warn", "error"],
    });
  }
  return _prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}
