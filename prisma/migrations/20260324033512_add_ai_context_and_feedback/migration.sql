-- AlterTable
ALTER TABLE "hr_recommendations" ADD COLUMN     "confidence_score" DOUBLE PRECISION,
ADD COLUMN     "severity" TEXT NOT NULL DEFAULT 'MEDIUM';

-- CreateTable
CREATE TABLE "hr_context_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "time_window" TEXT NOT NULL,
    "aggregated_values" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_context_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_recommendation_feedbacks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "recommendation_id" TEXT NOT NULL,
    "action_taken" TEXT NOT NULL,
    "outcome" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_recommendation_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_context_snapshots_tenant_id_idx" ON "hr_context_snapshots"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_context_snapshots_metric_type_idx" ON "hr_context_snapshots"("metric_type");

-- CreateIndex
CREATE INDEX "hr_recommendation_feedbacks_tenant_id_idx" ON "hr_recommendation_feedbacks"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_recommendation_feedbacks_recommendation_id_idx" ON "hr_recommendation_feedbacks"("recommendation_id");

-- AddForeignKey
ALTER TABLE "hr_context_snapshots" ADD CONSTRAINT "hr_context_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_recommendation_feedbacks" ADD CONSTRAINT "hr_recommendation_feedbacks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
