-- CreateTable
CREATE TABLE "inventory_subledger_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_event_id" TEXT NOT NULL,
    "entry_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "is_system_generated" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "reversed_entry_id" TEXT,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_subledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_layers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "remaining_qty" DOUBLE PRECISION NOT NULL,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" TEXT NOT NULL DEFAULT 'FIFO',
    "source_event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_layers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "total_qty" DOUBLE PRECISION NOT NULL,
    "total_valuation" DECIMAL(15,2) NOT NULL,
    "avg_unit_cost" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "snapshot_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_subledger_entries_tenant_id_source_event_id_idx" ON "inventory_subledger_entries"("tenant_id", "source_event_id");

-- CreateIndex
CREATE INDEX "inventory_subledger_entries_tenant_id_status_idx" ON "inventory_subledger_entries"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "cost_layers_tenant_id_sku_id_location_id_idx" ON "cost_layers"("tenant_id", "sku_id", "location_id");

-- CreateIndex
CREATE INDEX "cost_snapshots_tenant_id_sku_id_location_id_idx" ON "cost_snapshots"("tenant_id", "sku_id", "location_id");

-- AddForeignKey
ALTER TABLE "inventory_subledger_entries" ADD CONSTRAINT "inventory_subledger_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_layers" ADD CONSTRAINT "cost_layers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_snapshots" ADD CONSTRAINT "cost_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
