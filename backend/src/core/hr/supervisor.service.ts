import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class SupervisorService {
  constructor(private readonly prisma: PrismaService) {}

  async assignSupervisor(employeeId: string, supervisorId: string, _userId?: string) {
    if (employeeId === supervisorId) {
      throw new BadRequestException('Cannot assign employee as their own supervisor');
    }
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');
    const supervisor = await this.prisma.employee.findUnique({ where: { id: supervisorId } });
    if (!supervisor) throw new NotFoundException('Supervisor not found');

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { supervisor_id: supervisorId },
    });
  }

  async getSubordinates(supervisorId: string, _extra?: any) {
    return this.prisma.employee.findMany({
      where: { supervisor_id: supervisorId, employment_status: 'active' },
      select: {
        id: true,
        full_name: true,
        email: true,
        employee_code: true,
        department: { select: { name: true } },
      },
    });
  }

  async removeSupervisor(employeeId: string, _userId?: string) {
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { supervisor_id: null },
    });
  }

  async getSupervisorChain(employeeId: string) {
    const chain: any[] = [];
    let currentId = employeeId;
    while (currentId) {
      const emp = await this.prisma.employee.findUnique({
        where: { id: currentId },
        select: { id: true, full_name: true, supervisor_id: true },
      });
      if (!emp || !emp.supervisor_id) break;
      chain.push({ id: emp.supervisor_id });
      currentId = emp.supervisor_id;
    }
    return chain;
  }

  async getReportingChain(employeeId: string) {
    return this.getSupervisorChain(employeeId);
  }

  async getOrganizationalHierarchy(..._args: any[]) {
    return this.prisma.employee.findMany({
      where: { employment_status: 'active' },
      select: {
        id: true,
        full_name: true,
        supervisor_id: true,
        department: { select: { name: true } },
        role: { select: { role_name: true } },
      },
    });
  }

  async bulkAssignSupervisor(assignments: any, _extra?: any, _extra2?: any) {
    const list = Array.isArray(assignments) ? assignments : [assignments];
    const results = [];
    for (const a of list) {
      const result = await this.assignSupervisor(a.employeeId, a.supervisorId);
      results.push(result);
    }
    return results;
  }
}
