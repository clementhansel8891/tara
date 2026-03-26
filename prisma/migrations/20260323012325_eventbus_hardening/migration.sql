/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,idempotency_key]` on the table `domain_events` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "domain_events" ADD COLUMN     "correlation_id" TEXT,
ADD COLUMN     "idempotency_key" TEXT;

-- CreateTable
CREATE TABLE "event_deliveries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "handler_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_deliveries_tenant_id_status_next_retry_at_idx" ON "event_deliveries"("tenant_id", "status", "next_retry_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_deliveries_tenant_id_event_id_handler_name_key" ON "event_deliveries"("tenant_id", "event_id", "handler_name");

-- CreateIndex
CREATE INDEX "domain_events_correlation_id_idx" ON "domain_events"("correlation_id");

-- CreateIndex
CREATE UNIQUE INDEX "domain_events_tenant_id_idempotency_key_key" ON "domain_events"("tenant_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "event_deliveries" ADD CONSTRAINT "event_deliveries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "domain_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_deliveries" ADD CONSTRAINT "event_deliveries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
