/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,reference_id,reference_type,type]` on the table `stock_movements` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "stock_movements_tenant_id_reference_id_type_key";

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "reference_type" TEXT;

-- CreateTable
CREATE TABLE "stock_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT,
    "product_id" TEXT NOT NULL,
    "on_hand" DOUBLE PRECISION NOT NULL,
    "reserved" DOUBLE PRECISION NOT NULL,
    "available" DOUBLE PRECISION NOT NULL,
    "in_transit" DOUBLE PRECISION NOT NULL,
    "snapshot_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_snapshots_tenant_id_product_id_idx" ON "stock_snapshots"("tenant_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_tenant_id_reference_id_reference_type_type_key" ON "stock_movements"("tenant_id", "reference_id", "reference_type", "type");
