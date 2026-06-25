import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() { return this.getDepartments(); }
  async findById(id: string) { return this.getDepartmentById(id); }
  async create(data: any) { return this.createDepartment(data); }
  async update(id: string, data: any) { return this.updateDepartment(id, data); }
  async remove(id: string) { return this.deleteDepartment(id); }

  async getDepartments() {
    return this.prisma.department.findMany({
      include: { employees: { select: { id: true, full_name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getDepartmentById(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { employees: { select: { id: true, full_name: true, email: true } } },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async createDepartment(data: { name: string; description?: string; manager_id?: string }, _userId?: string) {
    const existing = await this.prisma.department.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Department name already exists');
    return this.prisma.department.create({ data });
  }

  async updateDepartment(id: string, data: { name?: string; description?: string; manager_id?: string }, _userId?: string) {
    await this.getDepartmentById(id);
    return this.prisma.department.update({ where: { id }, data: { ...data, updated_at: new Date() } });
  }

  async deleteDepartment(id: string, _userId?: string) {
    await this.getDepartmentById(id);
    return this.prisma.department.delete({ where: { id } });
  }

  async getDepartmentEmployees(id: string) {
    const dept = await this.getDepartmentById(id);
    return dept.employees;
  }

  async assignManager(departmentId: string, managerId: string, _userId?: string) {
    await this.getDepartmentById(departmentId);
    return this.prisma.department.update({
      where: { id: departmentId },
      data: { manager_id: managerId, updated_at: new Date() },
    });
  }
}
