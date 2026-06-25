import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoleService } from '../role.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { TaraJwtAuthGuard } from '../../auth/guards/tara-jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

/**
 * Role Controller
 * Manages role CRUD operations and permission management
 * 
 * Requirements:
 * - 12.5: Role-based access control with role assignment
 * - 20.5: Role management
 */
@Controller('roles')
@UseGuards(TaraJwtAuthGuard, RolesGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * Get all roles
   * Accessible by: HR_Team, Supervisor
   */
  @Get()
  @Roles('hr_team', 'supervisor')
  async getRoles() {
    return this.roleService.getRoles();
  }

  /**
   * Get role by ID
   * Accessible by: HR_Team, Supervisor
   */
  @Get(':id')
  @Roles('hr_team', 'supervisor')
  async getRoleById(@Param('id') id: string) {
    return this.roleService.getRoleById(id);
  }

  /**
   * Get role by name
   * Accessible by: HR_Team, Supervisor
   */
  @Get('name/:name')
  @Roles('hr_team', 'supervisor')
  async getRoleByName(@Param('name') name: string) {
    return this.roleService.getRoleByName(name);
  }

  /**
   * Create new role
   * Accessible by: HR_Team only
   */
  @Post()
  @Roles('hr_team')
  async createRole(@Body() data: CreateRoleDto, @Request() req: any) {
    return this.roleService.createRole(data, req.user?.id);
  }

  /**
   * Update role
   * Accessible by: HR_Team only
   */
  @Put(':id')
  @Roles('hr_team')
  async updateRole(
    @Param('id') id: string,
    @Body() data: UpdateRoleDto,
    @Request() req: any,
  ) {
    return this.roleService.updateRole(id, data, req.user?.id);
  }

  /**
   * Delete role
   * Accessible by: HR_Team only
   */
  @Delete(':id')
  @Roles('hr_team')
  async deleteRole(@Param('id') id: string, @Request() req: any) {
    await this.roleService.deleteRole(id, req.user?.id);
    return { message: 'Role deleted successfully' };
  }

  /**
   * Assign role to employee
   * Accessible by: HR_Team only
   */
  @Put(':roleId/assign/:employeeId')
  @Roles('hr_team')
  async assignRoleToEmployee(
    @Param('roleId') roleId: string,
    @Param('employeeId') employeeId: string,
    @Request() req: any,
  ) {
    return this.roleService.assignRoleToEmployee(employeeId, roleId, req.user?.id);
  }

  /**
   * Get all employees with a specific role
   * Accessible by: HR_Team, Supervisor
   */
  @Get(':id/employees')
  @Roles('hr_team', 'supervisor')
  async getEmployeesByRole(@Param('id') id: string) {
    return this.roleService.getEmployeesByRole(id);
  }

  /**
   * Get employee permissions
   * Accessible by: HR_Team, Supervisor, or self
   */
  @Get('employee/:employeeId/permissions')
  @Roles('hr_team', 'supervisor', 'employee')
  async getEmployeePermissions(@Param('employeeId') employeeId: string, @Request() req: any) {
    // Allow employees to view their own permissions only
    if (req.user?.role === 'employee' && req.user?.id !== employeeId) {
      throw new Error('Employees can only view their own permissions');
    }
    return this.roleService.getEmployeePermissions(employeeId);
  }

  /**
   * Check if employee has specific permission
   * Accessible by: HR_Team, Supervisor, or self
   */
  @Get('employee/:employeeId/has-permission/:permission')
  @Roles('hr_team', 'supervisor', 'employee')
  async hasPermission(
    @Param('employeeId') employeeId: string,
    @Param('permission') permission: string,
    @Request() req: any,
  ) {
    // Allow employees to check their own permissions only
    if (req.user?.role === 'employee' && req.user?.id !== employeeId) {
      throw new Error('Employees can only check their own permissions');
    }
    const hasPermission = await this.roleService.hasPermission(employeeId, permission);
    return { has_permission: hasPermission };
  }
}
