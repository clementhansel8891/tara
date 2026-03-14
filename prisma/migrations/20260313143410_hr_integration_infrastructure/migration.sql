/*
  Warnings:

  - The `type` column on the `chat_messages` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'FILE', 'QUOTE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "hash_chain" TEXT,
ADD COLUMN     "source_module" TEXT;

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "ref_entity_type" TEXT,
ADD COLUMN     "ref_label" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "ChatMessageType" NOT NULL DEFAULT 'TEXT';

-- CreateTable
CREATE TABLE "user_notification_preferences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notification_preferences_tenant_id_idx" ON "user_notification_preferences"("tenant_id");

-- CreateIndex
CREATE INDEX "user_notification_preferences_tenant_id_user_id_idx" ON "user_notification_preferences"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "user_notification_preferences_tenant_id_module_event_type_idx" ON "user_notification_preferences"("tenant_id", "module", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_tenant_id_user_id_module_even_key" ON "user_notification_preferences"("tenant_id", "user_id", "module", "event_type", "channel");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_entity_type_entity_id_idx" ON "audit_logs"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_source_module_idx" ON "audit_logs"("tenant_id", "source_module");

-- CreateIndex
CREATE INDEX "chat_messages_tenant_id_ref_module_ref_entity_type_ref_enti_idx" ON "chat_messages"("tenant_id", "ref_module", "ref_entity_type", "ref_entity_id");

-- AddForeignKey
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
