import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(private readonly prisma: PrismaService) {}

  // === Payroll Periods ===

  async getPeriods(status?: string) {
    const where = status ? { status } : {};
    return this.prisma.payrollPeriod.findMany({ where, orderBy: { start_date: 'desc' } });
  }

  async createPeriod(data: { period_name: string; start_date: Date; end_date: Date }) {
    return this.prisma.payrollPeriod.create({ data: { ...data, status: 'draft' } });
  }

  async processPeriod(periodId: string, processedBy: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status !== 'draft') throw new BadRequestException('Period already processed');

    // Get all active employees
    const employees = await this.prisma.employee.findMany({
      where: { employment_status: 'active' },
      select: { id: true },
    });

    // Create payslips for each employee
    for (const emp of employees) {
      await this.generatePayslip(emp.id, periodId);
    }

    // Update period status
    return this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'processing', processed_by: processedBy, processed_at: new Date() },
    });
  }

  async finalizePeriod(periodId: string) {
    return this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'finalized', updated_at: new Date() },
    });
  }

  // === Payslips ===

  async getPayslips(periodId: string) {
    return this.prisma.payslip.findMany({
      where: { period_id: periodId },
      include: { employee: { select: { id: true, full_name: true, employee_code: true, department: true } }, items: true },
      orderBy: { employee: { full_name: 'asc' } },
    });
  }

  async getEmployeePayslips(employeeId: string) {
    return this.prisma.payslip.findMany({
      where: { employee_id: employeeId },
      include: { period: true, items: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async getPayslipDetail(payslipId: string) {
    return this.prisma.payslip.findUnique({
      where: { id: payslipId },
      include: { employee: true, period: true, items: { orderBy: { item_type: 'asc' } } },
    });
  }

  async generatePayslip(employeeId: string, periodId: string) {
    // Get employee base salary from system settings or fixed value
    const baseSalary = 5000000; // Default — should come from employee record in production

    // Get mandatory components
    const mandatoryComponents = await this.prisma.payrollComponent.findMany({
      where: { is_mandatory: true, is_active: true },
    });

    // Get active loans for deduction
    const activeLoans = await this.prisma.loan.findMany({
      where: { employee_id: employeeId, status: 'active' },
    });

    // Calculate
    let totalAdditions = 0;
    let totalDeductions = 0;
    const items: any[] = [];

    for (const comp of mandatoryComponents) {
      const amount = comp.is_percentage
        ? (Number(comp.default_amount || 0) / 100) * baseSalary
        : Number(comp.default_amount || 0);

      if (comp.component_type === 'addition') totalAdditions += amount;
      else totalDeductions += amount;

      items.push({
        item_type: comp.component_type,
        item_name: comp.component_name,
        item_category: comp.category,
        amount,
      });
    }

    // Loan deductions
    for (const loan of activeLoans) {
      const installment = Number(loan.installment_amount || 0);
      if (installment > 0) {
        totalDeductions += installment;
        items.push({
          item_type: 'deduction',
          item_name: `Cicilan Pinjaman`,
          item_category: 'loan',
          amount: installment,
          description: `Loan #${loan.id.substring(0, 8)}`,
        });
      }
    }

    const netSalary = baseSalary + totalAdditions - totalDeductions;

    // Create payslip with items
    return this.prisma.payslip.create({
      data: {
        employee_id: employeeId,
        period_id: periodId,
        base_salary: baseSalary,
        total_additions: totalAdditions,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        status: 'draft',
        items: { create: items },
      },
      include: { items: true },
    });
  }

  // === Payslip Items (Add/Remove) ===

  async addPayslipItem(payslipId: string, data: { item_type: string; item_name: string; item_category?: string; amount: number; description?: string }) {
    const item = await this.prisma.payslipItem.create({ data: { payslip_id: payslipId, ...data } });

    // Recalculate payslip totals
    await this.recalculatePayslip(payslipId);
    return item;
  }

  async removePayslipItem(itemId: string) {
    const item = await this.prisma.payslipItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');

    await this.prisma.payslipItem.delete({ where: { id: itemId } });
    await this.recalculatePayslip(item.payslip_id);
  }

  private async recalculatePayslip(payslipId: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id: payslipId },
      include: { items: true },
    });
    if (!payslip) return;

    const additions = payslip.items.filter(i => i.item_type === 'addition').reduce((sum, i) => sum + Number(i.amount), 0);
    const deductions = payslip.items.filter(i => i.item_type === 'deduction').reduce((sum, i) => sum + Number(i.amount), 0);
    const net = Number(payslip.base_salary) + additions - deductions;

    await this.prisma.payslip.update({
      where: { id: payslipId },
      data: { total_additions: additions, total_deductions: deductions, net_salary: net, updated_at: new Date() },
    });
  }

  // === Payroll Components (templates) ===

  async getComponents() {
    return this.prisma.payrollComponent.findMany({ where: { is_active: true }, orderBy: { component_type: 'asc' } });
  }

  async createComponent(data: any) {
    return this.prisma.payrollComponent.create({ data });
  }

  async updateComponent(id: string, data: any) {
    return this.prisma.payrollComponent.update({ where: { id }, data: { ...data, updated_at: new Date() } });
  }

  async deleteComponent(id: string) {
    return this.prisma.payrollComponent.update({ where: { id }, data: { is_active: false } });
  }
}
