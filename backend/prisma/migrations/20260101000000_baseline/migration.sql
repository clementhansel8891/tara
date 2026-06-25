-- TARA Baseline Migration — creates all tables from scratch.
-- Requires PostgreSQL 16+ with PostGIS extension.
-- Use Docker (docker compose up) which provides PostGIS automatically.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT,
    "department_id" TEXT,
    "role_id" TEXT,
    "supervisor_id" TEXT,
    "office_location_id" TEXT,
    "hire_date" TIMESTAMP(3) NOT NULL,
    "employment_status" TEXT NOT NULL DEFAULT 'active',
    "biometric_token_hash" TEXT,
    "biometric_device_id" TEXT,
    "language_preference" TEXT NOT NULL DEFAULT 'id',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "manager_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "permissions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "attendance_date" DATE NOT NULL,
    "clock_in_time" TIMESTAMP(3),
    "clock_in_location" geography(Point,4326),
    "clock_in_source" TEXT NOT NULL DEFAULT 'phone',
    "clock_out_time" TIMESTAMP(3),
    "clock_out_location" geography(Point,4326),
    "clock_out_source" TEXT NOT NULL DEFAULT 'phone',
    "is_tardy" BOOLEAN NOT NULL DEFAULT false,
    "tardiness_minutes" INTEGER NOT NULL DEFAULT 0,
    "office_location_id" TEXT,
    "override_reason" TEXT,
    "override_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type" TEXT NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_days" INTEGER NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "total_entitlement" INTEGER NOT NULL,
    "used_days" INTEGER NOT NULL DEFAULT 0,
    "remaining_days" INTEGER NOT NULL,
    "carryover_days" INTEGER NOT NULL DEFAULT 0,
    "carryover_expiry_date" DATE,
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warning_letters" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "warning_level" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "issued_by" TEXT NOT NULL,
    "expiry_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'active',
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warning_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_checkins" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "week_start_date" DATE NOT NULL,
    "accomplishments" TEXT,
    "challenges" TEXT,
    "next_week_goals" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_status" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" JSONB NOT NULL,
    "setting_category" TEXT NOT NULL,
    "description" TEXT,
    "last_modified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_configs" (
    "id" TEXT NOT NULL,
    "agent_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB NOT NULL,
    "last_heartbeat_at" TIMESTAMP(3),
    "health_status" TEXT NOT NULL DEFAULT 'unknown',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_locations" (
    "id" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "geofence_radius_meters" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "office_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_holidays" (
    "id" TEXT NOT NULL,
    "holiday_date" DATE NOT NULL,
    "holiday_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aws_device_mappings" (
    "id" TEXT NOT NULL,
    "aws_employee_id" TEXT NOT NULL,
    "tara_employee_id" TEXT NOT NULL,
    "aws_device_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aws_device_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_bus_logs" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_version" TEXT NOT NULL DEFAULT '1.0',
    "actor_id" TEXT,
    "actor_type" TEXT,
    "entity_id" TEXT,
    "entity_type" TEXT,
    "event_payload" JSONB NOT NULL,
    "event_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "delivery_status" TEXT NOT NULL DEFAULT 'pending',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_bus_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "target_entity_type" TEXT NOT NULL,
    "target_entity_id" TEXT,
    "action_context" TEXT,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_action_queue" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_payload" JSONB NOT NULL,
    "client_timestamp" TIMESTAMP(3) NOT NULL,
    "sync_status" TEXT NOT NULL DEFAULT 'pending',
    "synced_at" TIMESTAMP(3),
    "sync_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_action_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_holidays" (
    "id" TEXT NOT NULL,
    "holiday_date" DATE NOT NULL,
    "holiday_name" TEXT NOT NULL,
    "description" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absence_records" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "absence_date" DATE NOT NULL,
    "absence_type" TEXT NOT NULL,
    "reason" TEXT,
    "reported_by" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absence_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedules" (
    "id" TEXT NOT NULL,
    "schedule_name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "break_start" TEXT,
    "break_end" TEXT,
    "work_days" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_assignments" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "assigned_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "loan_type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "remaining_balance" DECIMAL(15,2) NOT NULL,
    "installment_amount" DECIMAL(15,2),
    "installment_count" INTEGER,
    "paid_installments" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_repayments" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'payroll_deduction',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_repayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "period_name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "total_gross" DECIMAL(15,2),
    "total_deductions" DECIMAL(15,2),
    "total_net" DECIMAL(15,2),
    "processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "base_salary" DECIMAL(15,2) NOT NULL,
    "total_additions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_salary" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sent_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_items" (
    "id" TEXT NOT NULL,
    "payslip_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_category" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslip_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_components" (
    "id" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "component_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "default_amount" DECIMAL(15,2),
    "is_percentage" BOOLEAN NOT NULL DEFAULT false,
    "percentage_of" TEXT,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hermes_action_logs" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "result" JSONB,
    "status" TEXT NOT NULL DEFAULT 'success',
    "authority_level" TEXT NOT NULL,
    "execution_ms" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hermes_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hermes_suggestions" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "suggestion" JSONB NOT NULL DEFAULT '{}',
    "reasoning" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "correlation_event_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hermes_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hermes_follow_ups" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "context_entity_id" TEXT,
    "context_entity_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hermes_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_role_id_idx" ON "employees"("role_id");

-- CreateIndex
CREATE INDEX "employees_supervisor_id_idx" ON "employees"("supervisor_id");

-- CreateIndex
CREATE INDEX "employees_office_location_id_idx" ON "employees"("office_location_id");

-- CreateIndex
CREATE INDEX "employees_employment_status_idx" ON "employees"("employment_status");

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE INDEX "departments_manager_id_idx" ON "departments"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE INDEX "attendance_employee_id_idx" ON "attendance"("employee_id");

-- CreateIndex
CREATE INDEX "attendance_attendance_date_idx" ON "attendance"("attendance_date");

-- CreateIndex
CREATE INDEX "attendance_is_tardy_idx" ON "attendance"("is_tardy");

-- CreateIndex
CREATE INDEX "attendance_employee_id_attendance_date_idx" ON "attendance"("employee_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_employee_id_attendance_date_key" ON "attendance"("employee_id", "attendance_date");

-- CreateIndex
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "leave_requests_start_date_end_date_idx" ON "leave_requests"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "leave_requests_approved_by_idx" ON "leave_requests"("approved_by");

-- CreateIndex
CREATE INDEX "leave_requests_employee_id_status_idx" ON "leave_requests"("employee_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employee_id_key" ON "leave_balances"("employee_id");

-- CreateIndex
CREATE INDEX "leave_balances_employee_id_idx" ON "leave_balances"("employee_id");

-- CreateIndex
CREATE INDEX "leave_balances_year_idx" ON "leave_balances"("year");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employee_id_year_key" ON "leave_balances"("employee_id", "year");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "notifications_notification_type_idx" ON "notifications"("notification_type");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_is_read_idx" ON "notifications"("recipient_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_created_at_idx" ON "notifications"("recipient_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "warning_letters_employee_id_idx" ON "warning_letters"("employee_id");

-- CreateIndex
CREATE INDEX "warning_letters_warning_level_idx" ON "warning_letters"("warning_level");

-- CreateIndex
CREATE INDEX "warning_letters_status_idx" ON "warning_letters"("status");

-- CreateIndex
CREATE INDEX "warning_letters_employee_id_status_idx" ON "warning_letters"("employee_id", "status");

-- CreateIndex
CREATE INDEX "weekly_checkins_employee_id_idx" ON "weekly_checkins"("employee_id");

-- CreateIndex
CREATE INDEX "weekly_checkins_week_start_date_idx" ON "weekly_checkins"("week_start_date");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_checkins_employee_id_week_start_date_key" ON "weekly_checkins"("employee_id", "week_start_date");

-- CreateIndex
CREATE INDEX "onboarding_status_employee_id_idx" ON "onboarding_status"("employee_id");

-- CreateIndex
CREATE INDEX "onboarding_status_status_idx" ON "onboarding_status"("status");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_status_employee_id_step_number_key" ON "onboarding_status"("employee_id", "step_number");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "system_settings_setting_category_idx" ON "system_settings"("setting_category");

-- CreateIndex
CREATE INDEX "system_settings_setting_key_idx" ON "system_settings"("setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "agent_configs_agent_name_key" ON "agent_configs"("agent_name");

-- CreateIndex
CREATE INDEX "agent_configs_agent_name_idx" ON "agent_configs"("agent_name");

-- CreateIndex
CREATE INDEX "agent_configs_is_enabled_idx" ON "agent_configs"("is_enabled");

-- CreateIndex
CREATE INDEX "office_locations_is_active_idx" ON "office_locations"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "public_holidays_holiday_date_key" ON "public_holidays"("holiday_date");

-- CreateIndex
CREATE INDEX "public_holidays_holiday_date_idx" ON "public_holidays"("holiday_date");

-- CreateIndex
CREATE INDEX "public_holidays_is_active_idx" ON "public_holidays"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "aws_device_mappings_aws_employee_id_key" ON "aws_device_mappings"("aws_employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "aws_device_mappings_tara_employee_id_key" ON "aws_device_mappings"("tara_employee_id");

-- CreateIndex
CREATE INDEX "aws_device_mappings_tara_employee_id_idx" ON "aws_device_mappings"("tara_employee_id");

-- CreateIndex
CREATE INDEX "aws_device_mappings_is_active_idx" ON "aws_device_mappings"("is_active");

-- CreateIndex
CREATE INDEX "event_bus_logs_event_type_idx" ON "event_bus_logs"("event_type");

-- CreateIndex
CREATE INDEX "event_bus_logs_event_timestamp_idx" ON "event_bus_logs"("event_timestamp");

-- CreateIndex
CREATE INDEX "event_bus_logs_actor_id_idx" ON "event_bus_logs"("actor_id");

-- CreateIndex
CREATE INDEX "event_bus_logs_entity_id_entity_type_idx" ON "event_bus_logs"("entity_id", "entity_type");

-- CreateIndex
CREATE INDEX "event_bus_logs_delivery_status_idx" ON "event_bus_logs"("delivery_status");

-- CreateIndex
CREATE INDEX "event_bus_logs_event_type_event_timestamp_idx" ON "event_bus_logs"("event_type", "event_timestamp");

-- CreateIndex
CREATE INDEX "event_bus_logs_delivery_status_event_timestamp_idx" ON "event_bus_logs"("delivery_status", "event_timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_type_idx" ON "audit_logs"("action_type");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_entity_type_target_entity_id_idx" ON "audit_logs"("target_entity_type", "target_entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_context_idx" ON "audit_logs"("action_context");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "offline_action_queue_employee_id_idx" ON "offline_action_queue"("employee_id");

-- CreateIndex
CREATE INDEX "offline_action_queue_sync_status_idx" ON "offline_action_queue"("sync_status");

-- CreateIndex
CREATE INDEX "offline_action_queue_created_at_idx" ON "offline_action_queue"("created_at");

-- CreateIndex
CREATE INDEX "company_holidays_holiday_date_idx" ON "company_holidays"("holiday_date");

-- CreateIndex
CREATE INDEX "company_holidays_is_active_idx" ON "company_holidays"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "company_holidays_holiday_date_key" ON "company_holidays"("holiday_date");

-- CreateIndex
CREATE INDEX "absence_records_employee_id_idx" ON "absence_records"("employee_id");

-- CreateIndex
CREATE INDEX "absence_records_absence_date_idx" ON "absence_records"("absence_date");

-- CreateIndex
CREATE INDEX "absence_records_absence_type_idx" ON "absence_records"("absence_type");

-- CreateIndex
CREATE UNIQUE INDEX "absence_records_employee_id_absence_date_key" ON "absence_records"("employee_id", "absence_date");

-- CreateIndex
CREATE INDEX "work_schedules_is_active_idx" ON "work_schedules"("is_active");

-- CreateIndex
CREATE INDEX "schedule_assignments_employee_id_idx" ON "schedule_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "schedule_assignments_schedule_id_idx" ON "schedule_assignments"("schedule_id");

-- CreateIndex
CREATE INDEX "schedule_assignments_effective_from_idx" ON "schedule_assignments"("effective_from");

-- CreateIndex
CREATE INDEX "loans_employee_id_idx" ON "loans"("employee_id");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loan_repayments_loan_id_idx" ON "loan_repayments"("loan_id");

-- CreateIndex
CREATE INDEX "loan_repayments_payment_date_idx" ON "loan_repayments"("payment_date");

-- CreateIndex
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_start_date_end_date_key" ON "payroll_periods"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "payslips_employee_id_idx" ON "payslips"("employee_id");

-- CreateIndex
CREATE INDEX "payslips_period_id_idx" ON "payslips"("period_id");

-- CreateIndex
CREATE INDEX "payslips_status_idx" ON "payslips"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_employee_id_period_id_key" ON "payslips"("employee_id", "period_id");

-- CreateIndex
CREATE INDEX "payslip_items_payslip_id_idx" ON "payslip_items"("payslip_id");

-- CreateIndex
CREATE INDEX "payslip_items_item_type_idx" ON "payslip_items"("item_type");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_components_component_name_key" ON "payroll_components"("component_name");

-- CreateIndex
CREATE INDEX "payroll_components_component_type_idx" ON "payroll_components"("component_type");

-- CreateIndex
CREATE INDEX "payroll_components_is_active_idx" ON "payroll_components"("is_active");

-- CreateIndex
CREATE INDEX "hermes_action_logs_agent_id_idx" ON "hermes_action_logs"("agent_id");

-- CreateIndex
CREATE INDEX "hermes_action_logs_action_type_idx" ON "hermes_action_logs"("action_type");

-- CreateIndex
CREATE INDEX "hermes_action_logs_status_idx" ON "hermes_action_logs"("status");

-- CreateIndex
CREATE INDEX "hermes_action_logs_created_at_idx" ON "hermes_action_logs"("created_at");

-- CreateIndex
CREATE INDEX "hermes_action_logs_agent_id_status_created_at_idx" ON "hermes_action_logs"("agent_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "hermes_suggestions_agent_id_idx" ON "hermes_suggestions"("agent_id");

-- CreateIndex
CREATE INDEX "hermes_suggestions_status_idx" ON "hermes_suggestions"("status");

-- CreateIndex
CREATE INDEX "hermes_suggestions_entity_type_idx" ON "hermes_suggestions"("entity_type");

-- CreateIndex
CREATE INDEX "hermes_suggestions_expires_at_idx" ON "hermes_suggestions"("expires_at");

-- CreateIndex
CREATE INDEX "hermes_suggestions_status_expires_at_idx" ON "hermes_suggestions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "hermes_follow_ups_agent_id_idx" ON "hermes_follow_ups"("agent_id");

-- CreateIndex
CREATE INDEX "hermes_follow_ups_recipient_id_idx" ON "hermes_follow_ups"("recipient_id");

-- CreateIndex
CREATE INDEX "hermes_follow_ups_status_idx" ON "hermes_follow_ups"("status");

-- CreateIndex
CREATE INDEX "hermes_follow_ups_scheduled_at_idx" ON "hermes_follow_ups"("scheduled_at");

-- CreateIndex
CREATE INDEX "hermes_follow_ups_status_scheduled_at_idx" ON "hermes_follow_ups"("status", "scheduled_at");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_office_location_id_fkey" FOREIGN KEY ("office_location_id") REFERENCES "office_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_office_location_id_fkey" FOREIGN KEY ("office_location_id") REFERENCES "office_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warning_letters" ADD CONSTRAINT "warning_letters_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warning_letters" ADD CONSTRAINT "warning_letters_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_checkins" ADD CONSTRAINT "weekly_checkins_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_status" ADD CONSTRAINT "onboarding_status_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aws_device_mappings" ADD CONSTRAINT "aws_device_mappings_tara_employee_id_fkey" FOREIGN KEY ("tara_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bus_logs" ADD CONSTRAINT "event_bus_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_action_queue" ADD CONSTRAINT "offline_action_queue_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_records" ADD CONSTRAINT "absence_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_records" ADD CONSTRAINT "absence_records_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "work_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_items" ADD CONSTRAINT "payslip_items_payslip_id_fkey" FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hermes_follow_ups" ADD CONSTRAINT "hermes_follow_ups_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

