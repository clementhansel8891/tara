/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,ref]` on the table `finance_journal_entries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,source_event_id,entry_type]` on the table `inventory_subledger_entries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,reference_id,type]` on the table `stock_movements` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "domain_events" ADD COLUMN     "aggregate_id" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "domain_events_aggregate_id_idx" ON "domain_events"("aggregate_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_journal_entries_tenant_id_ref_key" ON "finance_journal_entries"("tenant_id", "ref");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_subledger_entries_tenant_id_source_event_id_entry_key" ON "inventory_subledger_entries"("tenant_id", "source_event_id", "entry_type");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_tenant_id_reference_id_type_key" ON "stock_movements"("tenant_id", "reference_id", "type");
