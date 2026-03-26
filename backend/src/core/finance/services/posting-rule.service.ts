import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { AuditService } from '../../../shared/audit/audit.service';
import { IPostingRuleRepository } from '../repositories/interfaces/posting-rule.repository.interface';
import { IChartOfAccountRepository } from '../repositories/interfaces/coa.repository.interface';
import { PostingRuleStatus, PostingSide } from '../domain/finance.constants';

@Injectable()
export class PostingRuleService {
  constructor(
    @Inject('IPostingRuleRepository')
    private readonly ruleRepo: IPostingRuleRepository,
    @Inject('IChartOfAccountRepository')
    private readonly coaRepo: IChartOfAccountRepository,
    private readonly auditService: AuditService,
  ) {}

  async listRules(tenantId: string, companyId: string): Promise<any[]> {
    return this.ruleRepo.listRules(tenantId, companyId);
  }

  async createRule(tenantId: string, companyId: string, data: any, userId: string): Promise<any> {
    // 1. Validate accounts exist
    const hasDebit = data.lines.some((l: any) => l.side === PostingSide.DEBIT);
    const hasCredit = data.lines.some((l: any) => l.side === PostingSide.CREDIT);
    if (!hasDebit || !hasCredit) {
      throw new BadRequestException('Posting rule must have at least one DEBIT and one CREDIT line');
    }

    // 2. Validation: Accounts
    for (const line of data.lines) {
      const coa = await this.coaRepo.findById(tenantId, companyId, line.accountId);
      if (!coa) throw new BadRequestException(`Account ${line.accountId} not found for rule`);
    }

    // 3. Validation: Balanced Rule (Conceptual)
    // ERP safety: If amountExpression is literal, we check Sum(D) == Sum(C).
    // If dynamic, we assume the expression is designed to balance.
    // Real implementation would have an expression evaluator placeholder here.

    const rule = await this.ruleRepo.createRule(tenantId, companyId, data);

    await this.auditService.log({
      tenantId,
      userId,
      module: 'FINANCE',
      action: 'CREATE_POSTING_RULE',
      entityType: 'PostingRule',
      entityId: rule.id,
      afterState: rule,
      metadata: { companyId },
    });

    return rule;
  }

  async activateRule(tenantId: string, companyId: string, ruleId: string, userId: string): Promise<any> {
    const rule = await this.ruleRepo.updateStatus(tenantId, companyId, ruleId, PostingRuleStatus.ACTIVE);

    // 4. Versioning Safeguard: Deactivate other rules for same eventType
    const allRules = await this.ruleRepo.findByEventType(tenantId, companyId, rule.eventType);
    for (const other of allRules) {
      if (other.id !== ruleId && other.status === PostingRuleStatus.ACTIVE) {
        await this.ruleRepo.update(tenantId, companyId, other.id, {
          status: PostingRuleStatus.INACTIVE,
          effectiveTo: new Date(),
        });
        
        await this.auditService.log({
          tenantId,
          userId: 'SYSTEM', // System-triggered deactivation
          module: 'FINANCE',
          action: 'DEACTIVATE_POSTING_RULE',
          entityType: 'PostingRule',
          entityId: other.id,
          metadata: { companyId, deactivatedBy: ruleId },
        });
      }
    }

    await this.auditService.log({
      tenantId,
      userId,
      module: 'FINANCE',
      action: 'ACTIVATE_POSTING_RULE',
      entityType: 'PostingRule',
      entityId: ruleId,
      afterState: rule,
      metadata: { companyId },
    });

    return rule;
  }
}
