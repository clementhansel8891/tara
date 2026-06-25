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
  Query,
} from '@nestjs/common';
import { SupervisorService } from '../supervisor.service';
import { AssignSupervisorDto, BulkAssignSupervisorDto } from '../dto/assign-supervisor.dto';
import { TaraJwtAuthGuard } from '../../auth/guards/tara-jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

/**
 * Supervisor Controller
 * Manages supervisor assignment and organizational hierarchy
 * 
 * Requirements:
 * - 20.5: Supervisor assignment logic
 * - 12.5: Role-based access control
 */
@Controller('supervisors')
@UseGuards(TaraJwtAuthGuard, RolesGuard)
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  /**
   * Assign supervisor to employee
   * Accessible by: HR_Team only
   */
  @Put('assign/:employeeId')
  @Roles('hr_team')
  async assignSupervisor(
    @Param('employeeId') employeeId: string,
    @Body() data: AssignSupervisorDto,
    @Request() req: any,
  ) {
    return this.supervisorService.assignSupervisor(
      employeeId,
      data.supervisor_id,
      req.user?.id,
    );
  }

  /**
   * Remove supervisor from employee
   * Accessible by: HR_Team only
   */
  @Delete('remove/:employeeId')
  @Roles('hr_team')
  async removeSupervisor(@Param('employeeId') employeeId: string, @Request() req: any) {
    return this.supervisorService.removeSupervisor(employeeId, req.user?.id);
  }

  /**
   * Get all subordinates of a supervisor
   * Accessible by: HR_Team, Supervisor (own subordinates)
   */
  @Get(':supervisorId/subordinates')
  @Roles('hr_team', 'supervisor')
  async getSubordinates(@Param('supervisorId') supervisorId: string, @Request() req: any) {
    // Supervisors can only view their own subordinates
    if (req.user?.role === 'supervisor' && req.user?.id !== supervisorId) {
      throw new Error('Supervisors can only view their own subordinates');
    }
    return this.supervisorService.getSubordinates(supervisorId);
  }

  /**
   * Get organizational hierarchy for a supervisor
   * Accessible by: HR_Team, Supervisor (own hierarchy)
   */
  @Get(':supervisorId/hierarchy')
  @Roles('hr_team', 'supervisor')
  async getOrganizationalHierarchy(
    @Param('supervisorId') supervisorId: string,
    @Query('maxDepth') maxDepth: string,
    @Request() req: any,
  ) {
    // Supervisors can only view their own hierarchy
    if (req.user?.role === 'supervisor' && req.user?.id !== supervisorId) {
      throw new Error('Supervisors can only view their own hierarchy');
    }
    const depth = maxDepth ? parseInt(maxDepth, 10) : 5;
    return this.supervisorService.getOrganizationalHierarchy(supervisorId, depth);
  }

  /**
   * Get reporting chain for an employee
   * Accessible by: HR_Team, Supervisor, Employee (own chain)
   */
  @Get('reporting-chain/:employeeId')
  @Roles('hr_team', 'supervisor', 'employee')
  async getReportingChain(@Param('employeeId') employeeId: string, @Request() req: any) {
    // Employees can only view their own reporting chain
    if (req.user?.role === 'employee' && req.user?.id !== employeeId) {
      throw new Error('Employees can only view their own reporting chain');
    }
    return this.supervisorService.getReportingChain(employeeId);
  }

  /**
   * Bulk assign supervisor to multiple employees
   * Accessible by: HR_Team only
   */
  @Post('bulk-assign')
  @Roles('hr_team')
  async bulkAssignSupervisor(@Body() data: BulkAssignSupervisorDto, @Request() req: any) {
    return this.supervisorService.bulkAssignSupervisor(
      data.employee_ids,
      data.supervisor_id,
      req.user?.id,
    );
  }
}
