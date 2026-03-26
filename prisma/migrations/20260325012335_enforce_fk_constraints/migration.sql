-- DropForeignKey
ALTER TABLE "hr_attendance_records" DROP CONSTRAINT "hr_attendance_records_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "hr_attendance_records" DROP CONSTRAINT "hr_attendance_records_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "hr_work_schedules" DROP CONSTRAINT "hr_work_schedules_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "hr_work_shifts" DROP CONSTRAINT "hr_work_shifts_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "hr_work_shifts" DROP CONSTRAINT "hr_work_shifts_schedule_id_fkey";

-- CreateIndex
CREATE INDEX "hr_attendance_records_work_schedule_id_idx" ON "hr_attendance_records"("work_schedule_id");

-- CreateIndex
CREATE INDEX "hr_attendance_records_work_shift_id_idx" ON "hr_attendance_records"("work_shift_id");

-- CreateIndex
CREATE INDEX "hr_work_shifts_role_id_idx" ON "hr_work_shifts"("role_id");

-- AddForeignKey
ALTER TABLE "hr_attendance_records" ADD CONSTRAINT "hr_attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_attendance_records" ADD CONSTRAINT "hr_attendance_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_work_schedules" ADD CONSTRAINT "hr_work_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_work_shifts" ADD CONSTRAINT "hr_work_shifts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_work_shifts" ADD CONSTRAINT "hr_work_shifts_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_work_shifts" ADD CONSTRAINT "hr_work_shifts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "hr_work_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
