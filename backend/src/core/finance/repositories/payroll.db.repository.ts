import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../persistence/prisma.service';
import { IPayrollRepository } from './interfaces/payroll.repository.interface';
import { PayrollRecord } from '../domain/finance.interfaces';

@Injectable()
export class PayrollDbRepository implements IPayrollRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  private get db(): Prisma.TransactionClient {
    if (this.prisma instanceof PrismaService) {
        return this.prisma as any;
    }
    return this.prisma as Prisma.TransactionClient;
  }

  async findById(tenantId: string, companyId: string, id: string): Promise<PayrollRecord | null> {
    const res = await this.db.payrollLine.findUnique({
      where: { id },
      include: { payrollRun: true }
    });
    if (!res) return null;
    return {
      id: res.id,
      tenantId: res.tenantId,
      companyId: companyId,
      employeeId: res.employeeId,
      periodId: res.payrollRun.id, // Align with PayrollRecord
      baseSalary: res.grossPay,
      netSalary: res.netPay,
      status: res.payrollRun.status as any,
    };
  }

  async findAll(tenantId: string, companyId: string, period?: string): Promise<PayrollRecord[]> {
    const list = await this.db.payrollLine.findMany({
      where: { tenantId },
      include: { payrollRun: true }
    });
    return list.map(res => ({
      id: res.id,
      tenantId: res.tenantId,
      companyId: companyId,
      employeeId: res.employeeId,
      periodId: res.payrollRun.id,
      baseSalary: res.grossPay,
      netSalary: res.netPay,
      status: res.payrollRun.status as any,
    }));
  }
}
