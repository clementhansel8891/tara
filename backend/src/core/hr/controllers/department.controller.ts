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
import { DepartmentService } from '../department.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { TaraJwtAuthGuard } from '../../auth/guards/tara-jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

/**
 * Department Controller
 * Manages department CRUD operations and organizational structure
 * 
 * Requirements:
 * - 20.4: Department structure management
 * - 12.5: Role-based access control (HR_Team only)
 */
@Controller('departments')
@UseGuards(TaraJwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  /**
   * Get all departments
   * Accessible by: HR_Team, Supervisor
   */
  @Get()
  @Roles('hr_team', 'supervisor')
  async getDepartments() {
    return this.departmentService.getDepartments();
  }

  /**
   * Get department by ID
   * Accessible by: HR_Team, Supervisor
   */
  @Get(':id')
  @Roles('hr_team', 'supervisor')
  async getDepartmentById(@Param('id') id: string) {
    return this.departmentService.getDepartmentById(id);
  }

  /**
   * Create new department
   * Accessible by: HR_Team only
   */
  @Post()
  @Roles('hr_team')
  async createDepartment(@Body() data: CreateDepartmentDto, @Request() req: any) {
    return this.departmentService.createDepartment(
      {
        name: data.name,
        description: data.description,
        manager_id: data.headId, // Map headId to manager_id
      },
      req.user?.id,
    );
  }

  /**
   * Update department
   * Accessible by: HR_Team only
   */
  @Put(':id')
  @Roles('hr_team')
  async updateDepartment(
    @Param('id') id: string,
    @Body() data: Partial<CreateDepartmentDto>,
    @Request() req: any,
  ) {
    return this.departmentService.updateDepartment(
      id,
      {
        name: data.name,
        description: data.description,
        manager_id: data.headId,
      },
      req.user?.id,
    );
  }

  /**
   * Delete department
   * Accessible by: HR_Team only
   */
  @Delete(':id')
  @Roles('hr_team')
  async deleteDepartment(@Param('id') id: string, @Request() req: any) {
    await this.departmentService.deleteDepartment(id, req.user?.id);
    return { message: 'Department deleted successfully' };
  }

  /**
   * Get all employees in a department
   * Accessible by: HR_Team, Supervisor
   */
  @Get(':id/employees')
  @Roles('hr_team', 'supervisor')
  async getDepartmentEmployees(@Param('id') id: string) {
    return this.departmentService.getDepartmentEmployees(id);
  }

  /**
   * Assign manager to department
   * Accessible by: HR_Team only
   */
  @Put(':id/manager/:managerId')
  @Roles('hr_team')
  async assignManager(
    @Param('id') id: string,
    @Param('managerId') managerId: string,
    @Request() req: any,
  ) {
    return this.departmentService.assignManager(id, managerId, req.user?.id);
  }
}
