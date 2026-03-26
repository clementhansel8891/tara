-- CreateTable
CREATE TABLE "hr_system_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_system_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_system_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_threshold_audits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "old_value" DOUBLE PRECISION NOT NULL,
    "new_value" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_threshold_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_system_alerts_tenant_id_idx" ON "hr_system_alerts"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_system_alerts_type_idx" ON "hr_system_alerts"("type");

-- CreateIndex
CREATE INDEX "hr_system_metrics_tenant_id_idx" ON "hr_system_metrics"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_system_metrics_metric_name_idx" ON "hr_system_metrics"("metric_name");

-- CreateIndex
CREATE INDEX "hr_threshold_audits_tenant_id_idx" ON "hr_threshold_audits"("tenant_id");

-- AddForeignKey
ALTER TABLE "hr_system_alerts" ADD CONSTRAINT "hr_system_alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_system_metrics" ADD CONSTRAINT "hr_system_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_threshold_audits" ADD CONSTRAINT "hr_threshold_audits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
