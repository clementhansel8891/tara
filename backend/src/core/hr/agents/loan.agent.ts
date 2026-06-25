import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../persistence/prisma.service';
import {
  NotificationService,
  TaraNotificationType,
} from '../services/notification.service';
import { EventBusService, TaraEvent } from '../services/event-bus.service';

/**
 * Loan request processing result.
 */
export interface LoanProcessingResult {
  loan_id: string;
  employee_id: string;
  status: 'auto_approved' | 'pending_review' | 'rejected';
  reason: string;
}

/**
 * Loan Agent (Kasbon/Pinjaman Agent)
 *
 * Autonomous service for TARA HR System that handles:
 * - Auto-approval of small loans (kasbon kecil) based on configurable threshold
 * - Repayment due date reminders (3 days before due)
 * - Overdue loan detection and escalation to HR
 * - Monthly loan summary reports to HR_Team
 * - Integration with payroll for installment deductions
 * - Event emission for all loan lifecycle actions
 *
 * Scheduled tasks:
 * - Daily at 08:00 WIB: check for upcoming due dates (3-day reminder)
 * - Daily at 09:00 WIB: detect overdue installments and escalate
 * - Monthly 1st at 07:00 WIB: generate monthly loan portfolio summary
 *
 * Event-driven:
 * - loan.request.submitted: process new loan request (auto-approve or escalate)
 * - loan.repayment.recorded: update loan balance and notify employee
 */
@Injectable()
export class LoanAgent {
  private readonly logger = new Logger(LoanAgent.name);

  /** Maximum amount (IDR) that can be auto-approved without HR review */
  private readonly AUTO_APPROVE_THRESHOLD = 2_000_000; // 2 juta IDR
  /** Days before due date to send reminder */
  private readonly REMINDER_DAYS_BEFORE = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventBusService: EventBusService,
  ) {
    this.logger.log('Loan Agent initialized');
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  /**
   * Handle new loan request submission.
   *
   * Auto-approves if amount is below threshold and employee has no overdue loans.
   * Otherwise, escalates to HR for manual review.
   */
  @OnEvent('loan.request.submitted')
  async handleLoanRequestSubmitted(event: TaraEvent | any): Promise<LoanProcessingResult> {
    const payload = event?.payload || event;
    const { loan_id, employee_id, amount } = payload;

    this.logger.log(`Processing loan request ${loan_id} from employee ${employee_id}, amount: ${amount}`);

    try {
      // Check for overdue loans
      const overdueLoans = await this.getOverdueLoansForEmployee(employee_id);

      if (overdueLoans.length > 0) {
        // Reject — employee has overdue installments
        await this.rejectLoanRequest(loan_id, employee_id, 'Employee has overdue loan installments');
        return { loan_id, employee_id, status: 'rejected', reason: 'Overdue loans exist' };
      }

      if (amount <= this.AUTO_APPROVE_THRESHOLD) {
        // Auto-approve small loans
        await this.autoApproveLoan(loan_id, employee_id, amount);
        return { loan_id, employee_id, status: 'auto_approved', reason: 'Below auto-approval threshold' };
      }

      // Escalate to HR for review
      await this.escalateToHR(loan_id, employee_id, amount);
      return { loan_id, employee_id, status: 'pending_review', reason: 'Amount exceeds auto-approval threshold' };
    } catch (error) {
      this.logger.error(`Failed to process loan request ${loan_id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle loan repayment recorded.
   * Sends confirmation to employee and checks if loan is fully paid.
   */
  @OnEvent('loan.repayment.recorded')
  async handleRepaymentRecorded(event: TaraEvent | any): Promise<void> {
    const payload = event?.payload || event;
    const { loan_id, employee_id, amount, remaining_balance } = payload;

    this.logger.log(`Repayment recorded for loan ${loan_id}: ${amount}, remaining: ${remaining_balance}`);

    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employee_id },
        select: { full_name: true },
      });

      // Send confirmation notification
      await this.notificationService.sendNotification({
        recipient_id: employee_id,
        type: TaraNotificationType.GENERAL_NOTIFICATION,
        title: 'Pembayaran Cicilan Diterima',
        content: `Halo ${employee?.full_name ?? 'Karyawan'}, pembayaran cicilan sebesar Rp ${Number(amount).toLocaleString('id-ID')} telah diterima. Sisa pinjaman: Rp ${Number(remaining_balance).toLocaleString('id-ID')}.`,
      });

      // If fully paid, emit completion event
      if (Number(remaining_balance) <= 0) {
        await this.emitLoanEvent('loan.fully_paid', {
          loan_id,
          employee_id,
          employee_name: employee?.full_name,
        });

        await this.notificationService.sendNotification({
          recipient_id: employee_id,
          type: TaraNotificationType.GENERAL_NOTIFICATION,
          title: 'Pinjaman Lunas',
          content: `Selamat ${employee?.full_name ?? ''}! Pinjaman Anda telah lunas. Terima kasih atas pembayaran tepat waktu.`,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to handle repayment for loan ${loan_id}: ${error.message}`, error.stack);
    }
  }

  // ─── Scheduled Tasks ──────────────────────────────────────────────────────

  /**
   * Daily reminder for upcoming installment due dates.
   * Runs at 08:00 WIB (01:00 UTC) Mon-Fri.
   */
  @Cron('0 1 * * 1-5') // 08:00 WIB
  async sendDueReminders(): Promise<void> {
    this.logger.log('Checking for upcoming loan due dates');

    try {
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + this.REMINDER_DAYS_BEFORE);

      // Find installments due within the reminder window
      // Using raw query since finance_loan_installments may not be in Prisma client
      const upcomingDue = await this.prisma.$queryRaw<any[]>`
        SELECT 
          fli.id as installment_id,
          fli.loan_id,
          fli.due_date,
          fli.amount,
          fl.employee_id,
          e.full_name as employee_name
        FROM finance_loan_installments fli
        JOIN finance_loans fl ON fl.id = fli.loan_id
        JOIN employees e ON e.id = fl.employee_id
        WHERE fli.status = 'PENDING'
          AND fli.due_date <= ${reminderDate}
          AND fli.due_date >= CURRENT_DATE
          AND fl.status = 'ACTIVE'
      `;

      for (const installment of upcomingDue) {
        const dueDate = new Date(installment.due_date);
        const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        await this.notificationService.sendNotification({
          recipient_id: installment.employee_id,
          type: TaraNotificationType.GENERAL_NOTIFICATION,
          title: 'Pengingat Cicilan Pinjaman',
          content: `Halo ${installment.employee_name}, cicilan pinjaman sebesar Rp ${Number(installment.amount).toLocaleString('id-ID')} akan jatuh tempo dalam ${daysUntil} hari (${dueDate.toLocaleDateString('id-ID')}). Pastikan saldo mencukupi.`,
        });
      }

      if (upcomingDue.length > 0) {
        this.logger.log(`Sent ${upcomingDue.length} due date reminder(s)`);
        await this.emitLoanEvent('loan.due_reminders_sent', {
          count: upcomingDue.length,
          reminder_date: reminderDate.toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send due reminders: ${error.message}`, error.stack);
    }
  }

  /**
   * Daily overdue detection and escalation.
   * Runs at 09:00 WIB (02:00 UTC) Mon-Fri.
   */
  @Cron('0 2 * * 1-5') // 09:00 WIB
  async detectOverdueInstallments(): Promise<void> {
    this.logger.log('Checking for overdue loan installments');

    try {
      const overdueInstallments = await this.prisma.$queryRaw<any[]>`
        SELECT 
          fli.id as installment_id,
          fli.loan_id,
          fli.due_date,
          fli.amount,
          fl.employee_id,
          e.full_name as employee_name,
          CURRENT_DATE - fli.due_date::date as days_overdue
        FROM finance_loan_installments fli
        JOIN finance_loans fl ON fl.id = fli.loan_id
        JOIN employees e ON e.id = fl.employee_id
        WHERE fli.status = 'PENDING'
          AND fli.due_date < CURRENT_DATE
          AND fl.status = 'ACTIVE'
        ORDER BY fli.due_date ASC
      `;

      if (overdueInstallments.length === 0) {
        this.logger.log('No overdue installments found');
        return;
      }

      this.logger.warn(`Found ${overdueInstallments.length} overdue installment(s)`);

      // Notify each employee
      for (const inst of overdueInstallments) {
        await this.notificationService.sendNotification({
          recipient_id: inst.employee_id,
          type: TaraNotificationType.GENERAL_NOTIFICATION,
          title: 'Cicilan Pinjaman Jatuh Tempo',
          content: `Perhatian ${inst.employee_name}: cicilan sebesar Rp ${Number(inst.amount).toLocaleString('id-ID')} telah melewati tanggal jatuh tempo (${inst.days_overdue} hari). Harap segera melakukan pembayaran.`,
        });
      }

      // Escalate summary to HR Team
      await this.emitLoanEvent('loan.overdue_detected', {
        count: overdueInstallments.length,
        total_overdue_amount: overdueInstallments.reduce((sum: number, i: any) => sum + Number(i.amount), 0),
        employees_affected: [...new Set(overdueInstallments.map((i: any) => i.employee_id))].length,
        details: overdueInstallments.map((i: any) => ({
          employee_name: i.employee_name,
          amount: Number(i.amount),
          days_overdue: Number(i.days_overdue),
        })),
      });
    } catch (error) {
      this.logger.error(`Failed to detect overdue installments: ${error.message}`, error.stack);
    }
  }

  /**
   * Monthly loan portfolio summary.
   * Runs 1st of every month at 07:00 WIB (00:00 UTC).
   */
  @Cron('0 0 1 * *') // 1st of month, 07:00 WIB
  async generateMonthlyLoanSummary(): Promise<void> {
    this.logger.log('Generating monthly loan portfolio summary');

    try {
      const summary = await this.prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_loans,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_loans,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_loans,
          COALESCE(SUM(amount) FILTER (WHERE status = 'ACTIVE'), 0) as total_active_amount,
          COUNT(DISTINCT employee_id) FILTER (WHERE status = 'ACTIVE') as employees_with_active_loans
        FROM finance_loans
      `;

      const report = summary[0] || {};

      await this.emitLoanEvent('loan.monthly_summary', {
        period: new Date().toISOString().substring(0, 7),
        active_loans: Number(report.active_loans || 0),
        pending_loans: Number(report.pending_loans || 0),
        completed_loans: Number(report.completed_loans || 0),
        total_active_amount: Number(report.total_active_amount || 0),
        employees_with_active_loans: Number(report.employees_with_active_loans || 0),
      });

      this.logger.log(
        `Monthly loan summary: ${report.active_loans} active, ${report.pending_loans} pending, ` +
          `total outstanding: Rp ${Number(report.total_active_amount || 0).toLocaleString('id-ID')}`,
      );
    } catch (error) {
      this.logger.error(`Failed to generate monthly loan summary: ${error.message}`, error.stack);
    }
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  private async getOverdueLoansForEmployee(employeeId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT fli.id, fli.loan_id, fli.due_date, fli.amount
      FROM finance_loan_installments fli
      JOIN finance_loans fl ON fl.id = fli.loan_id
      WHERE fl.employee_id = ${employeeId}
        AND fl.status = 'ACTIVE'
        AND fli.status = 'PENDING'
        AND fli.due_date < CURRENT_DATE
    `;
  }

  private async autoApproveLoan(loanId: string, employeeId: string, amount: number): Promise<void> {
    this.logger.log(`Auto-approving loan ${loanId} (amount: ${amount})`);

    await this.prisma.$executeRaw`
      UPDATE finance_loans SET status = 'ACTIVE', updated_at = NOW() WHERE id = ${loanId}
    `;

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { full_name: true },
    });

    await this.notificationService.sendNotification({
      recipient_id: employeeId,
      type: TaraNotificationType.GENERAL_NOTIFICATION,
      title: 'Pinjaman Disetujui',
      content: `Halo ${employee?.full_name ?? 'Karyawan'}, pengajuan pinjaman (kasbon) sebesar Rp ${amount.toLocaleString('id-ID')} telah disetujui secara otomatis. Dana akan dicairkan sesuai kebijakan perusahaan.`,
    });

    await this.emitLoanEvent('loan.auto_approved', {
      loan_id: loanId,
      employee_id: employeeId,
      employee_name: employee?.full_name,
      amount,
    });
  }

  private async rejectLoanRequest(loanId: string, employeeId: string, reason: string): Promise<void> {
    this.logger.log(`Rejecting loan ${loanId}: ${reason}`);

    await this.prisma.$executeRaw`
      UPDATE finance_loans SET status = 'REJECTED', updated_at = NOW() WHERE id = ${loanId}
    `;

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { full_name: true },
    });

    await this.notificationService.sendNotification({
      recipient_id: employeeId,
      type: TaraNotificationType.GENERAL_NOTIFICATION,
      title: 'Pengajuan Pinjaman Ditolak',
      content: `Halo ${employee?.full_name ?? 'Karyawan'}, pengajuan pinjaman Anda ditolak. Alasan: ${reason}. Harap selesaikan cicilan yang tertunggak terlebih dahulu.`,
    });

    await this.emitLoanEvent('loan.rejected', { loan_id: loanId, employee_id: employeeId, reason });
  }

  private async escalateToHR(loanId: string, employeeId: string, amount: number): Promise<void> {
    this.logger.log(`Escalating loan ${loanId} to HR review (amount: ${amount})`);

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { full_name: true },
    });

    await this.notificationService.sendNotification({
      recipient_id: employeeId,
      type: TaraNotificationType.GENERAL_NOTIFICATION,
      title: 'Pengajuan Pinjaman Dalam Proses Review',
      content: `Halo ${employee?.full_name ?? 'Karyawan'}, pengajuan pinjaman sebesar Rp ${amount.toLocaleString('id-ID')} telah diterima dan sedang dalam proses review oleh HR.`,
    });

    await this.emitLoanEvent('loan.pending_hr_review', {
      loan_id: loanId,
      employee_id: employeeId,
      employee_name: employee?.full_name,
      amount,
    });
  }

  private async emitLoanEvent(eventType: string, payload: any): Promise<void> {
    try {
      const event: Partial<TaraEvent> = {
        event_type: eventType,
        event_version: '1.0',
        event_timestamp: new Date(),
        actor: { id: 'loan_agent', type: 'agent' },
        entity: { id: payload.loan_id || 'system', type: 'loan' },
        payload,
      };
      await this.eventBusService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to emit loan event ${eventType}: ${error.message}`);
    }
  }

  /**
   * Get agent health status.
   */
  async getHealthStatus(): Promise<{
    agent_name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    last_check: string;
    metrics: {
      active_loans: number;
      overdue_installments: number;
      pending_requests: number;
    };
  }> {
    try {
      const [activeLoans, overdueInstallments, pendingRequests] = await Promise.all([
        this.prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as count FROM finance_loans WHERE status = 'ACTIVE'`.then((r) => r[0]?.count ?? 0),
        this.prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as count FROM finance_loan_installments WHERE status = 'PENDING' AND due_date < CURRENT_DATE`.then((r) => r[0]?.count ?? 0),
        this.prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as count FROM finance_loans WHERE status = 'PENDING'`.then((r) => r[0]?.count ?? 0),
      ]);

      return {
        agent_name: 'Loan_Agent',
        status: overdueInstallments > 10 ? 'degraded' : 'healthy',
        last_check: new Date().toISOString(),
        metrics: {
          active_loans: Number(activeLoans),
          overdue_installments: Number(overdueInstallments),
          pending_requests: Number(pendingRequests),
        },
      };
    } catch (error) {
      return {
        agent_name: 'Loan_Agent',
        status: 'unhealthy',
        last_check: new Date().toISOString(),
        metrics: { active_loans: 0, overdue_installments: 0, pending_requests: 0 },
      };
    }
  }
}
