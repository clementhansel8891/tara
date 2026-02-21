/*
  Warnings:

  - The `check_in` column on the `attendance_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `check_out` column on the `attendance_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `days` on the `leave_requests` table. All the data in the column will be lost.
  - You are about to drop the column `leave_type` on the `leave_requests` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `payroll_runs` table. All the data in the column will be lost.
  - Added the required column `type` to the `leave_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "abnormal_tags" JSONB,
ADD COLUMN     "policy_id" TEXT,
ADD COLUMN     "requires_attention" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shift_id" TEXT,
ADD COLUMN     "work_duration_minutes" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "check_in",
ADD COLUMN     "check_in" JSONB,
DROP COLUMN "check_out",
ADD COLUMN     "check_out" JSONB;

-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "days",
DROP COLUMN "leave_type",
ADD COLUMN     "approval_id" TEXT,
ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "reason" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'requested';

-- AlterTable
ALTER TABLE "payroll_runs" DROP COLUMN "total_amount",
ADD COLUMN     "approval_id" TEXT,
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "exported_at" TIMESTAMP(3),
ADD COLUMN     "total_employees" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_gross_pay" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_net_pay" DECIMAL(15,2) NOT NULL DEFAULT 0,
ALTER COLUMN "pay_date" DROP NOT NULL;

-- CreateTable
CREATE TABLE "payroll_lines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "gross_pay" DECIMAL(15,2) NOT NULL,
    "net_pay" DECIMAL(15,2) NOT NULL,
    "adjustments" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_lines_company_id_idx" ON "payroll_lines"("company_id");

-- CreateIndex
CREATE INDEX "payroll_lines_payroll_run_id_idx" ON "payroll_lines"("payroll_run_id");

-- CreateIndex
CREATE INDEX "payroll_lines_employee_id_idx" ON "payroll_lines"("employee_id");

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
