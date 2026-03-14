-- DropIndex
DROP INDEX "positions_department_id_idx";

-- DropIndex
DROP INDEX "positions_tenant_id_idx";

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "document_metadata" JSONB;

-- AlterTable
ALTER TABLE "it_provisioning_requests" ADD COLUMN     "description" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "job_requisitions" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payroll_runs" ADD COLUMN     "base_currency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "positions" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "job_post_metadata" JSONB;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "hr_talent_leads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'LINKEDIN',
    "external_profile_url" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "headline" TEXT,
    "skills" JSONB,
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_talent_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_compliance_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT,
    "file_url" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING',
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_compliance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_budget_scenarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_budget_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_headcount_plans" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "position_title" TEXT NOT NULL,
    "target_headcount" INTEGER NOT NULL DEFAULT 1,
    "projected_salary" DOUBLE PRECISION NOT NULL,
    "planned_hire_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_headcount_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_position_skills" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "min_proficiency" INTEGER NOT NULL DEFAULT 1,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_position_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "interviewer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_exchange_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_succession_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "is_critical" BOOLEAN NOT NULL DEFAULT true,
    "strategy" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_succession_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_succession_candidates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "readiness" TEXT NOT NULL DEFAULT 'EMERGENCY',
    "readiness_score" INTEGER NOT NULL DEFAULT 0,
    "risk_of_loss" TEXT NOT NULL DEFAULT 'LOW',
    "impact_of_loss" TEXT NOT NULL DEFAULT 'MEDIUM',
    "skill_gaps" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_succession_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_skills" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_skills" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "proficiency" INTEGER NOT NULL DEFAULT 1,
    "verification_status" TEXT NOT NULL DEFAULT 'SELF_ASSESSED',
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employee_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_benefit_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "employer_contribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employee_contribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_benefit_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_benefits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "enrollment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "coverage_amount" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employee_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_career_paths" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_position_id" TEXT NOT NULL,
    "to_position_id" TEXT NOT NULL,
    "requirement_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_career_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_mentorship_pairs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "mentor_id" TEXT NOT NULL,
    "mentee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "focus_skills" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_mentorship_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_performance_goals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_date" TIMESTAMP(3) NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_performance_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_program_skills" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "proficiency_gain" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_program_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_holidays" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hr_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_compliance_modules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_compliance_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_compliance_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "payroll_run_id" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "summary" JSONB NOT NULL,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_compliance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_talent_leads_tenant_id_idx" ON "hr_talent_leads"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_talent_leads_status_idx" ON "hr_talent_leads"("status");

-- CreateIndex
CREATE INDEX "hr_compliance_documents_tenant_id_idx" ON "hr_compliance_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_compliance_documents_employee_id_idx" ON "hr_compliance_documents"("employee_id");

-- CreateIndex
CREATE INDEX "hr_compliance_documents_verification_status_idx" ON "hr_compliance_documents"("verification_status");

-- CreateIndex
CREATE INDEX "hr_budget_scenarios_tenant_id_idx" ON "hr_budget_scenarios"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_budget_scenarios_status_idx" ON "hr_budget_scenarios"("status");

-- CreateIndex
CREATE INDEX "hr_headcount_plans_scenario_id_idx" ON "hr_headcount_plans"("scenario_id");

-- CreateIndex
CREATE INDEX "hr_headcount_plans_department_id_idx" ON "hr_headcount_plans"("department_id");

-- CreateIndex
CREATE INDEX "hr_position_skills_tenant_id_idx" ON "hr_position_skills"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_position_skills_position_id_skill_id_key" ON "hr_position_skills"("position_id", "skill_id");

-- CreateIndex
CREATE INDEX "interviews_tenant_id_idx" ON "interviews"("tenant_id");

-- CreateIndex
CREATE INDEX "interviews_candidate_id_idx" ON "interviews"("candidate_id");

-- CreateIndex
CREATE INDEX "hr_exchange_rates_tenant_id_idx" ON "hr_exchange_rates"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_exchange_rates_from_currency_to_currency_idx" ON "hr_exchange_rates"("from_currency", "to_currency");

-- CreateIndex
CREATE UNIQUE INDEX "hr_succession_plans_position_id_key" ON "hr_succession_plans"("position_id");

-- CreateIndex
CREATE INDEX "hr_succession_plans_tenant_id_idx" ON "hr_succession_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_succession_candidates_employee_id_idx" ON "hr_succession_candidates"("employee_id");

-- CreateIndex
CREATE INDEX "hr_skills_tenant_id_idx" ON "hr_skills"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_employee_skills_tenant_id_idx" ON "hr_employee_skills"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employee_skills_employee_id_skill_id_key" ON "hr_employee_skills"("employee_id", "skill_id");

-- CreateIndex
CREATE INDEX "hr_benefit_plans_tenant_id_idx" ON "hr_benefit_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_employee_benefits_tenant_id_idx" ON "hr_employee_benefits"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_employee_benefits_employee_id_idx" ON "hr_employee_benefits"("employee_id");

-- CreateIndex
CREATE INDEX "hr_employee_benefits_plan_id_idx" ON "hr_employee_benefits"("plan_id");

-- CreateIndex
CREATE INDEX "hr_career_paths_tenant_id_idx" ON "hr_career_paths"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_mentorship_pairs_tenant_id_idx" ON "hr_mentorship_pairs"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_mentorship_pairs_mentor_id_idx" ON "hr_mentorship_pairs"("mentor_id");

-- CreateIndex
CREATE INDEX "hr_mentorship_pairs_mentee_id_idx" ON "hr_mentorship_pairs"("mentee_id");

-- CreateIndex
CREATE INDEX "hr_performance_goals_tenant_id_idx" ON "hr_performance_goals"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_performance_goals_employee_id_idx" ON "hr_performance_goals"("employee_id");

-- CreateIndex
CREATE INDEX "hr_program_skills_tenant_id_idx" ON "hr_program_skills"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_program_skills_program_id_skill_id_key" ON "hr_program_skills"("program_id", "skill_id");

-- CreateIndex
CREATE INDEX "hr_holidays_tenant_id_idx" ON "hr_holidays"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_compliance_modules_tenant_id_module_key_key" ON "hr_compliance_modules"("tenant_id", "module_key");

-- CreateIndex
CREATE INDEX "hr_compliance_reports_tenant_id_idx" ON "hr_compliance_reports"("tenant_id");

-- AddForeignKey
ALTER TABLE "hr_talent_leads" ADD CONSTRAINT "hr_talent_leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_compliance_documents" ADD CONSTRAINT "hr_compliance_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_compliance_documents" ADD CONSTRAINT "hr_compliance_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_budget_scenarios" ADD CONSTRAINT "hr_budget_scenarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_headcount_plans" ADD CONSTRAINT "hr_headcount_plans_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "hr_budget_scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_headcount_plans" ADD CONSTRAINT "hr_headcount_plans_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_position_skills" ADD CONSTRAINT "hr_position_skills_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_position_skills" ADD CONSTRAINT "hr_position_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "hr_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_exchange_rates" ADD CONSTRAINT "hr_exchange_rates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_succession_plans" ADD CONSTRAINT "hr_succession_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_succession_plans" ADD CONSTRAINT "hr_succession_plans_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_succession_candidates" ADD CONSTRAINT "hr_succession_candidates_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "hr_succession_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_succession_candidates" ADD CONSTRAINT "hr_succession_candidates_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_skills" ADD CONSTRAINT "hr_skills_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_skills" ADD CONSTRAINT "hr_employee_skills_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_skills" ADD CONSTRAINT "hr_employee_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "hr_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_benefit_plans" ADD CONSTRAINT "hr_benefit_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_benefits" ADD CONSTRAINT "hr_employee_benefits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_benefits" ADD CONSTRAINT "hr_employee_benefits_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "hr_benefit_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_career_paths" ADD CONSTRAINT "hr_career_paths_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_career_paths" ADD CONSTRAINT "hr_career_paths_from_position_id_fkey" FOREIGN KEY ("from_position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_career_paths" ADD CONSTRAINT "hr_career_paths_to_position_id_fkey" FOREIGN KEY ("to_position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_mentorship_pairs" ADD CONSTRAINT "hr_mentorship_pairs_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_mentorship_pairs" ADD CONSTRAINT "hr_mentorship_pairs_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_performance_goals" ADD CONSTRAINT "hr_performance_goals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_performance_goals" ADD CONSTRAINT "hr_performance_goals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_program_skills" ADD CONSTRAINT "hr_program_skills_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "training_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_program_skills" ADD CONSTRAINT "hr_program_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "hr_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_holidays" ADD CONSTRAINT "hr_holidays_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_compliance_modules" ADD CONSTRAINT "hr_compliance_modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_compliance_reports" ADD CONSTRAINT "hr_compliance_reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_compliance_reports" ADD CONSTRAINT "hr_compliance_reports_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
