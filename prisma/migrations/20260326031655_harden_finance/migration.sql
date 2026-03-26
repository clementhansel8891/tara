/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,fiscal_period_id,account_id,currency,branch_id,location_id,department_id,cost_center_id,project_id]` on the table `finance_account_balances` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,idempotency_key]` on the table `finance_ar_invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,company_id,source_event_id]` on the table `finance_ledger_event_log` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,company_id,source_event_id]` on the table `finance_ledger_idempotency` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company_id` to the `finance_ledger_event_log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `finance_ledger_idempotency` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "finance_account_balances_tenant_id_fiscal_period_id_account_key";

-- DropIndex
DROP INDEX "finance_ledger_event_log_tenant_id_source_event_id_key";

-- DropIndex
DROP INDEX "finance_ledger_idempotency_tenant_id_source_event_id_key";

-- AlterTable
ALTER TABLE "finance_account_balances" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'IDR';

-- AlterTable
ALTER TABLE "finance_ar_invoices" ADD COLUMN     "idempotency_key" TEXT;

-- AlterTable
ALTER TABLE "finance_journal_entries" ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "journal_type" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "ledger_sequence" BIGINT,
ADD COLUMN     "source_event_id" TEXT;

-- AlterTable
ALTER TABLE "finance_ledger_event_log" ADD COLUMN     "company_id" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "finance_ledger_event_log_archive" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "finance_ledger_idempotency" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "finance_ledger_posting_lines" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'IDR',
ADD COLUMN     "dimension_branch_id" TEXT,
ADD COLUMN     "dimension_channel_id" TEXT,
ADD COLUMN     "dimension_cost_center_id" TEXT,
ADD COLUMN     "dimension_department_id" TEXT,
ADD COLUMN     "dimension_project_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "finance_account_balances_tenant_id_fiscal_period_id_account_key" ON "finance_account_balances"("tenant_id", "fiscal_period_id", "account_id", "currency", "branch_id", "location_id", "department_id", "cost_center_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ar_invoices_tenant_id_idempotency_key_key" ON "finance_ar_invoices"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ledger_event_log_tenant_id_company_id_source_event__key" ON "finance_ledger_event_log"("tenant_id", "company_id", "source_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ledger_idempotency_tenant_id_company_id_source_even_key" ON "finance_ledger_idempotency"("tenant_id", "company_id", "source_event_id");
