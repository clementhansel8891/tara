-- AlterTable
ALTER TABLE "workflow_instances" ADD COLUMN     "failure_at" TIMESTAMP(3),
ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "steps_executed" JSONB,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
