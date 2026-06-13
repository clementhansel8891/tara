import { Employee } from "../entities/employee.entity";

/**
 * Consumer-facing contracts exposed by the HR module to downstream modules.
 *
 * These projections intentionally expose a narrow, stable shape so that
 * consumer modules (e.g. the Retail `ShiftControl` page) can populate their
 * staff/roster views from real HR data instead of mock lists
 * (Requirements 1.6, 6.6).
 */

/**
 * Roster projection consumed by the Retail `ShiftControl` page to replace the
 * hardcoded `AVAILABLE_STAFF` list.
 *
 * Contract (design "Shift scheduling consumer contract"):
 *   interface AvailableStaff { id: string; name: string; role: string; }
 */
export interface AvailableStaff {
  /** Employee identifier. */
  id: string;
  /** Employee display name (full_name = first_name + last_name). */
  name: string;
  /** Employee role/position (role_title, falling back to position). */
  role: string;
}

/**
 * Maps a fully-hydrated `Employee` to the `AvailableStaff` consumer contract.
 *
 * Only identity (`id`), display name (`name`), and role/assignment (`role`)
 * are projected. `name` derives from the computed `full_name`; `role` prefers
 * `role_title` and falls back to `position`, mirroring how those aliases map to
 * the schema `positions` column.
 */
export function mapToAvailableStaff(employee: Employee): AvailableStaff {
  const name =
    employee.full_name?.trim() ||
    `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();

  return {
    id: employee.id,
    name,
    role: employee.role_title || employee.position || "",
  };
}

/**
 * Scheduling projection consumed by the Retail `ShiftControl` page to replace
 * the hardcoded `MOCK_DRAFT_SHIFTS` grid.
 *
 * Contract (design "Shift scheduling consumer contract"):
 *   interface ScheduledShift {
 *     id: string;
 *     employeeId: string;   // mapped from employee_id
 *     name: string;         // employee full_name
 *     role: string;         // employee role_title / position
 *     startTime: string;    // "HH:mm"
 *     endTime: string;      // "HH:mm"
 *     dayOfWeek: number;    // 0-6
 *     status: 'draft' | 'published';
 *   }
 */
export interface ScheduledShift {
  /** Work shift identifier. */
  id: string;
  /** Assigned employee identifier (mapped from `employee_id`). */
  employeeId: string;
  /** Employee display name (full_name = first_name + last_name). */
  name: string;
  /** Employee role/position (role_title, falling back to position). */
  role: string;
  /** Shift start time of day, formatted as "HH:mm" (UTC). */
  startTime: string;
  /** Shift end time of day, formatted as "HH:mm" (UTC). */
  endTime: string;
  /** Day of week derived from the shift start time: 0 (Sunday) – 6 (Saturday). */
  dayOfWeek: number;
  /** Publication state derived from the owning schedule/shift status. */
  status: "draft" | "published";
}

/**
 * A work shift row as produced by the HR repository's `getWorkShifts` mapper
 * (camelCase aliases), optionally enriched by the service with the owning
 * schedule's status so the projection can derive `draft`/`published`.
 */
export interface WorkShiftLike {
  id: string;
  employee_id: string;
  start_time: Date | string;
  end_time: Date | string;
  /** Shift-level status, when present. */
  status?: string | null;
  /** Owning schedule status, attached by the service for status derivation. */
  schedule_status?: string | null;
}

/**
 * Formats a `Date`/ISO timestamp to a "HH:mm" time-of-day string in UTC.
 * UTC is used so the projection is deterministic regardless of server timezone.
 */
function formatTimeOfDay(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "00:00";
  }
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Normalizes a raw schedule/shift status to the consumer contract's binary
 * publication state: `APPROVED`/`PUBLISHED` (any casing) map to `published`,
 * everything else (including draft, missing, or unknown) maps to `draft`.
 */
function toPublicationStatus(raw?: string | null): "draft" | "published" {
  const normalized = (raw ?? "").trim().toUpperCase();
  return normalized === "APPROVED" || normalized === "PUBLISHED"
    ? "published"
    : "draft";
}

/**
 * Maps a persisted work shift (and, when available, the assigned employee) to
 * the `ScheduledShift` consumer contract.
 *
 * `startTime`/`endTime` are derived as "HH:mm" from the shift's `start_time`/
 * `end_time`; `dayOfWeek` (0-6) is derived from `start_time`. `status` is
 * derived from the shift's own status when present, otherwise from the owning
 * schedule status attached as `schedule_status`. `name`/`role` come from the
 * joined employee, mirroring `mapToAvailableStaff`.
 */
export function mapToScheduledShift(
  shift: WorkShiftLike,
  employee?: Employee,
): ScheduledShift {
  const start = shift.start_time instanceof Date ? shift.start_time : new Date(shift.start_time);

  const name = employee
    ? employee.full_name?.trim() ||
      `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim()
    : "";
  const role = employee
    ? employee.role_title || employee.position || ""
    : "";

  return {
    id: shift.id,
    employeeId: shift.employee_id,
    name,
    role,
    startTime: formatTimeOfDay(shift.start_time),
    endTime: formatTimeOfDay(shift.end_time),
    dayOfWeek: Number.isNaN(start.getTime()) ? 0 : start.getUTCDay(),
    status: toPublicationStatus(shift.status ?? shift.schedule_status),
  };
}
