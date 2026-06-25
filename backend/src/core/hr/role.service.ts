import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() { return this.getRoles(); }
  async findById(id: string) { return this.getRoleById(id); }
  async findByName(name: string) { return this.getRoleByName(name); }

  async getRoles() {
    return this.prisma.role.findMany({ orderBy: { role_name: 'asc' } });
  }

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async getRoleByName(roleName: string) {
    return this.prisma.role.findUnique({ where: { role_name: roleName } });
  }

  async createRole(data: { role_name: string; permissions?: any }, _userId?: string) {
    const existing = await this.prisma.role.findUnique({ where: { role_name: data.role_name } });
    if (existing) throw new ConflictException('Role name already exists');
    return this.prisma.role.create({ data });
  }

  async updateRole(id: string, data: { role_name?: string; permissions?: any }, _userId?: string) {
    await this.getRoleById(id);
    return this.prisma.role.update({ where: { id }, data: { ...data, updated_at: new Date() } });
  }

  async deleteRole(id: string, _userId?: string) {
    await this.getRoleById(id);
    return this.prisma.role.delete({ where: { id } });
  }

  async assignRoleToEmployee(employeeId: string, roleId: string, _userId?: string) {
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { role_id: roleId },
    });
  }

  async getEmployeesByRole(roleId: string) {
    return this.prisma.employee.findMany({
      where: { role_id: roleId, employment_status: 'active' },
      select: { id: true, full_name: true, email: true, employee_code: true },
    });
  }

  async getEmployeePermissions(employeeId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { role: true },
    });
    return emp?.role?.permissions || {};
  }

  async hasPermission(employeeId: string, permission: string): Promise<boolean> {
    const perms = await this.getEmployeePermissions(employeeId);
    return perms?.[permission] === true;
  }
}
