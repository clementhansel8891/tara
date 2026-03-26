-- AlterTable
ALTER TABLE "hr_attendance_records" ADD COLUMN     "event_reference_id" TEXT;

-- AlterTable
ALTER TABLE "hr_work_schedules" ADD COLUMN     "location_id" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "hr_work_shifts" ADD COLUMN     "location_id" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "role_id" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "hr_work_schedules_location_id_idx" ON "hr_work_schedules"("location_id");

-- CreateIndex
CREATE INDEX "hr_work_shifts_location_id_idx" ON "hr_work_shifts"("location_id");

-- AddForeignKey
ALTER TABLE "hr_work_schedules" ADD CONSTRAINT "hr_work_schedules_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_work_shifts" ADD CONSTRAINT "hr_work_shifts_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
