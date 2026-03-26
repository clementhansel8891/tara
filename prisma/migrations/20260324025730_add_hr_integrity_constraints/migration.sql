/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,email]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,employee_id,date]` on the table `hr_attendance_records` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,period_start,period_end]` on the table `hr_payroll_runs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "employees_department_id_idx";

-- DropIndex
DROP INDEX "employees_email_idx";

-- DropIndex
DROP INDEX "employees_location_id_idx";

-- DropIndex
DROP INDEX "employees_status_idx";

-- CreateIndex
CREATE UNIQUE INDEX "employees_tenant_id_email_key" ON "employees"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "hr_attendance_records_tenant_id_employee_id_date_key" ON "hr_attendance_records"("tenant_id", "employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_runs_tenant_id_period_start_period_end_key" ON "hr_payroll_runs"("tenant_id", "period_start", "period_end");
