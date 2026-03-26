-- AlterTable
ALTER TABLE "sys_outbox_events" ADD COLUMN     "last_error" TEXT,
ADD COLUMN     "next_retry_at" TIMESTAMP(3);
