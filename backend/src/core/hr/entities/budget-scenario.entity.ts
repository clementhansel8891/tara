export class BudgetScenario {
  id: string;
  tenantId: string;
  name: string;
  fiscalYear: number;
  status: string;
  totalBudget: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
