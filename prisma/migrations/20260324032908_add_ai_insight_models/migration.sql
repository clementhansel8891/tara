-- CreateTable
CREATE TABLE "hr_insights" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_recommendations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "insight_id" TEXT,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_insights_tenant_id_idx" ON "hr_insights"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_insights_type_idx" ON "hr_insights"("type");

-- CreateIndex
CREATE INDEX "hr_recommendations_tenant_id_idx" ON "hr_recommendations"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_recommendations_status_idx" ON "hr_recommendations"("status");

-- AddForeignKey
ALTER TABLE "hr_insights" ADD CONSTRAINT "hr_insights_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_recommendations" ADD CONSTRAINT "hr_recommendations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_recommendations" ADD CONSTRAINT "hr_recommendations_insight_id_fkey" FOREIGN KEY ("insight_id") REFERENCES "hr_insights"("id") ON DELETE SET NULL ON UPDATE CASCADE;
