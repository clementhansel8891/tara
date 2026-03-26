/**
 * systemLogger.ts
 *
 * Technical/System events ONLY.
 * For errors, retries, sequence mismatches, and API failures.
 */

const LOG_KEY = "core.system.log";

export type SystemLogEntry = {
  id: string;
  type: "ERROR" | "RETRY" | "MISMATCH" | "FAILURE";
  message: string;
  context?: Record<string, unknown>;
  correlationId?: string;
  timestamp: string;
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `log-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const append = (entry: SystemLogEntry) => {
  if (typeof window === "undefined") return;
  const current = window.localStorage.getItem(LOG_KEY);
  const items = current ? (JSON.parse(current) as SystemLogEntry[]) : [];
  window.localStorage.setItem(LOG_KEY, JSON.stringify([...items, entry]).slice(-10000)); // Keep last 10KB
};

export const systemLogger = {
  error(message: string, context?: Record<string, unknown>, correlationId?: string) {
    const entry: SystemLogEntry = {
      id: createId(),
      type: "ERROR",
      message,
      context,
      correlationId,
      timestamp: new Date().toISOString(),
    };
    append(entry);
    console.error(`[SYSTEM_ERROR] ${correlationId ? `[${correlationId}] ` : ""}${message}`, context);
  },

  mismatch(message: string, context?: Record<string, unknown>, correlationId?: string) {
    const entry: SystemLogEntry = {
      id: createId(),
      type: "MISMATCH",
      message,
      context,
      correlationId,
      timestamp: new Date().toISOString(),
    };
    append(entry);
    console.warn(`[SEQUENCE_MISMATCH] ${correlationId ? `[${correlationId}] ` : ""}${message}`, context);
  },

  failure(message: string, context?: Record<string, unknown>, correlationId?: string) {
    const entry: SystemLogEntry = {
      id: createId(),
      type: "FAILURE",
      message,
      context,
      correlationId,
      timestamp: new Date().toISOString(),
    };
    append(entry);
    console.error(`[API_FAILURE] ${correlationId ? `[${correlationId}] ` : ""}${message}`, context);
  }
};
