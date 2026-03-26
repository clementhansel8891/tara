-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "event_reference_id" TEXT;

-- AlterTable
ALTER TABLE "comms_chat_messages" ADD COLUMN     "event_reference_id" TEXT;

-- AlterTable
ALTER TABLE "domain_events" ADD COLUMN     "event_reference_id" TEXT;

-- AlterTable
ALTER TABLE "hr_attendance_records" ADD COLUMN     "work_schedule_id" TEXT,
ADD COLUMN     "work_shift_id" TEXT;

-- AlterTable
ALTER TABLE "mail_messages" ADD COLUMN     "event_reference_id" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "event_reference_id" TEXT,
ADD COLUMN     "last_retry_at" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT DEFAULT 'NORMAL',
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "hr_work_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_work_shifts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_work_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_work_schedules_tenant_id_idx" ON "hr_work_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_work_schedules_department_id_idx" ON "hr_work_schedules"("department_id");

-- CreateIndex
CREATE INDEX "hr_work_shifts_tenant_id_idx" ON "hr_work_shifts"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_work_shifts_schedule_id_idx" ON "hr_work_shifts"("schedule_id");

-- CreateIndex
CREATE INDEX "hr_work_shifts_employee_id_idx" ON "hr_work_shifts"("employee_id");

-- AddForeignKey
ALTER TABLE "hr_attendance_records" ADD CONSTRAINT "hr_attendance_records_work_shift_id_fkey" FOREIGN KEY ("work_shift_id") REFERENCES "hr_work_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_attendance_records" ADD CONSTRAINT "hr_attendance_records_work_schedule_id_fkey" FOREIGN KEY ("work_schedule_id") REFERENCES "hr_work_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_work_schedules" ADD CONSTRAINT "hr_work_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_work_schedules" ADD CONSTRAINT "hr_work_schedules_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_work_shifts" ADD CONSTRAINT "hr_work_shifts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "hr_work_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_work_shifts" ADD CONSTRAINT "hr_work_shifts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
