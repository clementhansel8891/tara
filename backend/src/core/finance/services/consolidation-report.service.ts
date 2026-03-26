import { Injectable, Inject, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { 
  CompanyGroupMember, 
  IntercompanyEliminationRule, 
  ConsolidatedFinancialSnapshot 
} from '../domain/finance.interfaces';
import { ICompanyGroupRepository } from '../repositories/interfaces/company-group.repository.interface';
import { IIntercompanyEliminationRepository } from '../repositories/interfaces/intercompany-elimination.repository.interface';
import { IConsolidatedSnapshotRepository } from '../repositories/interfaces/consolidated-snapshot.repository.interface';
import { ProfitLossService } from './profit-loss.service';
import { BalanceSheetService } from './balance-sheet.service';
import { ProjectionCheckpointService } from './projection-checkpoint.service';

@Injectable()
export class ConsolidationReportService {
  private readonly logger = new Logger(ConsolidationReportService.name);

  constructor(
    @Inject('ICompanyGroupRepository')
    private readonly groupRepo: ICompanyGroupRepository,
    @Inject('IIntercompanyEliminationRepository')
    private readonly eliminationRepo: IIntercompanyEliminationRepository,
    @Inject('IConsolidatedSnapshotRepository')
    private readonly snapshotRepo: IConsolidatedSnapshotRepository,
    private readonly plService: ProfitLossService,
    private readonly bsService: BalanceSheetService,
    private readonly checkpointService: ProjectionCheckpointService,
  ) {}

  async getConsolidatedReport(
    tenantId: string, 
    groupId: string, 
    type: 'PROFIT_LOSS' | 'BALANCE_SHEET', 
    fiscalPeriodId: string,
    options: { eliminations?: boolean; ownership?: boolean } = { eliminations: true, ownership: true }
  ): Promise<any> {
    
    // 1. Parameter Hash for Caching
    const paramsHash = this.computeHash({ groupId, type, fiscalPeriodId, options });

    // 2. Check Snapshot Cache
    // Note: In a real system, we'd need to check if ANY member company's checkpoint has advanced.
    // For simplicity in Phase 13 mock, we use a global latest checkpoint or specific group logic.
    const cached = await this.snapshotRepo.getLatest(tenantId, groupId, fiscalPeriodId);
    if (cached && cached.reportParametersHash === paramsHash) {
       return JSON.parse(Buffer.from(cached.compressedData!, 'base64').toString('utf-8'));
    }

    // 3. Resolve all member companies (recursive)
    const members = await this.resolveGroupMembers(tenantId, groupId);
    if (members.length === 0) throw new Error(`No members found for group ${groupId}`);

    // 4. Aggregate Reports
    let consolidatedReport: any;
    if (type === 'PROFIT_LOSS') {
      consolidatedReport = await this.aggregatePL(tenantId, members, fiscalPeriodId, options);
    } else {
      consolidatedReport = await this.aggregateBS(tenantId, members, fiscalPeriodId, options);
    }

    // 5. Apply Eliminations if enabled
    if (options.eliminations) {
      await this.applyEliminations(tenantId, members, consolidatedReport);
    }

    const finalReport = {
        ...consolidatedReport,
        integrityHash: this.computeHash(consolidatedReport)
    };

    // 6. Cache Snapshot
    await this.snapshotRepo.create(tenantId, {
      groupId,
      fiscalPeriodId,
      reportParametersHash: paramsHash,
      compressedData: Buffer.from(JSON.stringify(finalReport)).toString('base64'),
      projectionCheckpointSequence: 0, // Simplified checkpointing for groups
    });

    return finalReport;
  }


  private async resolveGroupMembers(tenantId: string, groupId: string): Promise<CompanyGroupMember[]> {
    const list: CompanyGroupMember[] = [];
    const queue = [groupId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const members = await this.groupRepo.findMembers(currentId);
      list.push(...members);

      const subGroups = await this.groupRepo.findSubGroups(currentId);
      for (const sg of subGroups) {
        if (!visited.has(sg.id)) {
          queue.push(sg.id);
        }
      }
    }
    return list;
  }

  private async aggregatePL(tenantId: string, members: CompanyGroupMember[], fiscalPeriodId: string, options: any): Promise<any> {
    let totalRevenue = 0;
    let totalExpense = 0;
    let nciProfit = 0;
    const details: any[] = [];

    for (const member of members) {
      const report = await this.plService.generate(tenantId, member.companyId, fiscalPeriodId);
      const weight = 1.0; 
      const share = member.ownershipPercentage || 0;

      totalRevenue += report.summary.totalRevenue * weight;
      totalExpense += report.summary.totalExpense * weight;
      
      const memberNetProfit = report.summary.totalRevenue - report.summary.totalExpense;
      nciProfit += memberNetProfit * (1 - share);

      details.push(...report.details.map((d: any) => ({
        ...d,
        companyId: member.companyId,
        amount: d.amount * weight,
        parentShare: d.amount * share,
        nciShare: d.amount * (1 - share)
      })));
    }

    const netProfitGroup = totalRevenue - totalExpense;

    return {
      reportType: 'CONSOLIDATED_PROFIT_LOSS',
      tenantId,
      fiscalPeriodId,
      summary: {
        totalRevenue,
        totalExpense,
        netProfitGroup,
        nonControllingInterest: nciProfit,
        parentNetProfit: netProfitGroup - nciProfit,
      },
      details
    };
  }

  private async aggregateBS(tenantId: string, members: CompanyGroupMember[], fiscalPeriodId: string, options: any): Promise<any> {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalNCI = 0;
    const sections: Record<string, any[]> = { ASSET: [], LIABILITY: [], EQUITY: [] };

    for (const member of members) {
      const report = await this.bsService.generate(tenantId, member.companyId, fiscalPeriodId);
      const plReport = await this.plService.generate(tenantId, member.companyId, fiscalPeriodId);
      
      const share = member.ownershipPercentage || 0;
      const weight = 1.0; // 100% consolidation

      totalAssets += report.summary.totalAssets * weight;
      totalLiabilities += report.summary.totalLiabilities * weight;
      
      const memberEquity = report.summary.totalEquity + plReport.summary.netProfit;
      totalEquity += memberEquity * share; // Parent portion of equity
      totalNCI += memberEquity * (1 - share); // NCI portion of equity

      for (const key of Object.keys(sections)) {
        sections[key].push(...report.sections[key].map((s: any) => ({
          ...s,
          companyId: member.companyId,
          amount: s.amount * weight
        })));
      }
      // Add Net Income and NCI as virtual lines
      sections.EQUITY.push({
        accountId: 'VIRTUAL_NET_INCOME',
        companyId: member.companyId,
        amount: plReport.summary.netProfit * share,
        isVirtual: true
      });
    }

    // Add NCI line to Equity section
    sections.EQUITY.push({
      accountId: 'NON_CONTROLLING_INTEREST',
      amount: totalNCI,
      isVirtual: true,
      description: 'Equity attributable to minority shareholders'
    });

    return {
      reportType: 'CONSOLIDATED_BALANCE_SHEET',
      tenantId,
      fiscalPeriodId,
      summary: {
        totalAssets,
        totalLiabilities,
        totalEquity: totalEquity + totalNCI,
        parentEquity: totalEquity,
        nonControllingInterest: totalNCI,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + totalNCI)) <= 0.001
      },
      sections
    };
  }

  private async asyncApplyEliminations(tenantId: string, members: CompanyGroupMember[], report: any): Promise<void> {
    const rules = await this.eliminationRepo.listRules(tenantId);
    const memberIds = new Set(members.map(m => m.companyId));
    const eliminationJournals: any[] = [];

    for (const rule of rules) {
      if (memberIds.has(rule.companyA) && memberIds.has(rule.companyB)) {
        for (const [accA, accB] of Object.entries(rule.accountMapping || {})) {
          // Detect amount to eliminate (mock look-up)
          let amountA = 0;
          if (report.reportType === 'CONSOLIDATED_PROFIT_LOSS') {
             amountA = report.details.find((d: any) => d.companyId === rule.companyA && d.accountId === accA)?.amount || 0;
          } else {
             amountA = report.sections.ASSET.find((l: any) => l.companyId === rule.companyA && l.accountId === accA)?.amount ||
                       report.sections.LIABILITY.find((l: any) => l.companyId === rule.companyA && l.accountId === accA)?.amount || 0;
          }

          if (amountA !== 0) {
            // Generate Virtual Elimination Journal Entry
            eliminationJournals.push({
               id: `ELIM-${rule.id}-${accA}`,
               description: `Intercompany elim: ${rule.companyA}:${accA} <=> ${rule.companyB}:${accB}`,
               lines: [
                 { companyId: rule.companyA, accountId: accA, amount: -amountA, side: amountA > 0 ? 'ELIM_CREDIT' : 'ELIM_DEBIT' },
                 { companyId: rule.companyB, accountId: accB, amount: amountA, side: amountA > 0 ? 'ELIM_DEBIT' : 'ELIM_CREDIT' }
               ]
            });

            // Apply adjustment to totals
            if (report.reportType === 'CONSOLIDATED_PROFIT_LOSS') {
              report.summary.totalRevenue -= amountA;
              report.summary.netProfitGroup = report.summary.totalRevenue - report.summary.totalExpense;
            } else {
              report.summary.totalAssets -= amountA;
              report.summary.isBalanced = Math.abs(report.summary.totalAssets - (report.summary.totalLiabilities + report.summary.totalEquity)) <= 0.001;
            }
          }
        }
      }
    }
    report.eliminationJournals = eliminationJournals;
  }

  private async applyEliminations(tenantId: string, members: CompanyGroupMember[], report: any): Promise<void> {
    await this.asyncApplyEliminations(tenantId, members, report);
  }

  private computeHash(payload: any): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }
}
