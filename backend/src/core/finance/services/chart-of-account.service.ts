import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { AuditService } from '../../../shared/audit/audit.service';
import { FinanceChartOfAccount } from '../domain/finance.interfaces';
import { IChartOfAccountRepository } from '../repositories/interfaces/coa.repository.interface';
import { IPostingRuleRepository } from '../repositories/interfaces/posting-rule.repository.interface';
import { AccountType, NormalBalance } from '../domain/finance.constants';

@Injectable()
export class ChartOfAccountService {
  constructor(
    @Inject('IChartOfAccountRepository')
    private readonly coaRepo: IChartOfAccountRepository,
    @Inject('IPostingRuleRepository')
    private readonly ruleRepo: IPostingRuleRepository,
    private readonly auditService: AuditService,
  ) {}

  async getHierarchy(tenantId: string, companyId: string): Promise<FinanceChartOfAccount[]> {
    return this.coaRepo.findAll(tenantId, companyId);
  }

  async getAccount(tenantId: string, companyId: string, id: string): Promise<FinanceChartOfAccount> {
    const coa = await this.coaRepo.findById(tenantId, companyId, id);
    if (!coa) throw new BadRequestException('Account not found');
    return coa;
  }

  async createAccount(tenantId: string, companyId: string, data: any, userId: string): Promise<FinanceChartOfAccount> {
    let parent;
    if (data.parentAccountId) {
      parent = await this.coaRepo.findById(tenantId, companyId, data.parentAccountId);
      if (!parent) throw new BadRequestException('Parent account not found');
    }

    const accountLevel = parent ? parent.accountLevel + 1 : 1;
    const accountPath = parent ? parent.accountPath + `.${data.accountCode}` : data.accountCode;

    const coa = await this.coaRepo.create(tenantId, companyId, {
      ...data,
      accountLevel,
      accountPath,
    });

    await this.auditService.log({
      tenantId,
      userId,
      module: 'FINANCE',
      action: 'CREATE_COA',
      entityType: 'ChartOfAccount',
      entityId: coa.id,
      afterState: coa,
      metadata: { companyId },
    });

    return coa;
  }

  async updateAccount(tenantId: string, companyId: string, id: string, data: any, userId?: string): Promise<FinanceChartOfAccount> {
    const existing = await this.coaRepo.findById(tenantId, companyId, id);
    if (!existing) throw new BadRequestException('Account not found');

    const inUse = await this.coaRepo.checkInUse(tenantId, companyId, id);
    const referencedByRule = await this.isReferencedByPostingRule(tenantId, companyId, id);
    
    if (inUse || referencedByRule) {
      if (data.parentAccountId !== undefined && data.parentAccountId !== existing.parentAccountId) {
        throw new BadRequestException('Account is referenced and parent cannot be modified');
      }
      if (data.accountType !== undefined && data.accountType !== existing.accountType) {
        throw new BadRequestException('Account is referenced and type cannot be modified');
      }
    }

    const coa = await this.coaRepo.update(tenantId, companyId, id, data);

    await this.auditService.log({
      tenantId,
      userId: userId || 'SYSTEM',
      module: 'FINANCE',
      action: 'UPDATE_COA',
      entityType: 'ChartOfAccount',
      entityId: id,
      beforeState: existing,
      afterState: coa,
      metadata: { companyId, updates: data },
    });

    return coa;
  }

  async deleteAccount(tenantId: string, companyId: string, id: string, userId: string): Promise<void> {
    const existing = await this.coaRepo.findById(tenantId, companyId, id);
    if (!existing) throw new BadRequestException('Account not found');

    const inUse = await this.coaRepo.checkInUse(tenantId, companyId, id);
    const referencedByRule = await this.isReferencedByPostingRule(tenantId, companyId, id);

    if (inUse || referencedByRule) {
      throw new BadRequestException('Account is referenced and cannot be deleted');
    }

    await this.coaRepo.delete(tenantId, companyId, id);

    await this.auditService.log({
      tenantId,
      userId,
      module: 'FINANCE',
      action: 'DELETE_COA',
      entityType: 'ChartOfAccount',
      entityId: id,
      beforeState: existing,
      metadata: { companyId },
    });
  }

  private async isReferencedByPostingRule(tenantId: string, companyId: string, accountId: string): Promise<boolean> {
    const rules = await this.ruleRepo.listRules(tenantId, companyId);
    return rules.some(rule => rule.lines.some((line: any) => line.accountId === accountId));
  }
}
