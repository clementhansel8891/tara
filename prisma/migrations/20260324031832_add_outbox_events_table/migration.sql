-- CreateTable
CREATE TABLE "sys_outbox_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_outbox_events_tenant_id_idx" ON "sys_outbox_events"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_outbox_events_status_idx" ON "sys_outbox_events"("status");

-- AddForeignKey
ALTER TABLE "sys_outbox_events" ADD CONSTRAINT "sys_outbox_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
