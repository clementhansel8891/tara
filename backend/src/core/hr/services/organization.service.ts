import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';

/**
 * Organization Service — manages offices, branches, departments, roles.
 * All CRUD-able via the Settings UI.
 */
@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // === Office/Branch Locations ===

  async getOfficeLocations() {
    return this.prisma.officeLocation.findMany({ orderBy: { location_name: 'asc' } });
  }

  async createOfficeLocation(data: {
    location_name: string;
    address?: string;
    latitude: number;
    longitude: number;
    geofence_radius_meters: number;
  }) {
    return this.prisma.officeLocation.create({ data: { ...data, is_active: true } });
  }

  async updateOfficeLocation(id: string, data: Partial<{
    location_name: string;
    address: string;
    latitude: number;
    longitude: number;
    geofence_radius_meters: number;
    is_active: boolean;
  }>) {
    const loc = await this.prisma.officeLocation.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException('Office location not found');
    return this.prisma.officeLocation.update({ where: { id }, data: { ...data, updated_at: new Date() } });
  }

  async deleteOfficeLocation(id: string) {
    await this.prisma.officeLocation.delete({ where: { id } });
  }

  // === Departments ===

  async getDepartments() {
    return this.prisma.department.findMany({
      include: { employees: { select: { id: true }, where: { employment_status: 'active' } } },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(data: { name: string; description?: string; manager_id?: string }) {
    const existing = await this.prisma.department.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Department already exists');
    return this.prisma.department.create({ data });
  }

  async updateDepartment(id: string, data: { name?: string; description?: string; manager_id?: string }) {
    return this.prisma.department.update({ where: { id }, data: { ...data, updated_at: new Date() } });
  }

  async deleteDepartment(id: string) {
    await this.prisma.department.delete({ where: { id } });
  }

  // === Roles ===

  async getRoles() {
    return this.prisma.role.findMany({
      include: { employees: { select: { id: true }, where: { employment_status: 'active' } } },
      orderBy: { role_name: 'asc' },
    });
  }

  async createRole(data: { role_name: string; permissions?: any }) {
    const existing = await this.prisma.role.findUnique({ where: { role_name: data.role_name } });
    if (existing) throw new ConflictException('Role already exists');
    return this.prisma.role.create({ data });
  }

  async updateRole(id: string, data: { role_name?: string; permissions?: any }) {
    return this.prisma.role.update({ where: { id }, data: { ...data, updated_at: new Date() } });
  }

  async deleteRole(id: string) {
    await this.prisma.role.delete({ where: { id } });
  }

  // === User Account Management (username/password by role) ===

  async getEmployeesByRole(roleName: string) {
    return this.prisma.employee.findMany({
      where: { role: { role_name: roleName }, employment_status: 'active' },
      select: { id: true, full_name: true, email: true, employee_code: true, role: true },
    });
  }

  async updateEmployeeCredentials(employeeId: string, data: { email?: string; password_hash?: string }) {
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { ...data, updated_at: new Date() },
    });
  }

  // === Permission Management ===

  async getRolePermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    return role.permissions || {};
  }

  async updateRolePermissions(roleId: string, permissions: Record<string, boolean>) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: { permissions, updated_at: new Date() },
    });
  }

  async getUserPermissions(employeeId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { role: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return { employee_id: emp.id, role: emp.role?.role_name, permissions: emp.role?.permissions || {} };
  }
}
