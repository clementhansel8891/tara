import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../persistence/prisma.service';
import { IPayrollRepository } from './interfaces/payroll.repository.interface';
import { PayrollRecord } from '../domain/finance.interfaces';

@Injectable()
export class PayrollDbRepository implements IPayrollRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  private get db(): Prisma.TransactionClient {
    if (this.prisma instanceof PrismaService) {
        return this.prisma as any;
    }
    return this.prisma as Prisma.TransactionClient;
  }

  async findById(tenant_id: string, company_id: string, id: string): Promise<PayrollRecord | null> {
    // Tenant-scoped, composite-key read. Filtering by `id` alone allowed a
    // caller of one tenant to read another tenant's payroll line.
    const res = await this.db.payroll_lines.findFirst({
      where: { id, tenant_id },
      include: { hr_payroll_runs: true }
    });
    if (!res) return null;
    return {
      id: res.id,
      tenant_id: res.tenant_id,
      company_id: company_id,
      employee_id: res.employee_id,
      periodId: res.hr_payroll_runs.id, // Align with PayrollRecord
      baseSalary: res.gross_pay,
      netSalary: res.net_pay,
      status: res.hr_payroll_runs.status as any,
    };
  }

  async findAll(tenant_id: string, company_id: string, period?: string): Promise<PayrollRecord[]> {
    const list = await this.db.payroll_lines.findMany({
      where: { tenant_id: tenant_id },
      include: { hr_payroll_runs: true }
    });
    return list.map((res: any) => ({
      id: res.id,
      tenant_id: res.tenant_id,
      company_id: company_id,
      employee_id: res.employee_id,
      periodId: res.hr_payroll_runs.id,
      baseSalary: res.gross_pay,
      netSalary: res.net_pay,
      status: res.hr_payroll_runs.status as any,
    }));
  }
}
