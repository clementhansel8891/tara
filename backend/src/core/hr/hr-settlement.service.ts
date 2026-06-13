import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventBusService } from '../../shared/events/event-bus.service';
import { AuditService } from '../../shared/audit/audit.service';
import { EVENT_NAMES } from './events/event-names';
import { IHRRepository } from './repositories/hr.repository.interface';
import { FinanceService } from '../finance/finance.service';
import { PrismaService } from '../../persistence/prisma.service';
import { TenantContext } from '../../gateway/tenant-context.interface';

@Injectable()
export class HrSettlementService {
  private readonly logger = new Logger(HrSettlementService.name);

  constructor(
    private readonly hrRepository: IHRRepository,
    private readonly financeService: FinanceService,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Approve a Draft Payroll Run.
   *
   * Atomic_Operation (Req 4.1/4.2/10.2): the state read + guard + status write +
   * audit log all run inside a single `$transaction`. The run is read on the
   * transaction client (`tx`) so a concurrent transition cannot race between the
   * DRAFT guard and the APPROVED write. An invalid transition (run not in DRAFT)
   * is rejected with a client error (Req 10.5).
   */
  async approvePayrollRun(tenant_id: string, runId: string, user_id: string) {
    return this.prisma.$transaction(async (tx) => {
      const run = await this.hrRepository.getPayrollRunById(tenant_id, runId, tx as any);
      if (!run) throw new NotFoundException('Payroll run not found');
      if (run.status !== 'DRAFT') throw new BadRequestException(`Cannot approve run in ${run.status} status`);

      const updatedRun = await this.hrRepository.updatePayrollRun(tenant_id, runId, {
        status: 'APPROVED',
        updated_at: new Date(),
      }, tx as any);

      // Audit log written inside the SAME transaction as the status write
      // (Req 4.4): if the audit write fails the status transition rolls back.
      await this.auditService.log({
        tenant_id,
        user_id: user_id || 'SYSTEM',
        module: 'HR',
        action: 'APPROVE_PAYROLL_RUN',
        entity_type: 'PAYROLL_RUN',
        entity_id: runId,
        before_state: { status: run.status },
        after_state: { status: 'APPROVED' },
      }, tx);

      return updatedRun;
    });
  }

  /**
   * Disburse Payroll (Send to Bank and Record in Ledger)
   */
  async disbursePayrollRun(tenant_id: string, runId: string, user_id: string) {
    return this.prisma.$transaction(async (tx) => {
      // Read on the transaction client so the APPROVED guard and the DISBURSING
      // write are atomic with the GL posting (Req 4.1/10.3).
      const run = await this.hrRepository.getPayrollRunById(tenant_id, runId, tx as any);
      if (!run) throw new NotFoundException('Payroll run not found');
      if (run.status !== 'APPROVED') throw new BadRequestException(`Cannot disburse run in ${run.status} status`);

      // 1. Resolve the company that owns this tenant (currency follows company
      //    registration). NOTE: a company's `id` is NOT the `tenant_id`; resolve
      //    by `tenant_id` rather than assuming `id === tenant_id`.
      const company = await tx.companies.findFirst({
        where: { tenant_id },
        select: { id: true, currency: true },
      });
      const currency = company?.currency ?? run.baseCurrency ?? 'USD';

      // 2. Transition status to DISBURSING (same transaction as the GL posting).
      const updatedRun = await this.hrRepository.updatePayrollRun(tenant_id, runId, {
        status: 'DISBURSING',
        updated_at: new Date(),
      }, tx as any);

      // 3. Post the balanced payroll journal via Finance, inside this transaction.
      //    Accounting (matches FinanceRepository.executePayrollRun convention):
      //      DR 6200 Gross Payroll Expense        = gross
      //      CR 1001 Net Payroll Disbursed (cash) = net
      //      CR 2100 Payroll Deductions Payable   = gross - net (when > 0)
      //    The Finance repository resolves the open fiscal period and
      //    resolve-or-creates the GL accounts, so the entry is always written
      //    (no silent skip) and is guaranteed to balance.
      const gross = Number(run.totalGrossPay) || 0;
      const net = Number(run.totalNetPay) || 0;
      const deductions = Math.max(0, Number((gross - net).toFixed(2)));

      const lines: Array<{ accountCode: string; description: string; debit: number; credit: number }> = [
        { accountCode: '6200', description: 'Gross Payroll Expense', debit: gross, credit: 0 },
        { accountCode: '1001', description: 'Net Payroll Disbursed', debit: 0, credit: net },
      ];
      if (deductions > 0) {
        lines.push({ accountCode: '2100', description: 'Payroll Deductions Payable', debit: 0, credit: deductions });
      }

      await this.financeService.createJournal(
        { tenant_id, company_id: company?.id ?? tenant_id, user_id } as TenantContext,
        {
          ref: `PAY-DISB-${runId}`,
          description: `Payroll disbursement for period ending ${run.period_end.toISOString().split('T')[0]} (${currency})`,
          lines,
        } as any,
        tx as any,
      );

      this.logger.log(`[HrSettlementService] Payroll run ${runId} disbursed; GL journal PAY-DISB-${runId} posted in ${currency}.`);

      // Audit log inside the SAME transaction as the status write + GL posting
      // (Req 4.4): a failure anywhere rolls back the status, journal, and log together.
      await this.auditService.log({
        tenant_id,
        user_id: user_id || 'SYSTEM',
        module: 'HR',
        action: 'DISBURSE_PAYROLL_RUN',
        entity_type: 'PAYROLL_RUN',
        entity_id: runId,
        before_state: { status: run.status },
        after_state: { status: 'DISBURSING' },
        metadata: { currency, gross, net, deductions },
      }, tx);

      return updatedRun;
    });
  }

  /**
   * Final Settle (Bank Transfer Confirmed / ACK received)
   */
  async settlePayrollRun(tenant_id: string, runId: string, user_id: string) {
    return this.prisma.$transaction(async (tx) => {
      // Read on the transaction client so the DISBURSING guard and the SETTLED
      // write are atomic (Req 4.1/10.5). The SETTLED status write, the settlement
      // GL journal, the audit log, and the domain event all run on this same `tx`
      // so they commit or roll back together (Req 4.4/10.4).
      const run = await this.hrRepository.getPayrollRunById(tenant_id, runId, tx as any);
      if (!run) throw new NotFoundException('Payroll run not found');
      if (run.status !== 'DISBURSING') throw new BadRequestException(`Cannot settle run in ${run.status} status`);

      // 1. Resolve the company that owns this tenant (currency follows company
      //    registration; a company's `id` is NOT the `tenant_id`, resolve by
      //    `tenant_id`). Mirrors the disburse path so currency is never hardcoded.
      const company = await tx.companies.findFirst({
        where: { tenant_id },
        select: { id: true, currency: true },
      });
      const currency = company?.currency ?? run.baseCurrency ?? 'USD';

      // 2. Transition status to SETTLED (same transaction as the finance records).
      const updated = await this.hrRepository.updatePayrollRun(tenant_id, runId, {
        status: 'SETTLED',
        updated_at: new Date(),
      }, tx as any);

      // 3. Produce the settlement Finance integration records inside this
      //    transaction (Req 10.4). Accounting decision — avoid double-posting:
      //    the gross payroll EXPENSE journal (DR 6200 / CR 1001 / CR 2100) is
      //    already posted at APPROVED→DISBURSING. Settlement confirms the bank
      //    transfer/ACK, so the correct entry RECLASSIFIES the in-transit
      //    "Net Payroll Disbursed" clearing balance to Cash — it does NOT
      //    re-post the expense:
      //      DR 1001 Net Payroll Disbursed (clear in-transit clearing) = net
      //      CR 1000 Cash (actual cash leaves on bank confirmation)     = net
      //    Debit total === credit total (== net), so the journal balances and
      //    exactly one expense journal exists across the lifecycle.
      const net = Number(run.totalNetPay) || 0;
      const lines: Array<{ accountCode: string; description: string; debit: number; credit: number }> = [
        { accountCode: '1001', description: 'Net Payroll Disbursed (clearing)', debit: net, credit: 0 },
        { accountCode: '1000', description: 'Cash', debit: 0, credit: net },
      ];

      await this.financeService.createJournal(
        { tenant_id, company_id: company?.id ?? tenant_id, user_id } as TenantContext,
        {
          ref: `PAY-SETTLE-${runId}`,
          description: `Payroll settlement for period ending ${run.period_end.toISOString().split('T')[0]} (${currency})`,
          lines,
        } as any,
        tx as any,
      );

      this.logger.log(`[HrSettlementService] Payroll run ${runId} settled; settlement journal PAY-SETTLE-${runId} posted in ${currency}.`);

      // 4. Audit log written inside the SAME transaction as the status write +
      //    settlement journal (Req 4.4): a failure anywhere rolls them all back.
      await this.auditService.log({
        tenant_id,
        user_id: user_id || 'SYSTEM',
        module: 'HR',
        action: 'SETTLE_PAYROLL_RUN',
        entity_type: 'PAYROLL_RUN',
        entity_id: runId,
        before_state: { status: run.status },
        after_state: { status: 'SETTLED' },
        metadata: { currency, net },
      }, tx);

      // 5. Emit the settlement domain event on the SAME transaction (Req 4.4):
      //    the event is persisted to the event store atomically with the SETTLED
      //    write so it cannot be observed unless the settlement commits.
      await this.eventBus.publish({
        event_type: (EVENT_NAMES as any).PAYROLL_SETTLED || 'HR.PAYROLL_SETTLED',
        tenant_id,
        entity_id: runId,
        entity_type: 'PAYROLL_RUN',
        source_module: 'HR',
        user_id,
        payload: {
          total_gross: Number(run.totalGrossPay) || 0,
          currency,
          period_end: run.period_end,
        },
      }, tx);

      return updated;
    });
  }
}
