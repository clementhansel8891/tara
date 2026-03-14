/*
  Warnings:

  - A unique constraint covering the columns `[direct_key]` on the table `chat_rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- DropIndex
DROP INDEX "chat_messages_created_at_idx";

-- DropIndex
DROP INDEX "chat_messages_room_id_idx";

-- DropIndex
DROP INDEX "chat_rooms_tenant_id_idx";

-- DropIndex
DROP INDEX "chat_rooms_type_idx";

-- AlterTable
ALTER TABLE "chat_members" ADD COLUMN     "unread_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "delivered_at" TIMESTAMP(3),
ADD COLUMN     "read_at" TIMESTAMP(3),
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'SENT';

-- AlterTable
ALTER TABLE "chat_rooms" ADD COLUMN     "direct_key" TEXT,
ADD COLUMN     "last_message_at" TIMESTAMP(3),
ADD COLUMN     "last_message_id" TEXT,
ADD COLUMN     "last_message_text" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "chat_messages_room_id_created_at_idx" ON "chat_messages"("room_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_direct_key_key" ON "chat_rooms"("direct_key");

-- CreateIndex
CREATE INDEX "chat_rooms_tenant_id_updated_at_idx" ON "chat_rooms"("tenant_id", "updated_at");

-- CreateIndex
CREATE INDEX "chat_rooms_tenant_id_type_idx" ON "chat_rooms"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "chat_rooms_direct_key_idx" ON "chat_rooms"("direct_key");

-- AddForeignKey
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
