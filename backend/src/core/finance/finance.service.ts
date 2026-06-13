import { Injectable, Logger, Inject } from "@nestjs/common";
import { TenantContext } from "../../gateway/tenant-context.interface";
import { PrismaService } from "../../persistence/prisma.service";
import { Prisma } from "@prisma/client";
import { IFinanceRepository } from "./repositories/finance.repository.interface";
import { LedgerEntry } from "./entities/ledger-entry.entity";
import { Transaction } from "./entities/transaction.entity";
import { Balance } from "./entities/balance.entity";
import {
  CreateTransactionDto,
  TransactionType,
} from "./dto/create-transaction.dto";
import { CreateJournalDto } from "./dto/create-journal.dto";
import {
  Asset,
  CapexRequest,
  FinanceCapexBudgetRow,
  AssetDepreciationEntry,
  AssetEvent,
  AssetAuditPack,
  FinanceReceivableRow,
  ReceivableInvoice,
  FinancePayableRow,
  PayableBill,
  FinancePaymentRow,
  PaymentRequest,
  FinanceDocumentRow,
  FinancePolicyRow,
  AccountingPeriod,
  FinanceInsight,
  FinanceAlert,
  PayrollEntry,
  PayrollEstimate,
  BankTransaction,
  PerformanceTreeNode,
} from "./finance.types";
import { AuditService } from "../../shared/audit/audit.service";
import { FileProcessingService } from "../../shared/file-processing/file-processing.service";
import { CsvBankProvider, ModularApiBankProvider } from "../../shared/finance/bank-providers";

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @Inject(IFinanceRepository)
    private readonly financeRepository: IFinanceRepository,
    private readonly auditService: AuditService,
    private readonly fileProcessingService: FileProcessingService,
    private readonly prisma: PrismaService,
    private readonly csvBankProvider: CsvBankProvider,
    private readonly apiBankProvider: ModularApiBankProvider,
  ) {}

  // Money Sources
  async getMoneySources(ctx: TenantContext) {
    return this.financeRepository.listMoneySources(ctx);
  }

  async listPeriods(ctx: TenantContext) {
    return this.financeRepository.listPeriods(ctx);
  }

  async getAlerts(ctx: TenantContext) {
    return this.financeRepository.getAlerts(ctx);
  }

  async listCapexBudgets(ctx: TenantContext) {
    return this.financeRepository.listCapexBudgets(ctx);
  }

  async listPolicies(ctx: TenantContext) {
    return this.financeRepository.listPolicies(ctx);
  }

  async getInbox(ctx: TenantContext) {
    // Inbox is a combination of unresolved alerts and pending payment requests
    const [alerts, payments] = await Promise.all([
      this.financeRepository.getAlerts(ctx),
      this.financeRepository.listPayments(ctx)
    ]);

    const pendingPayments = payments.filter(p => p.status === 'PENDING_APPROVAL');

    return {
      alerts,
      pendingPayments,
      totalCount: alerts.length + pendingPayments.length
    };
  }

  async listPayments(ctx: TenantContext) {
    return this.financeRepository.listPayments(ctx);
  }

  async listReceivables(ctx: TenantContext) {
    return this.financeRepository.listReceivables(ctx);
  }

  async listPayables(ctx: TenantContext) {
    return this.financeRepository.listPayables(ctx);
  }

  async listJournals(ctx: TenantContext) {
    // Standardizing on 'ledger' as the repository method for journals
    return this.financeRepository.getLedger(ctx);
  }

  async listInvoices(ctx: TenantContext) {
    // Aggregated view of both AR and AP invoices
    const [ar, ap] = await Promise.all([
      this.financeRepository.listReceivables(ctx),
      this.financeRepository.listPayables(ctx)
    ]);

    // Map to a common Invoice interface
    const arInvoices = ar.map(i => ({
      id: i.id,
      vendor: (i as any).customerName || (i as any).customer, // Handle mapping variations
      amount: i.amount,
      invoiceDate: i.dueDate, // Use due date as placeholder if date is missing
      dueDate: i.dueDate,
      status: i.status,
      kind: 'RECEIVABLE'
    }));

    const apInvoices = ap.map(i => ({
      id: i.id,
      vendor: (i as any).vendorName || (i as any).vendor,
      amount: i.amount,
      invoiceDate: i.dueDate,
      dueDate: i.dueDate,
      status: i.status,
      kind: 'PAYABLE'
    }));

    return [...arInvoices, ...apInvoices];
  }

  // Assets
  async listAssets(ctx: TenantContext) {
    return this.financeRepository.listAssets(ctx);
  }

  async getAssetById(ctx: TenantContext, id: string) {
    return this.financeRepository.getAssetById(ctx, id);
  }

  async listAssetEvents(ctx: TenantContext, assetId?: string) {
    return this.financeRepository.listAssetEvents(ctx, assetId);
  }

  async listAssetDepreciationEntries(ctx: TenantContext, assetId?: string) {
    return this.financeRepository.listAssetDepreciationEntries(ctx, assetId);
  }

  async getAssetAuditPack(ctx: TenantContext, assetId: string) {
    return this.financeRepository.getAssetAuditPack(ctx, assetId);
  }

  // Treasury
  async listTransfers(ctx: TenantContext) {
    return this.financeRepository.listTransfers(ctx);
  }

  async createTransfer(ctx: TenantContext, data: any) {
    return this.financeRepository.createTransfer(ctx, data);
  }

  async reconcileSettlement(ctx: TenantContext, sourceId: string, amount: number) {
    return this.financeRepository.reconcileSettlement(ctx, sourceId, amount);
  }

  // Payroll
  async getPayrollEntries(ctx: TenantContext, period?: string) {
    return this.financeRepository.listPayrollEntries(ctx, period);
  }

  async estimatePayroll(ctx: TenantContext, period: string) {
    return this.financeRepository.estimatePayroll(ctx, period);
  }

  async executePayroll(ctx: TenantContext, period: string, userId: string) {
    return this.financeRepository.executePayrollRun(ctx, period, userId);
  }

  async updateMoneySource(ctx: TenantContext, id: string, updates: any) {
    this.logger.log(`[FinanceService] Updating money source ${id} for tenant ${ctx.tenant_id}`);
    const updated = await this.financeRepository.updateMoneySource(ctx, id, updates);
    
    await this.auditService.log({
      tenant_id: ctx.tenant_id,
      user_id: 'SYSTEM', // Should be from context if available
      module: 'FINANCE',
      action: 'MONEY_SOURCE_UPDATED',
      entity_type: 'MONEY_SOURCE',
      entity_id: id,
      metadata: updates
    });

    return updated;
  }

  // Phase 5: Bank Reconciliation Orchestration
  async processBankStatement(
    ctx: TenantContext,
    source: 'CSV' | 'API',
    user_id: string,
    fileBuffer?: Buffer
  ): Promise<void> {
    const provider = source === 'CSV' ? this.csvBankProvider : this.apiBankProvider;
    this.logger.log(`[FinanceService] Processing statement from ${source} for tenant ${ctx.tenant_id}`);

    if (source === 'CSV' && !fileBuffer) {
      throw new Error('CSV file buffer is required for CSV ingestion');
    }

    const transactions = await provider.fetchStatements(ctx.tenant_id, { buffer: fileBuffer as any });
    
    if (transactions.length > 0) {
      const bankTxns = transactions.map(t => ({
        ...t,
        amount: new Prisma.Decimal(t.amount),
        status: 'UNRECONCILED' as any
      }));
      await this.financeRepository.ingestBankTransactions(ctx, bankTxns);
      await this.autoMatchBankTransactions(ctx);
    }

    await this.auditService.log({
      tenant_id: ctx.tenant_id,
      user_id,
      module: 'FINANCE',
      action: 'BANK_STATEMENT_PROCESSED',
      entity_type: 'BANK_ACCOUNT',
      entity_id: 'GLOBAL',
      metadata: { source, row_count: transactions.length }
    });
  }

  private async autoMatchBankTransactions(ctx: TenantContext): Promise<void> {
    const unreconciled = await this.financeRepository.getUnreconciledTransactions(ctx);
    const ledger = await this.financeRepository.getLedger(ctx);

    for (const stmt of unreconciled) {
      // Logic: Exact Amount + Date Proxy (within 3 days)
      const match = ledger.find(l => 
        l.amount.equals(stmt.amount) && 
        l.created_at &&
        Math.abs(new Date(l.created_at).getTime() - stmt.date.getTime()) < 259200000 // 3 days
      );

      if (match) {
        await this.financeRepository.createReconcileMatch(ctx, stmt.id, match.id, 0.95);
      }
    }
  }

  // Phase 5: Hierarchical Performance Dashboard (Multi-Level Roll-up)
  async getPerformanceDashboard(
    ctx: TenantContext,
    scope: 'TENANT' | 'BRANCH' | 'STORE' | 'ECOMMERCE',
    nodeId?: string
  ): Promise<PerformanceTreeNode> {
    this.logger.log(`[FinanceService] Calculating Performance Tree for ${scope}:${nodeId || 'ROOT'}`);
    
    // Recursive aggregation logic moved to Repository for DB-level performance
    const tree = await this.financeRepository.getPerformanceTree(ctx, nodeId, scope);
    
    return tree;
  }

  /**
   * Post a balanced journal entry. Thin passthrough to the repository so other
   * modules (e.g. HR payroll disbursement) can post their GL entries inside an
   * existing transaction by forwarding `tx`. The repository resolves the open
   * fiscal period, resolve-or-creates the GL accounts, and enforces balancing.
   */
  async createJournal(
    ctx: TenantContext,
    data: CreateJournalDto,
    tx?: Prisma.TransactionClient,
  ): Promise<any> {
    return this.financeRepository.createJournal(ctx, data, tx);
  }

  /**
   * Finalize a payroll settlement coming from the HR module.
   *
   * NOTE: the event bus delivers a plain `tenant_id` string (see
   * PayrollSettlementListener), not a full TenantContext. The previous
   * signature typed this as `TenantContext`, so at runtime `ctx.tenant_id`
   * resolved to `undefined` and the audit log was written with no tenant. The
   * GL journal for the run is posted in the same DB transaction during
   * disbursement; this handler records the settlement audit trail only.
   */
  async finalizePayrollSettlement(
    tenant_id: string,
    runId: string,
    payload: any
  ): Promise<void> {
    this.logger.log(`[FinanceService] Finalizing Payroll Settlement for run ${runId}`);

    await this.auditService.log({
      tenant_id,
      user_id: 'SYSTEM',
      module: 'FINANCE',
      action: 'PAYROLL_SETTLEMENT_FINALIZED',
      entity_type: 'PAYROLL_RUN',
      entity_id: runId,
      metadata: payload
    });
  }

  // Loans
  async listLoans(ctx: TenantContext, employee_id?: string) {
    return this.financeRepository.listLoans(ctx, employee_id);
  }

  async getLoanById(ctx: TenantContext, id: string) {
    return this.financeRepository.getLoanById(ctx, id);
  }

  async applyForLoan(ctx: TenantContext, data: any, user_id: string) {
    // Resolve employee_id from user_id if not provided
    let employee_id = data.employee_id;
    if (!employee_id) {
      const employee = await (this.prisma as any).employees.findFirst({
        where: { user_id, tenant_id: ctx.tenant_id },
      });
      if (!employee) throw new Error("Employee record not found for user");
      employee_id = employee.id;
    }

    // Resolve company currency
    let currency = data.currency;
    if (!currency) {
      const company = await (this.prisma as any).companies.findUnique({
        where: { id: ctx.company_id || "system" },
        select: { currency: true },
      });
      currency = company?.currency || "USD";
    }

    const loan = await this.financeRepository.createLoan(ctx, {
      ...data,
      employee_id,
      currency,
      status: "PENDING",
    });

    await this.auditService.log({
      tenant_id: ctx.tenant_id,
      user_id,
      module: "FINANCE",
      action: "LOAN_APPLICATION_SUBMITTED",
      entity_type: "LOAN",
      entity_id: loan.id,
      metadata: data,
    });

    return loan;
  }

  async approveLoan(ctx: TenantContext, id: string, user_id: string) {
    await this.financeRepository.updateLoanStatus(ctx, id, "APPROVED");

    await this.auditService.log({
      tenant_id: ctx.tenant_id,
      user_id,
      module: "FINANCE",
      action: "LOAN_APPROVED",
      entity_type: "LOAN",
      entity_id: id,
    });
  }

  async getEmployeeIdByUserId(ctx: TenantContext, user_id: string) {
    const employee = await (this.prisma as any).employees.findFirst({
      where: { user_id, tenant_id: ctx.tenant_id },
    });
    return employee?.id;
  }
}

