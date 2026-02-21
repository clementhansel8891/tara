/*
  Warnings:

  - A unique constraint covering the columns `[company_id,description]` on the table `journal_entries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[company_id,name]` on the table `money_sources` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[company_id,name]` on the table `product_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[company_id,title]` on the table `retail_promotions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "supplier_masters" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tax_id" TEXT,
    "compliance_status" TEXT NOT NULL DEFAULT 'PENDING',
    "global_rating" INTEGER NOT NULL DEFAULT 0,
    "risk_tier" TEXT NOT NULL DEFAULT 'LOW',
    "categories" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "supplier_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_branches" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "branch_code" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "lead_time_days" INTEGER NOT NULL DEFAULT 0,
    "local_rating" INTEGER NOT NULL DEFAULT 0,
    "risk_tier" TEXT NOT NULL DEFAULT 'LOW',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "supplier_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_products" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "quality_score" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_requisitions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "branch_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "budget_class" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvals" JSONB,
    "supplier_id" TEXT,
    "supplier_branch_id" TEXT,
    "contract_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_draft_pos" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "requisition_id" TEXT NOT NULL,
    "branch_code" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_branch_id" TEXT NOT NULL,
    "contract_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "line_items" JSONB NOT NULL,
    "quoted_total" DECIMAL(15,2) NOT NULL,
    "quote_reference" TEXT,
    "quote_notes" TEXT,
    "quote_attachment" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_draft_pos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_final_pos" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "requisition_id" TEXT NOT NULL,
    "draft_po_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_branch_id" TEXT NOT NULL,
    "branch_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RELEASED',
    "total_amount" DECIMAL(15,2) NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_delivery_date" TIMESTAMP(3),
    "finance_commitment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_final_pos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_contracts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "requisition_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "legal_reviewed_by" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "signed_by_supplier" BOOLEAN NOT NULL DEFAULT false,
    "signed_by_proc_hod" BOOLEAN NOT NULL DEFAULT false,
    "signed_by_finance_hod" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "attachment_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_receipts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "final_po_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_branch_id" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_on_time" BOOLEAN NOT NULL DEFAULT true,
    "quantity_accuracy" INTEGER NOT NULL DEFAULT 100,
    "quality_score" INTEGER NOT NULL DEFAULT 100,
    "issue_count" INTEGER NOT NULL DEFAULT 0,
    "invoice_mismatch" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurement_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_rating_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_branch_id" TEXT NOT NULL,
    "supplier_score" INTEGER NOT NULL,
    "product_score" INTEGER NOT NULL,
    "risk_tier" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurement_rating_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_risk_signals" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "entity_id" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_risk_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_portal_messages" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_branch_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "related_entity_id" TEXT,
    "content" TEXT NOT NULL,
    "attachment_name" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_portal_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_audit_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurement_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_leads" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MARKETING',
    "owner_id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "potential_value" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "sla_due_at" TIMESTAMP(3) NOT NULL,
    "first_response_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_opportunities" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "account_name" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "probability" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "expected_close_date" TIMESTAMP(3) NOT NULL,
    "health" TEXT NOT NULL DEFAULT 'MEDIUM_RISK',
    "next_action" TEXT,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_quotes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(15,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "valid_until" TIMESTAMP(3) NOT NULL,
    "approval_by" TEXT,
    "approval_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_timeline_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'NOTE',
    "direction" TEXT NOT NULL DEFAULT 'INTERNAL',
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_tasks" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "opportunity_id" TEXT,
    "lead_id" TEXT,
    "title" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "due_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_alerts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "quote_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "inventory_check" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "finance_invoice_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_audit_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_providers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channels" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "max_amount_per_txn" DECIMAL(15,2) NOT NULL,
    "settlement_sla_hours" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "last_heartbeat_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_routing_policies" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priorities" TEXT[],
    "fallback_providers" TEXT[],
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "exponential_backoff_seconds" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_routing_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_pos_devices" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "device_code" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "provider_id" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pos_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_device_pools" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "primary_device_id" TEXT NOT NULL,
    "fallback_device_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_device_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "external_reference" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "destination" TEXT NOT NULL,
    "source" TEXT,
    "channel" TEXT NOT NULL,
    "provider_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUEST_CREATED',
    "ledger_sync_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_retry_attempts" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider_id" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "payment_retry_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_settlement_records" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "provider_reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_settlement_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_refunds" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FULL',
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "requested_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "provider_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_disputes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPENED',
    "opened_by" TEXT NOT NULL,
    "evidence" TEXT[],
    "provider_case_id" TEXT,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_chargebacks" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_chargebacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_evidence_packs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "provider_proof" TEXT NOT NULL,
    "approval_signatures" TEXT[],
    "checksum" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_evidence_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_audit_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_masters_company_id_idx" ON "supplier_masters"("company_id");

-- CreateIndex
CREATE INDEX "supplier_branches_company_id_idx" ON "supplier_branches"("company_id");

-- CreateIndex
CREATE INDEX "supplier_branches_supplier_id_idx" ON "supplier_branches"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_products_company_id_idx" ON "supplier_products"("company_id");

-- CreateIndex
CREATE INDEX "supplier_products_supplier_id_idx" ON "supplier_products"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_products_branch_id_idx" ON "supplier_products"("branch_id");

-- CreateIndex
CREATE INDEX "procurement_requisitions_company_id_idx" ON "procurement_requisitions"("company_id");

-- CreateIndex
CREATE INDEX "procurement_requisitions_requester_id_idx" ON "procurement_requisitions"("requester_id");

-- CreateIndex
CREATE INDEX "procurement_requisitions_department_id_idx" ON "procurement_requisitions"("department_id");

-- CreateIndex
CREATE INDEX "procurement_draft_pos_company_id_idx" ON "procurement_draft_pos"("company_id");

-- CreateIndex
CREATE INDEX "procurement_draft_pos_requisition_id_idx" ON "procurement_draft_pos"("requisition_id");

-- CreateIndex
CREATE INDEX "procurement_final_pos_company_id_idx" ON "procurement_final_pos"("company_id");

-- CreateIndex
CREATE INDEX "procurement_final_pos_requisition_id_idx" ON "procurement_final_pos"("requisition_id");

-- CreateIndex
CREATE INDEX "procurement_contracts_company_id_idx" ON "procurement_contracts"("company_id");

-- CreateIndex
CREATE INDEX "procurement_contracts_requisition_id_idx" ON "procurement_contracts"("requisition_id");

-- CreateIndex
CREATE INDEX "procurement_receipts_company_id_idx" ON "procurement_receipts"("company_id");

-- CreateIndex
CREATE INDEX "procurement_receipts_final_po_id_idx" ON "procurement_receipts"("final_po_id");

-- CreateIndex
CREATE INDEX "procurement_rating_logs_company_id_idx" ON "procurement_rating_logs"("company_id");

-- CreateIndex
CREATE INDEX "procurement_rating_logs_supplier_id_idx" ON "procurement_rating_logs"("supplier_id");

-- CreateIndex
CREATE INDEX "procurement_risk_signals_company_id_idx" ON "procurement_risk_signals"("company_id");

-- CreateIndex
CREATE INDEX "procurement_risk_signals_status_idx" ON "procurement_risk_signals"("status");

-- CreateIndex
CREATE INDEX "supplier_portal_messages_company_id_idx" ON "supplier_portal_messages"("company_id");

-- CreateIndex
CREATE INDEX "supplier_portal_messages_supplier_id_idx" ON "supplier_portal_messages"("supplier_id");

-- CreateIndex
CREATE INDEX "procurement_audit_events_company_id_idx" ON "procurement_audit_events"("company_id");

-- CreateIndex
CREATE INDEX "procurement_audit_events_entity_id_idx" ON "procurement_audit_events"("entity_id");

-- CreateIndex
CREATE INDEX "sales_leads_company_id_idx" ON "sales_leads"("company_id");

-- CreateIndex
CREATE INDEX "sales_leads_status_idx" ON "sales_leads"("status");

-- CreateIndex
CREATE INDEX "sales_opportunities_company_id_idx" ON "sales_opportunities"("company_id");

-- CreateIndex
CREATE INDEX "sales_opportunities_stage_idx" ON "sales_opportunities"("stage");

-- CreateIndex
CREATE INDEX "sales_quotes_company_id_idx" ON "sales_quotes"("company_id");

-- CreateIndex
CREATE INDEX "sales_quotes_opportunity_id_idx" ON "sales_quotes"("opportunity_id");

-- CreateIndex
CREATE INDEX "sales_timeline_events_company_id_idx" ON "sales_timeline_events"("company_id");

-- CreateIndex
CREATE INDEX "sales_timeline_events_opportunity_id_idx" ON "sales_timeline_events"("opportunity_id");

-- CreateIndex
CREATE INDEX "sales_tasks_company_id_idx" ON "sales_tasks"("company_id");

-- CreateIndex
CREATE INDEX "sales_tasks_owner_id_idx" ON "sales_tasks"("owner_id");

-- CreateIndex
CREATE INDEX "sales_alerts_company_id_idx" ON "sales_alerts"("company_id");

-- CreateIndex
CREATE INDEX "sales_alerts_acknowledged_idx" ON "sales_alerts"("acknowledged");

-- CreateIndex
CREATE INDEX "sales_orders_company_id_idx" ON "sales_orders"("company_id");

-- CreateIndex
CREATE INDEX "sales_orders_status_idx" ON "sales_orders"("status");

-- CreateIndex
CREATE INDEX "sales_audit_events_company_id_idx" ON "sales_audit_events"("company_id");

-- CreateIndex
CREATE INDEX "sales_audit_events_entity_id_idx" ON "sales_audit_events"("entity_id");

-- CreateIndex
CREATE INDEX "payment_providers_company_id_idx" ON "payment_providers"("company_id");

-- CreateIndex
CREATE INDEX "payment_routing_policies_company_id_idx" ON "payment_routing_policies"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_pos_devices_device_code_key" ON "payment_pos_devices"("device_code");

-- CreateIndex
CREATE INDEX "payment_pos_devices_company_id_idx" ON "payment_pos_devices"("company_id");

-- CreateIndex
CREATE INDEX "payment_pos_devices_location_id_idx" ON "payment_pos_devices"("location_id");

-- CreateIndex
CREATE INDEX "payment_device_pools_company_id_idx" ON "payment_device_pools"("company_id");

-- CreateIndex
CREATE INDEX "payment_device_pools_location_id_idx" ON "payment_device_pools"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_idempotency_key_key" ON "payment_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_transactions_company_id_idx" ON "payment_transactions"("company_id");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_idempotency_key_idx" ON "payment_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_retry_attempts_transaction_id_idx" ON "payment_retry_attempts"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_settlement_records_payment_id_key" ON "payment_settlement_records"("payment_id");

-- CreateIndex
CREATE INDEX "payment_settlement_records_company_id_idx" ON "payment_settlement_records"("company_id");

-- CreateIndex
CREATE INDEX "payment_refunds_company_id_idx" ON "payment_refunds"("company_id");

-- CreateIndex
CREATE INDEX "payment_refunds_payment_id_idx" ON "payment_refunds"("payment_id");

-- CreateIndex
CREATE INDEX "payment_disputes_company_id_idx" ON "payment_disputes"("company_id");

-- CreateIndex
CREATE INDEX "payment_disputes_payment_id_idx" ON "payment_disputes"("payment_id");

-- CreateIndex
CREATE INDEX "payment_chargebacks_company_id_idx" ON "payment_chargebacks"("company_id");

-- CreateIndex
CREATE INDEX "payment_chargebacks_payment_id_idx" ON "payment_chargebacks"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_evidence_packs_payment_id_key" ON "payment_evidence_packs"("payment_id");

-- CreateIndex
CREATE INDEX "payment_evidence_packs_company_id_idx" ON "payment_evidence_packs"("company_id");

-- CreateIndex
CREATE INDEX "payment_audit_events_company_id_idx" ON "payment_audit_events"("company_id");

-- CreateIndex
CREATE INDEX "payment_audit_events_entity_id_idx" ON "payment_audit_events"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_company_id_description_key" ON "journal_entries"("company_id", "description");

-- CreateIndex
CREATE UNIQUE INDEX "money_sources_company_id_name_key" ON "money_sources"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_company_id_name_key" ON "product_categories"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "retail_promotions_company_id_title_key" ON "retail_promotions"("company_id", "title");

-- AddForeignKey
ALTER TABLE "supplier_masters" ADD CONSTRAINT "supplier_masters_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_branches" ADD CONSTRAINT "supplier_branches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_branches" ADD CONSTRAINT "supplier_branches_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "supplier_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requisitions" ADD CONSTRAINT "procurement_requisitions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requisitions" ADD CONSTRAINT "procurement_requisitions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requisitions" ADD CONSTRAINT "procurement_requisitions_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requisitions" ADD CONSTRAINT "procurement_requisitions_supplier_branch_id_fkey" FOREIGN KEY ("supplier_branch_id") REFERENCES "supplier_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requisitions" ADD CONSTRAINT "procurement_requisitions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_masters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_draft_pos" ADD CONSTRAINT "procurement_draft_pos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_draft_pos" ADD CONSTRAINT "procurement_draft_pos_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "procurement_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_draft_pos" ADD CONSTRAINT "procurement_draft_pos_supplier_branch_id_fkey" FOREIGN KEY ("supplier_branch_id") REFERENCES "supplier_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_draft_pos" ADD CONSTRAINT "procurement_draft_pos_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_final_pos" ADD CONSTRAINT "procurement_final_pos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_final_pos" ADD CONSTRAINT "procurement_final_pos_draft_po_id_fkey" FOREIGN KEY ("draft_po_id") REFERENCES "procurement_draft_pos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_final_pos" ADD CONSTRAINT "procurement_final_pos_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "procurement_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_final_pos" ADD CONSTRAINT "procurement_final_pos_supplier_branch_id_fkey" FOREIGN KEY ("supplier_branch_id") REFERENCES "supplier_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_final_pos" ADD CONSTRAINT "procurement_final_pos_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_contracts" ADD CONSTRAINT "procurement_contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_contracts" ADD CONSTRAINT "procurement_contracts_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "procurement_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_contracts" ADD CONSTRAINT "procurement_contracts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_receipts" ADD CONSTRAINT "procurement_receipts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_receipts" ADD CONSTRAINT "procurement_receipts_final_po_id_fkey" FOREIGN KEY ("final_po_id") REFERENCES "procurement_final_pos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_receipts" ADD CONSTRAINT "procurement_receipts_supplier_branch_id_fkey" FOREIGN KEY ("supplier_branch_id") REFERENCES "supplier_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_receipts" ADD CONSTRAINT "procurement_receipts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_rating_logs" ADD CONSTRAINT "procurement_rating_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_rating_logs" ADD CONSTRAINT "procurement_rating_logs_supplier_branch_id_fkey" FOREIGN KEY ("supplier_branch_id") REFERENCES "supplier_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_rating_logs" ADD CONSTRAINT "procurement_rating_logs_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_risk_signals" ADD CONSTRAINT "procurement_risk_signals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_portal_messages" ADD CONSTRAINT "supplier_portal_messages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_portal_messages" ADD CONSTRAINT "supplier_portal_messages_supplier_branch_id_fkey" FOREIGN KEY ("supplier_branch_id") REFERENCES "supplier_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_portal_messages" ADD CONSTRAINT "supplier_portal_messages_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_audit_events" ADD CONSTRAINT "procurement_audit_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "sales_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_timeline_events" ADD CONSTRAINT "sales_timeline_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_timeline_events" ADD CONSTRAINT "sales_timeline_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "sales_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_timeline_events" ADD CONSTRAINT "sales_timeline_events_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_tasks" ADD CONSTRAINT "sales_tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_tasks" ADD CONSTRAINT "sales_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "sales_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_tasks" ADD CONSTRAINT "sales_tasks_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_alerts" ADD CONSTRAINT "sales_alerts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "sales_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_audit_events" ADD CONSTRAINT "sales_audit_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_providers" ADD CONSTRAINT "payment_providers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_routing_policies" ADD CONSTRAINT "payment_routing_policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_pos_devices" ADD CONSTRAINT "payment_pos_devices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_pos_devices" ADD CONSTRAINT "payment_pos_devices_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_device_pools" ADD CONSTRAINT "payment_device_pools_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_retry_attempts" ADD CONSTRAINT "payment_retry_attempts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_retry_attempts" ADD CONSTRAINT "payment_retry_attempts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_settlement_records" ADD CONSTRAINT "payment_settlement_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_settlement_records" ADD CONSTRAINT "payment_settlement_records_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_chargebacks" ADD CONSTRAINT "payment_chargebacks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_chargebacks" ADD CONSTRAINT "payment_chargebacks_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "payment_disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_chargebacks" ADD CONSTRAINT "payment_chargebacks_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_evidence_packs" ADD CONSTRAINT "payment_evidence_packs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_evidence_packs" ADD CONSTRAINT "payment_evidence_packs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_audit_events" ADD CONSTRAINT "payment_audit_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
