-- AlterTable
ALTER TABLE "sys_outbox_events" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;
