-- CreateTable
CREATE TABLE "finance_period_closing_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT,
    "period_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "snapshot_sequence" INTEGER NOT NULL DEFAULT 0,
    "integrity_hash" TEXT NOT NULL,
    "closing_journal_id" TEXT,
    "reversal_journal_id" TEXT,
    "net_income_base" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "closed_by" TEXT NOT NULL,
    "closed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_period_closing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_period_execution_locks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT,
    "period_id" TEXT NOT NULL,
    "closing_request_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "locked_by" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_period_execution_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_period_closing_records_tenant_id_period_id_key" ON "finance_period_closing_records"("tenant_id", "period_id");

-- CreateIndex
CREATE INDEX "finance_period_closing_records_tenant_id_idx" ON "finance_period_closing_records"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_period_execution_locks_tenant_id_period_id_key" ON "finance_period_execution_locks"("tenant_id", "period_id");

-- CreateIndex
CREATE INDEX "finance_period_execution_locks_tenant_id_idx" ON "finance_period_execution_locks"("tenant_id");

-- AddForeignKey
ALTER TABLE "finance_period_closing_records" ADD CONSTRAINT "finance_period_closing_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_period_closing_records" ADD CONSTRAINT "finance_period_closing_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_period_execution_locks" ADD CONSTRAINT "finance_period_execution_locks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_period_execution_locks" ADD CONSTRAINT "finance_period_execution_locks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
