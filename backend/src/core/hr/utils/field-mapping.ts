/**
 * Field-mapping discipline utilities (Task 1.4)
 *
 * Establishes a single, explicit translation layer between HR DTOs / entities
 * (which use mixed casing and compatibility aliases such as `job_title`,
 * `position_id`, `scheduleId`, `totalGrossPay`) and the database column names
 * defined in `prisma/schema.prisma`.
 *
 * Why this exists (Requirement 5 — Field Naming Consistency):
 * - Spreading a DTO/entity object straight into a Prisma `data: {...}` payload
 *   is unsafe: keys whose casing/naming differs from the schema column are
 *   either silently dropped or cause a runtime error (e.g. writing to a
 *   nonexistent `position` column instead of `positions`).
 * - These helpers map each supplied value to the schema column whose defined
 *   name matches (5.1), translate aliased/cased fields to the schema column
 *   name before persisting (5.2), and never drop a value that has a real
 *   column (5.3). Fields with no backing column (e.g. computed `full_name`)
 *   are intentionally excluded rather than passed through blindly.
 *
 * The functions are pure and framework-agnostic so they can be unit-tested in
 * isolation and reused by the repository/service write paths in every phase.
 */

export type ColumnRecord = Record<string, unknown>;

/**
 * Translate an input object's keys into schema column names and drop any keys
 * that are not real database columns.
 *
 * Rules:
 * - `undefined` values are skipped, preserving partial-update semantics (only
 *   fields explicitly supplied are mapped).
 * - A key present in `aliasMap` is renamed to its mapped schema column.
 * - After alias resolution, a key is kept only if it is in `allowedColumns`.
 *   Anything else (computed/relation/unknown fields) is dropped so it can never
 *   be spread implicitly into a Prisma payload.
 *
 * @param input          The DTO/entity-shaped object to map.
 * @param aliasMap       Compatibility alias -> schema column name.
 * @param allowedColumns The exhaustive set of writable schema columns.
 */
export function mapToColumns(
  input: Record<string, unknown> | undefined | null,
  aliasMap: Readonly<Record<string, string>>,
  allowedColumns: readonly string[],
): ColumnRecord {
  const out: ColumnRecord = {};
  if (!input) {
    return out;
  }
  const allowed = new Set(allowedColumns);
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) {
      continue;
    }
    const column = aliasMap[key] ?? key;
    if (!allowed.has(column)) {
      continue;
    }
    out[column] = value;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* employees                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Writable columns on the `employees` table (see prisma/schema.prisma).
 * Note the schema uses `positions` (the position/title string), `job_role_id`
 * (the position relation FK) and `document_metadata` (singular).
 */
export const EMPLOYEE_COLUMNS = [
  'tenant_id',
  'company_id',
  'location_id',
  'department_id',
  'employee_code',
  'first_name',
  'last_name',
  'email',
  'phone',
  'user_id',
  'manager_id',
  'employment_type',
  'base_salary',
  'hourly_rate',
  'hire_date',
  'termination_date',
  'status',
  'job_role_id',
  'document_metadata',
  'positions',
  'retail_id',
] as const;

/**
 * Compatibility aliases for employee fields used by DTOs/entities/services,
 * mapped explicitly to their schema column. Aliases that resolve to the same
 * column (`position`, `job_title`, `role_title` -> `positions`) are accepted;
 * the last value supplied wins.
 *
 * Fields that have no backing column on `employees` (e.g. `full_name`,
 * `currency`) are deliberately omitted so they are dropped by `mapToColumns`.
 */
export const EMPLOYEE_FIELD_ALIASES: Readonly<Record<string, string>> = {
  position: 'positions',
  job_title: 'positions',
  role_title: 'positions',
  position_id: 'job_role_id',
  documents_metadata: 'document_metadata',
};

/** Map an employee DTO/entity object to `employees` schema columns. */
export function mapEmployeeFieldsToColumns(
  input: Record<string, unknown> | undefined | null,
): ColumnRecord {
  return mapToColumns(input, EMPLOYEE_FIELD_ALIASES, EMPLOYEE_COLUMNS);
}

/* -------------------------------------------------------------------------- */
/* hr_work_schedules                                                          */
/* -------------------------------------------------------------------------- */

/** Writable columns on the `hr_work_schedules` table. */
export const WORK_SCHEDULE_COLUMNS = [
  'tenant_id',
  'department_id',
  'created_by',
  'status',
  'start_date',
  'end_date',
  'location_id',
  'metadata',
  'name',
  'company_id',
] as const;

/** Compatibility aliases for work-schedule DTO fields. */
export const WORK_SCHEDULE_FIELD_ALIASES: Readonly<Record<string, string>> = {
  createdBy: 'created_by',
};

/** Map a work-schedule DTO/entity object to `hr_work_schedules` columns. */
export function mapWorkScheduleFieldsToColumns(
  input: Record<string, unknown> | undefined | null,
): ColumnRecord {
  return mapToColumns(input, WORK_SCHEDULE_FIELD_ALIASES, WORK_SCHEDULE_COLUMNS);
}

/* -------------------------------------------------------------------------- */
/* hr_work_shifts                                                             */
/* -------------------------------------------------------------------------- */

/** Writable columns on the `hr_work_shifts` table. */
export const WORK_SHIFT_COLUMNS = [
  'tenant_id',
  'schedule_id',
  'employee_id',
  'start_time',
  'end_time',
  'location_id',
  'metadata',
  'notes',
  'role_id',
  'company_id',
] as const;

/**
 * Compatibility aliases for work-shift DTO fields. The DTO exposes camelCase
 * `scheduleId`/`roleId` which must be translated to the snake_case schema
 * columns `schedule_id`/`role_id` before persisting.
 */
export const WORK_SHIFT_FIELD_ALIASES: Readonly<Record<string, string>> = {
  scheduleId: 'schedule_id',
  roleId: 'role_id',
};

/** Map a work-shift DTO/entity object to `hr_work_shifts` columns. */
export function mapWorkShiftFieldsToColumns(
  input: Record<string, unknown> | undefined | null,
): ColumnRecord {
  return mapToColumns(input, WORK_SHIFT_FIELD_ALIASES, WORK_SHIFT_COLUMNS);
}

/* -------------------------------------------------------------------------- */
/* hr_payroll_runs                                                            */
/* -------------------------------------------------------------------------- */

/** Writable columns on the `hr_payroll_runs` table. */
export const PAYROLL_RUN_COLUMNS = [
  'tenant_id',
  'name',
  'period_start',
  'period_end',
  'status',
  'total_employees',
  'total_gross_pay',
  'total_net_pay',
  'total_deductions',
  'base_currency',
  'pay_date',
  'approved_by',
  'approved_at',
  'company_id',
] as const;

/**
 * Compatibility aliases for the `PayrollRun` entity, which exposes camelCase
 * field names (`totalGrossPay`, `baseCurrency`, ...) mapped here to the
 * snake_case schema columns.
 */
export const PAYROLL_RUN_FIELD_ALIASES: Readonly<Record<string, string>> = {
  totalEmployees: 'total_employees',
  totalGrossPay: 'total_gross_pay',
  totalNetPay: 'total_net_pay',
  totalDeductions: 'total_deductions',
  baseCurrency: 'base_currency',
  payDate: 'pay_date',
  approvedBy: 'approved_by',
  approvedAt: 'approved_at',
};

/** Map a payroll-run entity/DTO object to `hr_payroll_runs` columns. */
export function mapPayrollRunFieldsToColumns(
  input: Record<string, unknown> | undefined | null,
): ColumnRecord {
  return mapToColumns(input, PAYROLL_RUN_FIELD_ALIASES, PAYROLL_RUN_COLUMNS);
}
