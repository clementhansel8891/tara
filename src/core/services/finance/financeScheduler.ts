import { Roles } from "@/core/security/roles";
import type { SessionContext } from "@/core/security/session";
import { financeService } from "./financeService";

const DEFAULT_INTERVAL_MS = 60 * 1000;
const RUN_KEY_PREFIX = "fin:scheduler:deprun:";

let schedulerHandle: number | null = null;

const getSystemSession = (tenantId: string): SessionContext => ({
  userId: "system-finance-scheduler",
  tenantId,
  role: Roles.SUPERADMIN,
  departmentId: "FINANCE",
});

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const collectTenantIds = (): string[] => {
  if (typeof window === "undefined") return [];
  const tenantIds = new Set<string>();
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith("fin:")) continue;
    const parts = key.split(":");
    if (parts.length > 2 && parts[1]) {
      tenantIds.add(parts[1]);
    }
  }
  return Array.from(tenantIds);
};

export const runFinanceDepreciationSchedulerTick = async () => {
  if (typeof window === "undefined") return;
  const today = getTodayIsoDate();
  const tenantIds = collectTenantIds();

  for (const tenantId of tenantIds) {
    const session = getSystemSession(tenantId);
    const duePeriods = financeService
      .listPeriods(tenantId)
      .filter(
        (period) =>
          (period.status === "OPEN" || period.status === "CLOSING") &&
          period.endDate <= today,
      );

    for (const period of duePeriods) {
      const runKey = `${RUN_KEY_PREFIX}${tenantId}:${period.id}`;
      if (window.localStorage.getItem(runKey)) continue;

      try {
        const run = await financeService.runScheduledPeriodDepreciation(
          tenantId,
          session,
          {
            periodStart: period.startDate,
            periodEnd: period.endDate,
            postingDate: period.endDate,
            cfoSignoff: true,
          },
        );
        window.localStorage.setItem(
          runKey,
          JSON.stringify({
            runId: run.runId,
            postedEntries: run.postedEntries,
            completedAt: new Date().toISOString(),
          }),
        );
      } catch {
        // Keep scheduler resilient; failures are retried on next tick.
      }
    }
  }
};

export const startFinanceBackgroundScheduler = (
  intervalMs: number = DEFAULT_INTERVAL_MS,
) => {
  if (typeof window === "undefined") return;
  if (schedulerHandle !== null) return;

  void runFinanceDepreciationSchedulerTick();
  schedulerHandle = window.setInterval(() => {
    void runFinanceDepreciationSchedulerTick();
  }, intervalMs);
};

export const stopFinanceBackgroundScheduler = () => {
  if (typeof window === "undefined") return;
  if (schedulerHandle === null) return;
  window.clearInterval(schedulerHandle);
  schedulerHandle = null;
};
