import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  constructor(private readonly prisma: PrismaService) {}

  // === Loan Requests ===

  async getLoans(filters?: { employee_id?: string; status?: string }) {
    const where: any = {};
    if (filters?.employee_id) where.employee_id = filters.employee_id;
    if (filters?.status) where.status = filters.status;

    return this.prisma.loan.findMany({
      where,
      include: { employee: { select: { id: true, full_name: true, employee_code: true } } },
      orderBy: { request_date: 'desc' },
    });
  }

  async getMyLoans(employeeId: string) {
    return this.prisma.loan.findMany({
      where: { employee_id: employeeId },
      include: { repayments: { orderBy: { payment_date: 'desc' } } },
      orderBy: { request_date: 'desc' },
    });
  }

  async requestLoan(data: {
    employee_id: string;
    loan_type: string;
    amount: number;
    installment_count?: number;
    reason?: string;
  }) {
    const installmentAmount = data.installment_count
      ? data.amount / data.installment_count
      : data.amount;

    return this.prisma.loan.create({
      data: {
        employee_id: data.employee_id,
        loan_type: data.loan_type,
        amount: data.amount,
        remaining_balance: data.amount,
        installment_amount: installmentAmount,
        installment_count: data.installment_count || 1,
        status: 'pending',
        reason: data.reason,
      },
    });
  }

  async approveLoan(loanId: string, approvedBy: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'pending') throw new BadRequestException('Loan is not pending');

    return this.prisma.loan.update({
      where: { id: loanId },
      data: { status: 'active', approved_by: approvedBy, approved_at: new Date() },
    });
  }

  async rejectLoan(loanId: string, notes?: string) {
    return this.prisma.loan.update({
      where: { id: loanId },
      data: { status: 'rejected', notes, updated_at: new Date() },
    });
  }

  // === Repayments ===

  async recordRepayment(loanId: string, data: { amount: number; payment_date: Date; payment_method?: string; notes?: string }) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'active') throw new BadRequestException('Loan is not active');

    const newBalance = Number(loan.remaining_balance) - data.amount;
    const newPaidInstallments = loan.paid_installments + 1;
    const isPaidOff = newBalance <= 0;

    await this.prisma.loanRepayment.create({
      data: {
        loan_id: loanId,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method || 'payroll_deduction',
        notes: data.notes,
      },
    });

    return this.prisma.loan.update({
      where: { id: loanId },
      data: {
        remaining_balance: Math.max(0, newBalance),
        paid_installments: newPaidInstallments,
        status: isPaidOff ? 'paid_off' : 'active',
        updated_at: new Date(),
      },
    });
  }

  async getLoanSummary(employeeId: string) {
    const loans = await this.prisma.loan.findMany({
      where: { employee_id: employeeId, status: 'active' },
    });
    const totalOutstanding = loans.reduce((sum, l) => sum + Number(l.remaining_balance), 0);
    const monthlyDeduction = loans.reduce((sum, l) => sum + Number(l.installment_amount || 0), 0);

    return { active_loans: loans.length, total_outstanding: totalOutstanding, monthly_deduction: monthlyDeduction };
  }
}
