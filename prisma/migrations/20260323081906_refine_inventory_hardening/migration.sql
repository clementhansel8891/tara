/*
  Warnings:

  - You are about to drop the column `unit_cost` on the `stock_movements` table. All the data in the column will be lost.
  - You are about to drop the column `in_transit` on the `stock_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `on_hand` on the `stock_snapshots` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenant_id,reference_id,reference_type,type,product_id,location_id]` on the table `stock_movements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `location_id` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inTransit` to the `stock_snapshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `onHand` to the `stock_snapshots` table without a default value. This is not possible if the table is not empty.
  - Made the column `location_id` on table `stock_snapshots` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "stock_movements_reference_id_idx";

-- DropIndex
DROP INDEX "stock_movements_tenant_id_reference_id_reference_type_type_key";

-- AlterTable
ALTER TABLE "stock_movements" DROP COLUMN "unit_cost",
ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "location_id" TEXT NOT NULL,
ADD COLUMN     "transfer_group_id" TEXT;

-- AlterTable
ALTER TABLE "stock_snapshots" DROP COLUMN "in_transit",
DROP COLUMN "on_hand",
ADD COLUMN     "inTransit" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "onHand" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "location_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "stock_movements_location_id_idx" ON "stock_movements"("location_id");

-- CreateIndex
CREATE INDEX "stock_movements_transfer_group_id_idx" ON "stock_movements"("transfer_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_tenant_id_reference_id_reference_type_type__key" ON "stock_movements"("tenant_id", "reference_id", "reference_type", "type", "product_id", "location_id");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
