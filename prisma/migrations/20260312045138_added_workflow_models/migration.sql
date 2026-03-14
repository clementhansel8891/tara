-- CreateTable
CREATE TABLE "workflow_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "maker_dept" TEXT NOT NULL,
    "destination_dept" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_by" TEXT NOT NULL,
    "current_step_id" TEXT,
    "last_action" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "steps" JSONB,
    "route" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_audit_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" TEXT,
    "actor_dept" TEXT,
    "notes" TEXT,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_requests_tenant_id_idx" ON "workflow_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "workflow_requests_status_idx" ON "workflow_requests"("status");

-- CreateIndex
CREATE INDEX "workflow_requests_entity_type_entity_id_idx" ON "workflow_requests"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "workflow_audit_entries_tenant_id_idx" ON "workflow_audit_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "workflow_audit_entries_workflow_id_idx" ON "workflow_audit_entries"("workflow_id");

-- AddForeignKey
ALTER TABLE "workflow_requests" ADD CONSTRAINT "workflow_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_audit_entries" ADD CONSTRAINT "workflow_audit_entries_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
