/*
  Warnings:

  - You are about to alter the column `employer_contribution` on the `hr_benefit_plans` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `employee_contribution` on the `hr_benefit_plans` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `total_budget` on the `hr_budget_scenarios` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `coverage_amount` on the `hr_employee_benefits` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to drop the column `effective_date` on the `hr_exchange_rates` table. All the data in the column will be lost.
  - You are about to alter the column `rate` on the `hr_exchange_rates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,8)` to `Decimal(15,6)`.
  - You are about to alter the column `projected_salary` on the `hr_headcount_plans` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to drop the column `end_date` on the `hr_mentorship_pairs` table. All the data in the column will be lost.
  - You are about to drop the column `employee_id` on the `hr_succession_candidates` table. All the data in the column will be lost.
  - You are about to drop the column `attempted_at` on the `payment_retry_attempts` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `payment_retry_attempts` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `retail_gateway_nodes` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `retail_gateway_nodes` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `retail_order_items` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `actor_dept` on the `workflow_audit_entries` table. All the data in the column will be lost.
  - You are about to drop the column `before` on the `workflow_audit_entries` table. All the data in the column will be lost.
  - You are about to drop the column `current_step_id` on the `workflow_requests` table. All the data in the column will be lost.
  - You are about to drop the `attendance_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `journal_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `journal_lines` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll_runs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `performance_cycles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tenant_id,idempotency_key]` on the table `audit_logs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `hr_compliance_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `effective_at` to the `hr_exchange_rates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `hr_headcount_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidate_id` to the `hr_succession_candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `payment_retry_attempts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `retail_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `workflow_audit_entries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ChatMessageType" ADD VALUE 'image';
ALTER TYPE "ChatMessageType" ADD VALUE 'system';
ALTER TYPE "ChatMessageType" ADD VALUE 'text';

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_location_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_shift_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_reply_to_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_room_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_reactions" DROP CONSTRAINT "chat_reactions_message_id_fkey";

-- DropForeignKey
ALTER TABLE "hr_compliance_reports" DROP CONSTRAINT "hr_compliance_reports_payroll_run_id_fkey";

-- DropForeignKey
ALTER TABLE "hr_succession_candidates" DROP CONSTRAINT "hr_succession_candidates_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "journal_entries" DROP CONSTRAINT "journal_entries_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "journal_lines" DROP CONSTRAINT "journal_lines_journal_entry_id_fkey";

-- DropForeignKey
ALTER TABLE "payment_retry_attempts" DROP CONSTRAINT "payment_retry_attempts_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "payroll_lines" DROP CONSTRAINT "payroll_lines_payroll_run_id_fkey";

-- DropForeignKey
ALTER TABLE "payroll_runs" DROP CONSTRAINT "payroll_runs_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "performance_cycles" DROP CONSTRAINT "performance_cycles_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "performance_reviews" DROP CONSTRAINT "performance_reviews_cycle_id_fkey";

-- DropForeignKey
ALTER TABLE "retail_order_items" DROP CONSTRAINT "retail_order_items_order_id_fkey";

-- DropIndex
DROP INDEX "candidates_status_idx";

-- DropIndex
DROP INDEX "compensations_employee_id_idx";

-- DropIndex
DROP INDEX "hr_budget_scenarios_status_idx";

-- DropIndex
DROP INDEX "hr_cases_status_idx";

-- DropIndex
DROP INDEX "hr_employee_benefits_employee_id_idx";

-- DropIndex
DROP INDEX "hr_employee_benefits_plan_id_idx";

-- DropIndex
DROP INDEX "hr_exchange_rates_from_currency_to_currency_idx";

-- DropIndex
DROP INDEX "hr_headcount_plans_department_id_idx";

-- DropIndex
DROP INDEX "hr_headcount_plans_scenario_id_idx";

-- DropIndex
DROP INDEX "hr_mentorship_pairs_mentee_id_idx";

-- DropIndex
DROP INDEX "hr_mentorship_pairs_mentor_id_idx";

-- DropIndex
DROP INDEX "hr_performance_goals_employee_id_idx";

-- DropIndex
DROP INDEX "hr_succession_candidates_employee_id_idx";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "after_state" JSONB,
ADD COLUMN     "before_state" JSONB,
ADD COLUMN     "correlation_id" TEXT,
ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "original_hash" TEXT,
ADD COLUMN     "previous_hash" TEXT,
ADD COLUMN     "recomputed_hash" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "candidates" ALTER COLUMN "source" DROP DEFAULT;

-- AlterTable
ALTER TABLE "compensations" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "effective_date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "hr_benefit_plans" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ALTER COLUMN "employer_contribution" DROP NOT NULL,
ALTER COLUMN "employer_contribution" DROP DEFAULT,
ALTER COLUMN "employer_contribution" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "employee_contribution" DROP NOT NULL,
ALTER COLUMN "employee_contribution" DROP DEFAULT,
ALTER COLUMN "employee_contribution" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "hr_budget_scenarios" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'draft',
ALTER COLUMN "total_budget" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "hr_cases" ADD COLUMN     "category" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "subject" TEXT,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'OPEN',
ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "hr_compliance_reports" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "hr_employee_benefits" ALTER COLUMN "status" SET DEFAULT 'active',
ALTER COLUMN "coverage_amount" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "hr_exchange_rates" DROP COLUMN "effective_date",
ADD COLUMN     "effective_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "rate" SET DATA TYPE DECIMAL(15,6);

-- AlterTable
ALTER TABLE "hr_headcount_plans" ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PLANNED',
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ALTER COLUMN "target_headcount" DROP DEFAULT,
ALTER COLUMN "projected_salary" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "planned_hire_date" DROP NOT NULL;

-- AlterTable
ALTER TABLE "hr_mentorship_pairs" DROP COLUMN "end_date",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "program_name" TEXT,
ALTER COLUMN "start_date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "hr_performance_goals" ALTER COLUMN "status" SET DEFAULT 'not_started';

-- AlterTable
ALTER TABLE "hr_position_skills" ADD COLUMN     "importance" TEXT NOT NULL DEFAULT 'medium',
ALTER COLUMN "is_mandatory" SET DEFAULT false;

-- AlterTable
ALTER TABLE "hr_succession_candidates" DROP COLUMN "employee_id",
ADD COLUMN     "candidate_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payables" ADD COLUMN     "workflow_request_id" TEXT;

-- AlterTable
ALTER TABLE "payment_retry_attempts" DROP COLUMN "attempted_at",
DROP COLUMN "reason",
ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "retried_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "workflow_request_id" TEXT;

-- AlterTable
ALTER TABLE "retail_gateway_nodes" DROP COLUMN "created_at",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "retail_order_items" ADD COLUMN     "tenant_id" TEXT NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "system_logs" ADD COLUMN     "correlation_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "workflow_audit_entries" DROP COLUMN "actor_dept",
DROP COLUMN "before",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "workflow_requests" DROP COLUMN "current_step_id",
ALTER COLUMN "requested_by" DROP NOT NULL;

-- DropTable
DROP TABLE "attendance_records";

-- DropTable
DROP TABLE "chat_messages";

-- DropTable
DROP TABLE "journal_entries";

-- DropTable
DROP TABLE "journal_lines";

-- DropTable
DROP TABLE "payroll_runs";

-- DropTable
DROP TABLE "performance_cycles";

-- CreateTable
CREATE TABLE "hr_attendance_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "check_in" JSONB,
    "check_out" JSONB,
    "status" TEXT NOT NULL DEFAULT 'present',
    "type" TEXT NOT NULL DEFAULT 'web',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "shift_id" TEXT,
    "work_duration_minutes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "hr_attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_employees" INTEGER NOT NULL DEFAULT 0,
    "total_gross_pay" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_net_pay" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "base_currency" TEXT NOT NULL DEFAULT 'USD',
    "pay_date" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_hash_anchors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "anchor_hash" TEXT NOT NULL,
    "anchored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "record_count" INTEGER NOT NULL,

    CONSTRAINT "audit_hash_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_performance_cycles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hr_performance_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "source_module" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comms_chat_messages" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT,
    "type" TEXT DEFAULT 'text',
    "attachments" JSONB,
    "ref_module" TEXT,
    "ref_entity_type" TEXT,
    "ref_entity_id" TEXT,
    "ref_label" TEXT,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "reply_to_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',

    CONSTRAINT "comms_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ledger_idempotency" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_event_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_ledger_idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ledger_postings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "sequence_key" TEXT,
    "sequence_number" INTEGER,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_ledger_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_chart_of_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ledger_posting_lines" (
    "id" TEXT NOT NULL,
    "ledger_posting_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "branch_id" TEXT,
    "location_id" TEXT,
    "department_id" TEXT,
    "cost_center_id" TEXT,
    "project_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_ledger_posting_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_fiscal_periods" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_fiscal_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_journal_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fiscal_period_id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "description" TEXT,
    "posting_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "previous_hash" TEXT,
    "entry_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_journal_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "account_code" TEXT NOT NULL,
    "description" TEXT,
    "side" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "debit" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "credit" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "branch_id" TEXT,
    "location_id" TEXT,
    "department_id" TEXT,
    "cost_center_id" TEXT,
    "project_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_account_balances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fiscal_period_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "location_id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "department_id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "cost_center_id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "project_id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "debit_total" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "credit_total" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "net_balance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_account_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_account_balance_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fiscal_period_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "balances_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_account_balance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_journal_reversals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "original_journal_id" TEXT NOT NULL,
    "reversal_journal_id" TEXT NOT NULL,
    "reversal_reason" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_journal_reversals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ar_customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "credit_limit" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_ar_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ar_invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issue_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "total_amount" DECIMAL(19,4) NOT NULL,
    "outstanding_amount" DECIMAL(19,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "workflow_request_id" TEXT,

    CONSTRAINT "finance_ar_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ar_invoice_lines" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(19,4) NOT NULL,
    "unit_price" DECIMAL(19,4) NOT NULL,
    "total" DECIMAL(19,4) NOT NULL,

    CONSTRAINT "finance_ar_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ar_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "reference" TEXT,
    "payment_reference" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_ar_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ar_payment_allocations" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount_allocated" DECIMAL(19,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivableId" TEXT,

    CONSTRAINT "finance_ar_payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ar_credit_memos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "credit_amount" DECIMAL(19,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_ar_credit_memos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ledger_event_log" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "source_event_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sequence_key" TEXT,
    "sequence_number" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "finance_ledger_event_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ledger_event_log_archive" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "source_event_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sequence_key" TEXT,
    "sequence_number" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_ledger_event_log_archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ledger_hash_anchors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "anchor_date" TIMESTAMP(3) NOT NULL,
    "final_journal_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_ledger_hash_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ar_customer_credit_balances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "balance" DECIMAL(19,4) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_ar_customer_credit_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_insight_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "snapshot_sequence" INTEGER NOT NULL,
    "forecast_hash" TEXT NOT NULL,
    "insight_hash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_insight_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_certifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "certification_hash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_bank_statements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "statement_date" TIMESTAMP(3) NOT NULL,
    "opening_balance" DECIMAL(19,4) NOT NULL,
    "closing_balance" DECIMAL(19,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_bank_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "statement_id" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_recon_matches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bank_transaction_id" TEXT NOT NULL,
    "ledger_journal_id" TEXT,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "match_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_recon_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_tax_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "country" TEXT NOT NULL DEFAULT 'ID',
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_tax_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_tax_rules" (
    "id" TEXT NOT NULL,
    "tax_config_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_tax_rates" (
    "id" TEXT NOT NULL,
    "tax_rule_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "is_inclusive" BOOLEAN NOT NULL DEFAULT false,
    "account_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_transaction_taxes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "tax_rate_id" TEXT NOT NULL,
    "base_amount" DECIMAL(19,4) NOT NULL,
    "tax_amount" DECIMAL(19,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_transaction_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ap_payment_allocations" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "amount_allocated" DECIMAL(19,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_ap_payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_budget_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "cost_center_id" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "period_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,
    "departmentId" TEXT,
    "chartOfAccountId" TEXT,
    "fiscalPeriodId" TEXT,

    CONSTRAINT "finance_budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_budget_actuals" (
    "id" TEXT NOT NULL,
    "budget_line_id" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "as_of_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT,
    "departmentId" TEXT,
    "budgetScenarioId" TEXT,
    "chartOfAccountId" TEXT,
    "fiscalPeriodId" TEXT,

    CONSTRAINT "finance_budget_actuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_expense_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "hard_limit" DECIMAL(19,4) NOT NULL,
    "soft_limit" DECIMAL(19,4) NOT NULL,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_expense_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_bins" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "zone" TEXT,
    "aisle" TEXT,
    "rack" TEXT,
    "level" TEXT,
    "capacity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_bins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bin_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bin_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bin_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agentic_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "error_msg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agentic_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_iot_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "sku" TEXT,
    "location_id" TEXT,
    "bin_id" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "movement_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_iot_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_attendance_records_tenant_id_idx" ON "hr_attendance_records"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_attendance_records_employee_id_idx" ON "hr_attendance_records"("employee_id");

-- CreateIndex
CREATE INDEX "hr_attendance_records_date_idx" ON "hr_attendance_records"("date");

-- CreateIndex
CREATE INDEX "hr_payroll_runs_tenant_id_idx" ON "hr_payroll_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_hash_anchors_tenant_id_idx" ON "audit_hash_anchors"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_hash_anchors_anchored_at_idx" ON "audit_hash_anchors"("anchored_at");

-- CreateIndex
CREATE INDEX "hr_performance_cycles_tenant_id_idx" ON "hr_performance_cycles"("tenant_id");

-- CreateIndex
CREATE INDEX "domain_events_tenant_id_idx" ON "domain_events"("tenant_id");

-- CreateIndex
CREATE INDEX "domain_events_event_type_idx" ON "domain_events"("event_type");

-- CreateIndex
CREATE INDEX "domain_events_entity_id_idx" ON "domain_events"("entity_id");

-- CreateIndex
CREATE INDEX "comms_chat_messages_tenant_id_idx" ON "comms_chat_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "comms_chat_messages_room_id_created_at_idx" ON "comms_chat_messages"("room_id", "created_at");

-- CreateIndex
CREATE INDEX "comms_chat_messages_tenant_id_ref_module_ref_entity_type_re_idx" ON "comms_chat_messages"("tenant_id", "ref_module", "ref_entity_type", "ref_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ledger_idempotency_tenant_id_source_event_id_key" ON "finance_ledger_idempotency"("tenant_id", "source_event_id");

-- CreateIndex
CREATE INDEX "finance_ledger_postings_tenant_id_sequence_key_sequence_num_idx" ON "finance_ledger_postings"("tenant_id", "sequence_key", "sequence_number");

-- CreateIndex
CREATE INDEX "finance_chart_of_accounts_tenant_id_idx" ON "finance_chart_of_accounts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_chart_of_accounts_tenant_id_code_key" ON "finance_chart_of_accounts"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "finance_fiscal_periods_tenant_id_idx" ON "finance_fiscal_periods"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_journal_entries_ref_key" ON "finance_journal_entries"("ref");

-- CreateIndex
CREATE INDEX "finance_journal_entries_tenant_id_fiscal_period_id_idx" ON "finance_journal_entries"("tenant_id", "fiscal_period_id");

-- CreateIndex
CREATE INDEX "finance_journal_entries_tenant_id_created_at_idx" ON "finance_journal_entries"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "finance_journal_entries_tenant_id_status_idx" ON "finance_journal_entries"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "finance_journal_lines_tenant_id_journal_entry_id_idx" ON "finance_journal_lines"("tenant_id", "journal_entry_id");

-- CreateIndex
CREATE INDEX "finance_journal_lines_tenant_id_created_at_idx" ON "finance_journal_lines"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "finance_account_balances_tenant_id_created_at_idx" ON "finance_account_balances"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "finance_account_balances_tenant_id_fiscal_period_id_account_key" ON "finance_account_balances"("tenant_id", "fiscal_period_id", "account_id", "branch_id", "location_id", "department_id", "cost_center_id", "project_id");

-- CreateIndex
CREATE INDEX "finance_account_balance_snapshots_tenant_id_snapshot_date_idx" ON "finance_account_balance_snapshots"("tenant_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "finance_journal_reversals_tenant_id_original_journal_id_key" ON "finance_journal_reversals"("tenant_id", "original_journal_id");

-- CreateIndex
CREATE INDEX "finance_ar_customers_tenant_id_idx" ON "finance_ar_customers"("tenant_id");

-- CreateIndex
CREATE INDEX "finance_ar_invoices_tenant_id_customer_id_idx" ON "finance_ar_invoices"("tenant_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ar_invoices_tenant_id_invoice_number_key" ON "finance_ar_invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE INDEX "finance_ar_payments_tenant_id_customer_id_idx" ON "finance_ar_payments"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "finance_ar_payments_tenant_id_created_at_idx" ON "finance_ar_payments"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ar_payments_tenant_id_idempotency_key_key" ON "finance_ar_payments"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "finance_ar_credit_memos_tenant_id_customer_id_idx" ON "finance_ar_credit_memos"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "finance_ledger_event_log_tenant_id_created_at_idx" ON "finance_ledger_event_log"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "finance_ledger_event_log_processed_at_idx" ON "finance_ledger_event_log"("processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ledger_event_log_tenant_id_source_event_id_key" ON "finance_ledger_event_log"("tenant_id", "source_event_id");

-- CreateIndex
CREATE INDEX "finance_ledger_event_log_archive_tenant_id_created_at_idx" ON "finance_ledger_event_log_archive"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ledger_hash_anchors_tenant_id_anchor_date_key" ON "finance_ledger_hash_anchors"("tenant_id", "anchor_date");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ar_customer_credit_balances_tenant_id_customer_id_key" ON "finance_ar_customer_credit_balances"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "finance_insight_snapshots_tenant_id_company_id_snapshot_seq_idx" ON "finance_insight_snapshots"("tenant_id", "company_id", "snapshot_sequence");

-- CreateIndex
CREATE INDEX "finance_insight_snapshots_forecast_hash_idx" ON "finance_insight_snapshots"("forecast_hash");

-- CreateIndex
CREATE UNIQUE INDEX "finance_insight_snapshots_tenant_id_company_id_snapshot_seq_key" ON "finance_insight_snapshots"("tenant_id", "company_id", "snapshot_sequence", "forecast_hash");

-- CreateIndex
CREATE INDEX "finance_certifications_tenant_id_snapshot_id_idx" ON "finance_certifications"("tenant_id", "snapshot_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_certifications_tenant_id_snapshot_id_key" ON "finance_certifications"("tenant_id", "snapshot_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_tax_configs_tenant_id_branch_id_key" ON "finance_tax_configs"("tenant_id", "branch_id");

-- CreateIndex
CREATE INDEX "warehouse_bins_tenant_id_idx" ON "warehouse_bins"("tenant_id");

-- CreateIndex
CREATE INDEX "warehouse_bins_location_id_idx" ON "warehouse_bins"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_bins_tenant_id_code_key" ON "warehouse_bins"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "bin_assignments_tenant_id_idx" ON "bin_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "bin_assignments_product_id_idx" ON "bin_assignments"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "bin_assignments_bin_id_product_id_key" ON "bin_assignments"("bin_id", "product_id");

-- CreateIndex
CREATE INDEX "agentic_events_tenant_id_event_type_status_idx" ON "agentic_events"("tenant_id", "event_type", "status");

-- CreateIndex
CREATE INDEX "agentic_events_tenant_id_entity_id_idx" ON "agentic_events"("tenant_id", "entity_id");

-- CreateIndex
CREATE INDEX "inventory_iot_events_tenant_id_processed_idx" ON "inventory_iot_events"("tenant_id", "processed");

-- CreateIndex
CREATE INDEX "inventory_iot_events_tenant_id_device_id_idx" ON "inventory_iot_events"("tenant_id", "device_id");

-- CreateIndex
CREATE INDEX "inventory_iot_events_sku_idx" ON "inventory_iot_events"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_tenant_id_idempotency_key_key" ON "audit_logs"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "hr_headcount_plans_tenant_id_idx" ON "hr_headcount_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_succession_candidates_candidate_id_idx" ON "hr_succession_candidates"("candidate_id");

-- CreateIndex
CREATE INDEX "hr_succession_candidates_tenant_id_idx" ON "hr_succession_candidates"("tenant_id");

-- CreateIndex
CREATE INDEX "retail_order_items_tenant_id_idx" ON "retail_order_items"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_attendance_records" ADD CONSTRAINT "hr_attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_attendance_records" ADD CONSTRAINT "hr_attendance_records_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_attendance_records" ADD CONSTRAINT "hr_attendance_records_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_attendance_records" ADD CONSTRAINT "hr_attendance_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "hr_payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "hr_performance_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_payroll_runs" ADD CONSTRAINT "hr_payroll_runs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail_order_items" ADD CONSTRAINT "retail_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "retail_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail_order_items" ADD CONSTRAINT "retail_order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_hash_anchors" ADD CONSTRAINT "audit_hash_anchors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_workflow_request_id_fkey" FOREIGN KEY ("workflow_request_id") REFERENCES "workflow_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_workflow_request_id_fkey" FOREIGN KEY ("workflow_request_id") REFERENCES "workflow_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_retry_attempts" ADD CONSTRAINT "payment_retry_attempts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "payment_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_retry_attempts" ADD CONSTRAINT "payment_retry_attempts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_performance_cycles" ADD CONSTRAINT "hr_performance_cycles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comms_chat_messages" ADD CONSTRAINT "comms_chat_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "comms_chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comms_chat_messages" ADD CONSTRAINT "comms_chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comms_chat_messages" ADD CONSTRAINT "comms_chat_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "comms_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_compliance_reports" ADD CONSTRAINT "hr_compliance_reports_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "hr_payroll_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_benefits" ADD CONSTRAINT "hr_employee_benefits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_skills" ADD CONSTRAINT "hr_employee_skills_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_headcount_plans" ADD CONSTRAINT "hr_headcount_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_mentorship_pairs" ADD CONSTRAINT "hr_mentorship_pairs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_position_skills" ADD CONSTRAINT "hr_position_skills_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_program_skills" ADD CONSTRAINT "hr_program_skills_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_succession_candidates" ADD CONSTRAINT "hr_succession_candidates_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_succession_candidates" ADD CONSTRAINT "hr_succession_candidates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_audit_entries" ADD CONSTRAINT "workflow_audit_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_idempotency" ADD CONSTRAINT "finance_ledger_idempotency_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_postings" ADD CONSTRAINT "finance_ledger_postings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_chart_of_accounts" ADD CONSTRAINT "finance_chart_of_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_posting_lines" ADD CONSTRAINT "finance_ledger_posting_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "finance_chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_posting_lines" ADD CONSTRAINT "finance_ledger_posting_lines_ledger_posting_id_fkey" FOREIGN KEY ("ledger_posting_id") REFERENCES "finance_ledger_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_fiscal_periods" ADD CONSTRAINT "finance_fiscal_periods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_journal_entries" ADD CONSTRAINT "finance_journal_entries_fiscal_period_id_fkey" FOREIGN KEY ("fiscal_period_id") REFERENCES "finance_fiscal_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_journal_entries" ADD CONSTRAINT "finance_journal_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_journal_lines" ADD CONSTRAINT "finance_journal_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "finance_chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_journal_lines" ADD CONSTRAINT "finance_journal_lines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_journal_lines" ADD CONSTRAINT "finance_journal_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "finance_journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_account_balances" ADD CONSTRAINT "finance_account_balances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_account_balance_snapshots" ADD CONSTRAINT "finance_account_balance_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_journal_reversals" ADD CONSTRAINT "finance_journal_reversals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_journal_reversals" ADD CONSTRAINT "finance_journal_reversals_original_journal_id_fkey" FOREIGN KEY ("original_journal_id") REFERENCES "finance_journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_journal_reversals" ADD CONSTRAINT "finance_journal_reversals_reversal_journal_id_fkey" FOREIGN KEY ("reversal_journal_id") REFERENCES "finance_journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_customers" ADD CONSTRAINT "finance_ar_customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_invoices" ADD CONSTRAINT "finance_ar_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_invoices" ADD CONSTRAINT "finance_ar_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "finance_ar_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_invoices" ADD CONSTRAINT "finance_ar_invoices_workflow_request_id_fkey" FOREIGN KEY ("workflow_request_id") REFERENCES "workflow_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_invoice_lines" ADD CONSTRAINT "finance_ar_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "finance_ar_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_payments" ADD CONSTRAINT "finance_ar_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_payment_allocations" ADD CONSTRAINT "finance_ar_payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "finance_ar_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_payment_allocations" ADD CONSTRAINT "finance_ar_payment_allocations_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "finance_ar_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_payment_allocations" ADD CONSTRAINT "finance_ar_payment_allocations_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "receivables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_credit_memos" ADD CONSTRAINT "finance_ar_credit_memos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_event_log" ADD CONSTRAINT "finance_ledger_event_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_event_log_archive" ADD CONSTRAINT "finance_ledger_event_log_archive_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_hash_anchors" ADD CONSTRAINT "finance_ledger_hash_anchors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ar_customer_credit_balances" ADD CONSTRAINT "finance_ar_customer_credit_balances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_bank_statements" ADD CONSTRAINT "finance_bank_statements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_bank_transactions" ADD CONSTRAINT "finance_bank_transactions_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "finance_bank_statements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_recon_matches" ADD CONSTRAINT "finance_recon_matches_bank_transaction_id_fkey" FOREIGN KEY ("bank_transaction_id") REFERENCES "finance_bank_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_recon_matches" ADD CONSTRAINT "finance_recon_matches_ledger_journal_id_fkey" FOREIGN KEY ("ledger_journal_id") REFERENCES "finance_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_tax_configs" ADD CONSTRAINT "finance_tax_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_tax_rules" ADD CONSTRAINT "finance_tax_rules_tax_config_id_fkey" FOREIGN KEY ("tax_config_id") REFERENCES "finance_tax_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_tax_rates" ADD CONSTRAINT "finance_tax_rates_tax_rule_id_fkey" FOREIGN KEY ("tax_rule_id") REFERENCES "finance_tax_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ap_payment_allocations" ADD CONSTRAINT "finance_ap_payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ap_payment_allocations" ADD CONSTRAINT "finance_ap_payment_allocations_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "payables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_lines" ADD CONSTRAINT "finance_budget_lines_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "hr_budget_scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_lines" ADD CONSTRAINT "finance_budget_lines_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_lines" ADD CONSTRAINT "finance_budget_lines_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_lines" ADD CONSTRAINT "finance_budget_lines_chartOfAccountId_fkey" FOREIGN KEY ("chartOfAccountId") REFERENCES "finance_chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_lines" ADD CONSTRAINT "finance_budget_lines_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "finance_fiscal_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_actuals" ADD CONSTRAINT "finance_budget_actuals_budget_line_id_fkey" FOREIGN KEY ("budget_line_id") REFERENCES "finance_budget_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_actuals" ADD CONSTRAINT "finance_budget_actuals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_actuals" ADD CONSTRAINT "finance_budget_actuals_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_actuals" ADD CONSTRAINT "finance_budget_actuals_budgetScenarioId_fkey" FOREIGN KEY ("budgetScenarioId") REFERENCES "hr_budget_scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_actuals" ADD CONSTRAINT "finance_budget_actuals_chartOfAccountId_fkey" FOREIGN KEY ("chartOfAccountId") REFERENCES "finance_chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budget_actuals" ADD CONSTRAINT "finance_budget_actuals_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "finance_fiscal_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expense_policies" ADD CONSTRAINT "finance_expense_policies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_bins" ADD CONSTRAINT "warehouse_bins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_bins" ADD CONSTRAINT "warehouse_bins_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bin_assignments" ADD CONSTRAINT "bin_assignments_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "warehouse_bins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bin_assignments" ADD CONSTRAINT "bin_assignments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bin_assignments" ADD CONSTRAINT "bin_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agentic_events" ADD CONSTRAINT "agentic_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_iot_events" ADD CONSTRAINT "inventory_iot_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
