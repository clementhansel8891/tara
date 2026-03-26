-- CreateTable
CREATE TABLE "sys_idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "request_hash" TEXT,
    "response_snapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_idempotency_keys_tenant_id_key_idx" ON "sys_idempotency_keys"("tenant_id", "key");

-- CreateIndex
CREATE INDEX "sys_idempotency_keys_expires_at_idx" ON "sys_idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "sys_idempotency_keys_tenant_id_key_key" ON "sys_idempotency_keys"("tenant_id", "key");

-- AddForeignKey
ALTER TABLE "sys_idempotency_keys" ADD CONSTRAINT "sys_idempotency_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
