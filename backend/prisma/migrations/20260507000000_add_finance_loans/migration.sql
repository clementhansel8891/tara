-- CreateTable
CREATE TABLE "finance_loans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT,
    "employee_id" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "finance_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_loan_installments" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "principal" DECIMAL(20,2) NOT NULL,
    "interest" DECIMAL(20,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "finance_loan_installments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_loans_tenant_id_idx" ON "finance_loans"("tenant_id");

-- CreateIndex
CREATE INDEX "finance_loans_employee_id_idx" ON "finance_loans"("employee_id");

-- CreateIndex
CREATE INDEX "finance_loan_installments_loan_id_idx" ON "finance_loan_installments"("loan_id");

-- AddForeignKey
ALTER TABLE "finance_loans" ADD CONSTRAINT "finance_loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_loans" ADD CONSTRAINT "finance_loans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_loans" ADD CONSTRAINT "finance_loans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_loan_installments" ADD CONSTRAINT "finance_loan_installments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "finance_loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
