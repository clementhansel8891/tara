/*
  Warnings:

  - You are about to drop the column `device_name` on the `it_devices` table. All the data in the column will be lost.
  - You are about to drop the column `device_type` on the `it_devices` table. All the data in the column will be lost.
  - You are about to drop the column `ip_address` on the `it_devices` table. All the data in the column will be lost.
  - You are about to drop the column `last_seen` on the `it_devices` table. All the data in the column will be lost.
  - You are about to drop the column `mac_address` on the `it_devices` table. All the data in the column will be lost.
  - You are about to drop the column `serial_number` on the `it_devices` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `it_devices` table. All the data in the column will be lost.
  - You are about to drop the `bin_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_iot_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `warehouse_bins` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `connection` to the `it_devices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `it_devices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `it_devices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bin_assignments" DROP CONSTRAINT "bin_assignments_bin_id_fkey";

-- DropForeignKey
ALTER TABLE "bin_assignments" DROP CONSTRAINT "bin_assignments_product_id_fkey";

-- DropForeignKey
ALTER TABLE "bin_assignments" DROP CONSTRAINT "bin_assignments_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_iot_events" DROP CONSTRAINT "inventory_iot_events_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "warehouse_bins" DROP CONSTRAINT "warehouse_bins_location_id_fkey";

-- DropForeignKey
ALTER TABLE "warehouse_bins" DROP CONSTRAINT "warehouse_bins_tenant_id_fkey";

-- DropIndex
DROP INDEX "it_devices_location_id_idx";

-- DropIndex
DROP INDEX "it_devices_owner_id_idx";

-- DropIndex
DROP INDEX "it_devices_tenant_id_idx";

-- AlterTable
ALTER TABLE "it_devices" DROP COLUMN "device_name",
DROP COLUMN "device_type",
DROP COLUMN "ip_address",
DROP COLUMN "last_seen",
DROP COLUMN "mac_address",
DROP COLUMN "serial_number",
DROP COLUMN "updated_at",
ADD COLUMN     "connection" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- DropTable
DROP TABLE "bin_assignments";

-- DropTable
DROP TABLE "inventory_iot_events";

-- DropTable
DROP TABLE "warehouse_bins";

-- CreateTable
CREATE TABLE "it_device_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "it_device_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "it_device_events_tenant_id_device_id_idx" ON "it_device_events"("tenant_id", "device_id");

-- CreateIndex
CREATE INDEX "it_device_events_tenant_id_processed_idx" ON "it_device_events"("tenant_id", "processed");

-- CreateIndex
CREATE INDEX "it_devices_tenant_id_type_idx" ON "it_devices"("tenant_id", "type");

-- AddForeignKey
ALTER TABLE "it_device_events" ADD CONSTRAINT "it_device_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "it_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_device_events" ADD CONSTRAINT "it_device_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
