import { FinancePostingRule } from '../../domain/finance.interfaces';
import { PostingRuleStatus } from '../../domain/finance.constants';

export interface IPostingRuleRepository {
  findRule(tenantId: string, companyId: string, eventType: string): Promise<FinancePostingRule | null>;
  listRules(tenantId: string, companyId: string): Promise<FinancePostingRule[]>;
  createRule(tenantId: string, companyId: string, data: Partial<FinancePostingRule>): Promise<FinancePostingRule>;
  updateStatus(tenantId: string, companyId: string, ruleId: string, status: PostingRuleStatus): Promise<FinancePostingRule>;
  findByEventType(tenantId: string, companyId: string, eventType: string): Promise<FinancePostingRule[]>;
  update(tenantId: string, companyId: string, ruleId: string, data: Partial<FinancePostingRule>): Promise<FinancePostingRule>;
}
