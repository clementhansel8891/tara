-- DropForeignKey
ALTER TABLE "retail_orders" DROP CONSTRAINT "retail_orders_cashier_id_fkey";

-- DropForeignKey
ALTER TABLE "retail_orders" DROP CONSTRAINT "retail_orders_device_id_fkey";

-- AlterTable
ALTER TABLE "retail_orders" ALTER COLUMN "device_id" DROP NOT NULL,
ALTER COLUMN "cashier_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "retail_orders" ADD CONSTRAINT "retail_orders_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail_orders" ADD CONSTRAINT "retail_orders_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "pos_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
