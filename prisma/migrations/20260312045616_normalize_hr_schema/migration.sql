-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "job_role_id" TEXT;

-- CreateTable
CREATE TABLE "job_roles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "base_salary_min" DECIMAL(15,2),
    "base_salary_max" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "bank_name" TEXT,
    "bank_account_no" TEXT,
    "tax_id" TEXT,
    "social_security_no" TEXT,
    "payment_method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_roles_tenant_id_idx" ON "job_roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_roles_tenant_id_code_key" ON "job_roles"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_profiles_employee_id_key" ON "payroll_profiles"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_profiles_tenant_id_idx" ON "payroll_profiles"("tenant_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_roles" ADD CONSTRAINT "job_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_profiles" ADD CONSTRAINT "payroll_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_profiles" ADD CONSTRAINT "payroll_profiles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
