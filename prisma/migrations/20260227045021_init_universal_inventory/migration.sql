/*
  Warnings:

  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('ITEM', 'SERVICE', 'RAW_MATERIAL');

-- DropForeignKey
ALTER TABLE "inventory_adjustments" DROP CONSTRAINT "inventory_adjustments_item_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_pool_stock" DROP CONSTRAINT "inventory_pool_stock_product_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_company_id_fkey";

-- DropForeignKey
ALTER TABLE "retail_cart_items" DROP CONSTRAINT "retail_cart_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "retail_order_items" DROP CONSTRAINT "retail_order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "retail_wishlist_items" DROP CONSTRAINT "retail_wishlist_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_levels" DROP CONSTRAINT "stock_levels_product_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_product_id_fkey";

-- AlterTable
ALTER TABLE "admin_requests" ADD COLUMN     "resolved_by" TEXT;

-- DropTable
DROP TABLE "products";

-- CreateTable
CREATE TABLE "item_masters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "base_price" DECIMAL(15,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.11,
    "image_url" TEXT,
    "module_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "type" "ItemType" NOT NULL DEFAULT 'ITEM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "label_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT,
    "module_type" TEXT NOT NULL,
    "labels" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "label_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_projections" (
    "id" TEXT NOT NULL,
    "item_master_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT,
    "module_type" TEXT NOT NULL,
    "custom_name" TEXT,
    "custom_description" TEXT,
    "price" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_projections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_masters_tenant_id_idx" ON "item_masters"("tenant_id");

-- CreateIndex
CREATE INDEX "item_masters_category_id_idx" ON "item_masters"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_masters_tenant_id_sku_key" ON "item_masters"("tenant_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "item_masters_tenant_id_barcode_key" ON "item_masters"("tenant_id", "barcode");

-- CreateIndex
CREATE INDEX "label_configs_tenant_id_idx" ON "label_configs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "label_configs_tenant_id_location_id_module_type_key" ON "label_configs"("tenant_id", "location_id", "module_type");

-- CreateIndex
CREATE INDEX "product_projections_tenant_id_idx" ON "product_projections"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_projections_item_master_id_tenant_id_location_id_mo_key" ON "product_projections"("item_master_id", "tenant_id", "location_id", "module_type");

-- RenameForeignKey
ALTER TABLE "attendance_records" RENAME CONSTRAINT "attendance_records_company_id_fkey" TO "attendance_records_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "audit_logs" RENAME CONSTRAINT "audit_logs_company_id_fkey" TO "audit_logs_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "capex_requests" RENAME CONSTRAINT "capex_requests_company_id_fkey" TO "capex_requests_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "contracts" RENAME CONSTRAINT "contracts_company_id_fkey" TO "contracts_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "departments" RENAME CONSTRAINT "departments_company_id_fkey" TO "departments_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "ecommerce_connectors" RENAME CONSTRAINT "ecommerce_connectors_company_id_fkey" TO "ecommerce_connectors_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "emergency_overrides" RENAME CONSTRAINT "emergency_overrides_company_id_fkey" TO "emergency_overrides_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "employees" RENAME CONSTRAINT "employees_company_id_fkey" TO "employees_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "fixed_assets" RENAME CONSTRAINT "fixed_assets_company_id_fkey" TO "fixed_assets_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "hr_cases" RENAME CONSTRAINT "hr_cases_company_id_fkey" TO "hr_cases_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "inventory_adjustments" RENAME CONSTRAINT "inventory_adjustments_company_id_fkey" TO "inventory_adjustments_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "inventory_alerts" RENAME CONSTRAINT "inventory_alerts_company_id_fkey" TO "inventory_alerts_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "inventory_audit_cycles" RENAME CONSTRAINT "inventory_audit_cycles_company_id_fkey" TO "inventory_audit_cycles_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "inventory_integration_events" RENAME CONSTRAINT "inventory_integration_events_company_id_fkey" TO "inventory_integration_events_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "inventory_pools" RENAME CONSTRAINT "inventory_pools_company_id_fkey" TO "inventory_pools_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "it_devices" RENAME CONSTRAINT "it_devices_company_id_fkey" TO "it_devices_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "it_provisioning_requests" RENAME CONSTRAINT "it_provisioning_requests_company_id_fkey" TO "it_provisioning_requests_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "it_settings" RENAME CONSTRAINT "it_settings_company_id_fkey" TO "it_settings_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "it_system_health" RENAME CONSTRAINT "it_system_health_company_id_fkey" TO "it_system_health_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "job_requisitions" RENAME CONSTRAINT "job_requisitions_company_id_fkey" TO "job_requisitions_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "journal_entries" RENAME CONSTRAINT "journal_entries_company_id_fkey" TO "journal_entries_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "leave_requests" RENAME CONSTRAINT "leave_requests_company_id_fkey" TO "leave_requests_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "locations" RENAME CONSTRAINT "locations_company_id_fkey" TO "locations_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "marketing_accounts" RENAME CONSTRAINT "marketing_accounts_company_id_fkey" TO "marketing_accounts_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "marketing_alerts" RENAME CONSTRAINT "marketing_alerts_company_id_fkey" TO "marketing_alerts_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "marketing_attribution" RENAME CONSTRAINT "marketing_attribution_company_id_fkey" TO "marketing_attribution_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "marketing_audit_events" RENAME CONSTRAINT "marketing_audit_events_company_id_fkey" TO "marketing_audit_events_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "marketing_campaigns" RENAME CONSTRAINT "marketing_campaigns_company_id_fkey" TO "marketing_campaigns_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "marketing_executions" RENAME CONSTRAINT "marketing_executions_company_id_fkey" TO "marketing_executions_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "marketing_leads" RENAME CONSTRAINT "marketing_leads_company_id_fkey" TO "marketing_leads_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "marketing_workflows" RENAME CONSTRAINT "marketing_workflows_company_id_fkey" TO "marketing_workflows_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "money_sources" RENAME CONSTRAINT "money_sources_company_id_fkey" TO "money_sources_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payables" RENAME CONSTRAINT "payables_company_id_fkey" TO "payables_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_audit_events" RENAME CONSTRAINT "payment_audit_events_company_id_fkey" TO "payment_audit_events_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_chargebacks" RENAME CONSTRAINT "payment_chargebacks_company_id_fkey" TO "payment_chargebacks_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_device_pools" RENAME CONSTRAINT "payment_device_pools_company_id_fkey" TO "payment_device_pools_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_disputes" RENAME CONSTRAINT "payment_disputes_company_id_fkey" TO "payment_disputes_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_evidence_packs" RENAME CONSTRAINT "payment_evidence_packs_company_id_fkey" TO "payment_evidence_packs_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_pos_devices" RENAME CONSTRAINT "payment_pos_devices_company_id_fkey" TO "payment_pos_devices_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_providers" RENAME CONSTRAINT "payment_providers_company_id_fkey" TO "payment_providers_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_refunds" RENAME CONSTRAINT "payment_refunds_company_id_fkey" TO "payment_refunds_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_routing_policies" RENAME CONSTRAINT "payment_routing_policies_company_id_fkey" TO "payment_routing_policies_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_settlements" RENAME CONSTRAINT "payment_settlements_company_id_fkey" TO "payment_settlements_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_transactions" RENAME CONSTRAINT "payment_transactions_company_id_fkey" TO "payment_transactions_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payroll_lines" RENAME CONSTRAINT "payroll_lines_company_id_fkey" TO "payroll_lines_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "payroll_runs" RENAME CONSTRAINT "payroll_runs_company_id_fkey" TO "payroll_runs_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "performance_cycles" RENAME CONSTRAINT "performance_cycles_company_id_fkey" TO "performance_cycles_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "performance_reviews" RENAME CONSTRAINT "performance_reviews_company_id_fkey" TO "performance_reviews_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "pos_devices" RENAME CONSTRAINT "pos_devices_company_id_fkey" TO "pos_devices_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "procurement_audit_events" RENAME CONSTRAINT "procurement_audit_events_company_id_fkey" TO "procurement_audit_events_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "procurement_contracts" RENAME CONSTRAINT "procurement_contracts_company_id_fkey" TO "procurement_contracts_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "procurement_draft_pos" RENAME CONSTRAINT "procurement_draft_pos_company_id_fkey" TO "procurement_draft_pos_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "procurement_final_pos" RENAME CONSTRAINT "procurement_final_pos_company_id_fkey" TO "procurement_final_pos_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "procurement_rating_logs" RENAME CONSTRAINT "procurement_rating_logs_company_id_fkey" TO "procurement_rating_logs_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "procurement_receipts" RENAME CONSTRAINT "procurement_receipts_company_id_fkey" TO "procurement_receipts_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "procurement_requisitions" RENAME CONSTRAINT "procurement_requisitions_company_id_fkey" TO "procurement_requisitions_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "procurement_risk_signals" RENAME CONSTRAINT "procurement_risk_signals_company_id_fkey" TO "procurement_risk_signals_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "product_categories" RENAME CONSTRAINT "product_categories_company_id_fkey" TO "product_categories_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "receivables" RENAME CONSTRAINT "receivables_company_id_fkey" TO "receivables_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "retail_carts" RENAME CONSTRAINT "retail_carts_company_id_fkey" TO "retail_carts_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "retail_channels" RENAME CONSTRAINT "retail_channels_company_id_fkey" TO "retail_channels_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "retail_customer_sessions" RENAME CONSTRAINT "retail_customer_sessions_company_id_fkey" TO "retail_customer_sessions_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "retail_customers" RENAME CONSTRAINT "retail_customers_company_id_fkey" TO "retail_customers_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "retail_gateway_nodes" RENAME CONSTRAINT "retail_gateway_nodes_company_id_fkey" TO "retail_gateway_nodes_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "retail_load_balancers" RENAME CONSTRAINT "retail_load_balancers_company_id_fkey" TO "retail_load_balancers_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "retail_orders" RENAME CONSTRAINT "retail_orders_company_id_fkey" TO "retail_orders_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "retail_promotions" RENAME CONSTRAINT "retail_promotions_company_id_fkey" TO "retail_promotions_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "retail_shifts" RENAME CONSTRAINT "retail_shifts_company_id_fkey" TO "retail_shifts_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "retail_wishlists" RENAME CONSTRAINT "retail_wishlists_company_id_fkey" TO "retail_wishlists_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_alerts" RENAME CONSTRAINT "sales_alerts_company_id_fkey" TO "sales_alerts_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_audit_events" RENAME CONSTRAINT "sales_audit_events_company_id_fkey" TO "sales_audit_events_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_leads" RENAME CONSTRAINT "sales_leads_company_id_fkey" TO "sales_leads_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_opportunities" RENAME CONSTRAINT "sales_opportunities_company_id_fkey" TO "sales_opportunities_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "sales_orders_company_id_fkey" TO "sales_orders_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_quotes" RENAME CONSTRAINT "sales_quotes_company_id_fkey" TO "sales_quotes_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_tasks" RENAME CONSTRAINT "sales_tasks_company_id_fkey" TO "sales_tasks_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_timeline_events" RENAME CONSTRAINT "sales_timeline_events_company_id_fkey" TO "sales_timeline_events_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "schedule_assignments" RENAME CONSTRAINT "schedule_assignments_company_id_fkey" TO "schedule_assignments_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "settlement_records" RENAME CONSTRAINT "settlement_records_company_id_fkey" TO "settlement_records_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "shift_swap_requests" RENAME CONSTRAINT "shift_swap_requests_company_id_fkey" TO "shift_swap_requests_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "shifts" RENAME CONSTRAINT "shifts_company_id_fkey" TO "shifts_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_levels" RENAME CONSTRAINT "stock_levels_company_id_fkey" TO "stock_levels_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_movements" RENAME CONSTRAINT "stock_movements_company_id_fkey" TO "stock_movements_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "stores" RENAME CONSTRAINT "stores_company_id_fkey" TO "stores_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "supplier_branches" RENAME CONSTRAINT "supplier_branches_company_id_fkey" TO "supplier_branches_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "supplier_masters" RENAME CONSTRAINT "supplier_masters_company_id_fkey" TO "supplier_masters_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "supplier_portal_messages" RENAME CONSTRAINT "supplier_portal_messages_company_id_fkey" TO "supplier_portal_messages_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "supplier_products" RENAME CONSTRAINT "supplier_products_company_id_fkey" TO "supplier_products_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "training_assignments" RENAME CONSTRAINT "training_assignments_company_id_fkey" TO "training_assignments_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "training_programs" RENAME CONSTRAINT "training_programs_company_id_fkey" TO "training_programs_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "treasury_transfers" RENAME CONSTRAINT "treasury_transfers_company_id_fkey" TO "treasury_transfers_tenant_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_companies" RENAME CONSTRAINT "user_companies_company_id_fkey" TO "user_companies_tenant_id_fkey";

-- AddForeignKey
ALTER TABLE "item_masters" ADD CONSTRAINT "item_masters_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_masters" ADD CONSTRAINT "item_masters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "label_configs" ADD CONSTRAINT "label_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "label_configs" ADD CONSTRAINT "label_configs_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_projections" ADD CONSTRAINT "product_projections_item_master_id_fkey" FOREIGN KEY ("item_master_id") REFERENCES "item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_projections" ADD CONSTRAINT "product_projections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_projections" ADD CONSTRAINT "product_projections_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail_cart_items" ADD CONSTRAINT "retail_cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail_wishlist_items" ADD CONSTRAINT "retail_wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail_order_items" ADD CONSTRAINT "retail_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_pool_stock" ADD CONSTRAINT "inventory_pool_stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "attendance_records_company_id_idx" RENAME TO "attendance_records_tenant_id_idx";

-- RenameIndex
ALTER INDEX "audit_logs_company_id_idx" RENAME TO "audit_logs_tenant_id_idx";

-- RenameIndex
ALTER INDEX "capex_requests_company_id_idx" RENAME TO "capex_requests_tenant_id_idx";

-- RenameIndex
ALTER INDEX "contracts_company_id_idx" RENAME TO "contracts_tenant_id_idx";

-- RenameIndex
ALTER INDEX "departments_company_id_code_key" RENAME TO "departments_tenant_id_code_key";

-- RenameIndex
ALTER INDEX "departments_company_id_idx" RENAME TO "departments_tenant_id_idx";

-- RenameIndex
ALTER INDEX "ecommerce_connectors_company_id_idx" RENAME TO "ecommerce_connectors_tenant_id_idx";

-- RenameIndex
ALTER INDEX "employees_company_id_employee_code_key" RENAME TO "employees_tenant_id_employee_code_key";

-- RenameIndex
ALTER INDEX "employees_company_id_idx" RENAME TO "employees_tenant_id_idx";

-- RenameIndex
ALTER INDEX "fixed_assets_company_id_idx" RENAME TO "fixed_assets_tenant_id_idx";

-- RenameIndex
ALTER INDEX "hr_cases_company_id_idx" RENAME TO "hr_cases_tenant_id_idx";

-- RenameIndex
ALTER INDEX "inventory_adjustments_company_id_idx" RENAME TO "inventory_adjustments_tenant_id_idx";

-- RenameIndex
ALTER INDEX "inventory_alerts_company_id_idx" RENAME TO "inventory_alerts_tenant_id_idx";

-- RenameIndex
ALTER INDEX "inventory_audit_cycles_company_id_idx" RENAME TO "inventory_audit_cycles_tenant_id_idx";

-- RenameIndex
ALTER INDEX "inventory_integration_events_company_id_idx" RENAME TO "inventory_integration_events_tenant_id_idx";

-- RenameIndex
ALTER INDEX "inventory_pools_company_id_idx" RENAME TO "inventory_pools_tenant_id_idx";

-- RenameIndex
ALTER INDEX "it_devices_company_id_idx" RENAME TO "it_devices_tenant_id_idx";

-- RenameIndex
ALTER INDEX "it_provisioning_requests_company_id_idx" RENAME TO "it_provisioning_requests_tenant_id_idx";

-- RenameIndex
ALTER INDEX "it_settings_company_id_idx" RENAME TO "it_settings_tenant_id_idx";

-- RenameIndex
ALTER INDEX "it_settings_company_id_key_key" RENAME TO "it_settings_tenant_id_key_key";

-- RenameIndex
ALTER INDEX "it_system_health_company_id_idx" RENAME TO "it_system_health_tenant_id_idx";

-- RenameIndex
ALTER INDEX "job_requisitions_company_id_idx" RENAME TO "job_requisitions_tenant_id_idx";

-- RenameIndex
ALTER INDEX "journal_entries_company_id_description_key" RENAME TO "journal_entries_tenant_id_description_key";

-- RenameIndex
ALTER INDEX "journal_entries_company_id_idx" RENAME TO "journal_entries_tenant_id_idx";

-- RenameIndex
ALTER INDEX "leave_requests_company_id_idx" RENAME TO "leave_requests_tenant_id_idx";

-- RenameIndex
ALTER INDEX "locations_company_id_code_key" RENAME TO "locations_tenant_id_code_key";

-- RenameIndex
ALTER INDEX "locations_company_id_idx" RENAME TO "locations_tenant_id_idx";

-- RenameIndex
ALTER INDEX "marketing_accounts_company_id_idx" RENAME TO "marketing_accounts_tenant_id_idx";

-- RenameIndex
ALTER INDEX "marketing_alerts_company_id_idx" RENAME TO "marketing_alerts_tenant_id_idx";

-- RenameIndex
ALTER INDEX "marketing_attribution_company_id_idx" RENAME TO "marketing_attribution_tenant_id_idx";

-- RenameIndex
ALTER INDEX "marketing_audit_events_company_id_idx" RENAME TO "marketing_audit_events_tenant_id_idx";

-- RenameIndex
ALTER INDEX "marketing_campaigns_company_id_idx" RENAME TO "marketing_campaigns_tenant_id_idx";

-- RenameIndex
ALTER INDEX "marketing_executions_company_id_idx" RENAME TO "marketing_executions_tenant_id_idx";

-- RenameIndex
ALTER INDEX "marketing_leads_company_id_dedup_key_key" RENAME TO "marketing_leads_tenant_id_dedup_key_key";

-- RenameIndex
ALTER INDEX "marketing_leads_company_id_idx" RENAME TO "marketing_leads_tenant_id_idx";

-- RenameIndex
ALTER INDEX "marketing_workflows_company_id_idx" RENAME TO "marketing_workflows_tenant_id_idx";

-- RenameIndex
ALTER INDEX "money_sources_company_id_idx" RENAME TO "money_sources_tenant_id_idx";

-- RenameIndex
ALTER INDEX "money_sources_company_id_name_key" RENAME TO "money_sources_tenant_id_name_key";

-- RenameIndex
ALTER INDEX "payables_company_id_idx" RENAME TO "payables_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_audit_events_company_id_idx" RENAME TO "payment_audit_events_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_chargebacks_company_id_idx" RENAME TO "payment_chargebacks_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_device_pools_company_id_idx" RENAME TO "payment_device_pools_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_disputes_company_id_idx" RENAME TO "payment_disputes_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_evidence_packs_company_id_idx" RENAME TO "payment_evidence_packs_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_pos_devices_company_id_idx" RENAME TO "payment_pos_devices_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_providers_company_id_idx" RENAME TO "payment_providers_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_refunds_company_id_idx" RENAME TO "payment_refunds_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_routing_policies_company_id_idx" RENAME TO "payment_routing_policies_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_settlements_company_id_idx" RENAME TO "payment_settlements_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payment_transactions_company_id_idx" RENAME TO "payment_transactions_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payroll_lines_company_id_idx" RENAME TO "payroll_lines_tenant_id_idx";

-- RenameIndex
ALTER INDEX "payroll_runs_company_id_idx" RENAME TO "payroll_runs_tenant_id_idx";

-- RenameIndex
ALTER INDEX "performance_cycles_company_id_idx" RENAME TO "performance_cycles_tenant_id_idx";

-- RenameIndex
ALTER INDEX "performance_reviews_company_id_idx" RENAME TO "performance_reviews_tenant_id_idx";

-- RenameIndex
ALTER INDEX "pos_devices_company_id_idx" RENAME TO "pos_devices_tenant_id_idx";

-- RenameIndex
ALTER INDEX "procurement_audit_events_company_id_idx" RENAME TO "procurement_audit_events_tenant_id_idx";

-- RenameIndex
ALTER INDEX "procurement_contracts_company_id_idx" RENAME TO "procurement_contracts_tenant_id_idx";

-- RenameIndex
ALTER INDEX "procurement_draft_pos_company_id_idx" RENAME TO "procurement_draft_pos_tenant_id_idx";

-- RenameIndex
ALTER INDEX "procurement_final_pos_company_id_idx" RENAME TO "procurement_final_pos_tenant_id_idx";

-- RenameIndex
ALTER INDEX "procurement_rating_logs_company_id_idx" RENAME TO "procurement_rating_logs_tenant_id_idx";

-- RenameIndex
ALTER INDEX "procurement_receipts_company_id_idx" RENAME TO "procurement_receipts_tenant_id_idx";

-- RenameIndex
ALTER INDEX "procurement_requisitions_company_id_idx" RENAME TO "procurement_requisitions_tenant_id_idx";

-- RenameIndex
ALTER INDEX "procurement_risk_signals_company_id_idx" RENAME TO "procurement_risk_signals_tenant_id_idx";

-- RenameIndex
ALTER INDEX "product_categories_company_id_idx" RENAME TO "product_categories_tenant_id_idx";

-- RenameIndex
ALTER INDEX "product_categories_company_id_name_key" RENAME TO "product_categories_tenant_id_name_key";

-- RenameIndex
ALTER INDEX "receivables_company_id_idx" RENAME TO "receivables_tenant_id_idx";

-- RenameIndex
ALTER INDEX "retail_carts_company_id_idx" RENAME TO "retail_carts_tenant_id_idx";

-- RenameIndex
ALTER INDEX "retail_channels_company_id_idx" RENAME TO "retail_channels_tenant_id_idx";

-- RenameIndex
ALTER INDEX "retail_customer_sessions_company_id_idx" RENAME TO "retail_customer_sessions_tenant_id_idx";

-- RenameIndex
ALTER INDEX "retail_customers_company_id_email_key" RENAME TO "retail_customers_tenant_id_email_key";

-- RenameIndex
ALTER INDEX "retail_customers_company_id_idx" RENAME TO "retail_customers_tenant_id_idx";

-- RenameIndex
ALTER INDEX "retail_customers_company_id_phone_key" RENAME TO "retail_customers_tenant_id_phone_key";

-- RenameIndex
ALTER INDEX "retail_gateway_nodes_company_id_idx" RENAME TO "retail_gateway_nodes_tenant_id_idx";

-- RenameIndex
ALTER INDEX "retail_load_balancers_company_id_idx" RENAME TO "retail_load_balancers_tenant_id_idx";

-- RenameIndex
ALTER INDEX "retail_orders_company_id_idx" RENAME TO "retail_orders_tenant_id_idx";

-- RenameIndex
ALTER INDEX "retail_promotions_company_id_idx" RENAME TO "retail_promotions_tenant_id_idx";

-- RenameIndex
ALTER INDEX "retail_promotions_company_id_title_key" RENAME TO "retail_promotions_tenant_id_title_key";

-- RenameIndex
ALTER INDEX "retail_shifts_company_id_idx" RENAME TO "retail_shifts_tenant_id_idx";

-- RenameIndex
ALTER INDEX "retail_wishlists_company_id_idx" RENAME TO "retail_wishlists_tenant_id_idx";

-- RenameIndex
ALTER INDEX "sales_alerts_company_id_idx" RENAME TO "sales_alerts_tenant_id_idx";

-- RenameIndex
ALTER INDEX "sales_audit_events_company_id_idx" RENAME TO "sales_audit_events_tenant_id_idx";

-- RenameIndex
ALTER INDEX "sales_leads_company_id_idx" RENAME TO "sales_leads_tenant_id_idx";

-- RenameIndex
ALTER INDEX "sales_opportunities_company_id_idx" RENAME TO "sales_opportunities_tenant_id_idx";

-- RenameIndex
ALTER INDEX "sales_orders_company_id_idx" RENAME TO "sales_orders_tenant_id_idx";

-- RenameIndex
ALTER INDEX "sales_quotes_company_id_idx" RENAME TO "sales_quotes_tenant_id_idx";

-- RenameIndex
ALTER INDEX "sales_tasks_company_id_idx" RENAME TO "sales_tasks_tenant_id_idx";

-- RenameIndex
ALTER INDEX "sales_timeline_events_company_id_idx" RENAME TO "sales_timeline_events_tenant_id_idx";

-- RenameIndex
ALTER INDEX "schedule_assignments_company_id_idx" RENAME TO "schedule_assignments_tenant_id_idx";

-- RenameIndex
ALTER INDEX "settlement_records_company_id_idx" RENAME TO "settlement_records_tenant_id_idx";

-- RenameIndex
ALTER INDEX "shifts_company_id_idx" RENAME TO "shifts_tenant_id_idx";

-- RenameIndex
ALTER INDEX "stock_levels_company_id_idx" RENAME TO "stock_levels_tenant_id_idx";

-- RenameIndex
ALTER INDEX "stock_movements_company_id_idx" RENAME TO "stock_movements_tenant_id_idx";

-- RenameIndex
ALTER INDEX "stores_company_id_code_key" RENAME TO "stores_tenant_id_code_key";

-- RenameIndex
ALTER INDEX "stores_company_id_idx" RENAME TO "stores_tenant_id_idx";

-- RenameIndex
ALTER INDEX "supplier_branches_company_id_idx" RENAME TO "supplier_branches_tenant_id_idx";

-- RenameIndex
ALTER INDEX "supplier_masters_company_id_idx" RENAME TO "supplier_masters_tenant_id_idx";

-- RenameIndex
ALTER INDEX "supplier_portal_messages_company_id_idx" RENAME TO "supplier_portal_messages_tenant_id_idx";

-- RenameIndex
ALTER INDEX "supplier_products_company_id_idx" RENAME TO "supplier_products_tenant_id_idx";

-- RenameIndex
ALTER INDEX "training_assignments_company_id_idx" RENAME TO "training_assignments_tenant_id_idx";

-- RenameIndex
ALTER INDEX "training_programs_company_id_idx" RENAME TO "training_programs_tenant_id_idx";

-- RenameIndex
ALTER INDEX "treasury_transfers_company_id_idx" RENAME TO "treasury_transfers_tenant_id_idx";

-- RenameIndex
ALTER INDEX "user_companies_user_id_company_id_key" RENAME TO "user_companies_user_id_tenant_id_key";
