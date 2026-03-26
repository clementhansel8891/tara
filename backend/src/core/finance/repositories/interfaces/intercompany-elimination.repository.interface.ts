import { IntercompanyEliminationRule } from '../../domain/finance.interfaces';

export interface IIntercompanyEliminationRepository {
  listRules(tenantId: string): Promise<IntercompanyEliminationRule[]>;
  findByCompanies(tenantId: string, companyA: string, companyB: string): Promise<IntercompanyEliminationRule | null>;
  createRule(tenantId: string, data: Partial<IntercompanyEliminationRule>): Promise<IntercompanyEliminationRule>;
  updateRule(tenantId: string, id: string, data: Partial<IntercompanyEliminationRule>): Promise<IntercompanyEliminationRule>;
  deleteRule(tenantId: string, id: string): Promise<void>;
}
