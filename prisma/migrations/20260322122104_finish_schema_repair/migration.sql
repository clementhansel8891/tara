-- CreateTable
CREATE TABLE "inventory_movement_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "from_location_id" TEXT NOT NULL,
    "to_location_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL DEFAULT 'system',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_movement_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "inventory_movement_requests" ADD CONSTRAINT "inventory_movement_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement_requests" ADD CONSTRAINT "inventory_movement_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
