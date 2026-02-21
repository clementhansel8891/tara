import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { HRService } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ClockInDto } from './dto/clock-in.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { CreatePerformanceCycleDto } from './dto/create-performance-cycle.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { CreateCaseDto } from './dto/create-case.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { TenantInterceptor } from '../../gateway/tenant.interceptor';
import { TenantContext } from '../../gateway/tenant-context.interface';

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

/**
 * HR Controller
 * REST API endpoints for HR operations
 * All endpoints require x-tenant-id header
 */
@Controller('hr')
@UseInterceptors(TenantInterceptor)
export class HRController {
  constructor(private readonly hrService: HRService) {}

  // ==================== Employee Management ====================

  /**
   * GET /hr/employees
   * List all employees for the tenant
   */
  @Get('employees')
  async getEmployees(
    @Req() request: RequestWithTenant,
    @Query('locationId') locationId?: string,
  ) {
    const { tenantId, role } = request.tenantContext;
    
    const employees = role === 'SUPERADMIN'
      ? await this.hrService.getGlobalEmployees(locationId)
      : await this.hrService.getEmployees(tenantId, locationId);

    return {
      success: true,
      tenantId,
      locationId: locationId || 'all',
      count: employees.length,
      data: employees,
    };
  }

  /**
   * GET /hr/employees/:id
   * Get a specific employee
   */
  @Get('employees/:id')
  async getEmployee(@Req() request: RequestWithTenant, @Param('id') employeeId: string) {
    const { tenantId, role } = request.tenantContext;
    
    let employee;
    if (role === 'SUPERADMIN') {
       employee = await this.hrService.getGlobalEmployeeById(employeeId);
    } else {
       employee = await this.hrService.getEmployeeById(tenantId, employeeId);
    }

    if (!employee) {
      return {
        success: false,
        tenantId,
        message: 'Employee not found',
        data: null,
      };
    }

    return {
      success: true,
      tenantId,
      data: employee,
    };
  }

  /**
   * POST /hr/employees
   * Create a new employee
   */
  @Post('employees')
  async createEmployee(
    @Req() request: RequestWithTenant,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    const { tenantId, locationId } = request.tenantContext;

    // Use context locationId if not provided in DTO
    if (locationId && !createEmployeeDto.locationId) {
      createEmployeeDto.locationId = locationId;
    }

    const employee = await this.hrService.createEmployee(tenantId, createEmployeeDto);

    return {
      success: true,
      tenantId,
      message: 'Employee created successfully',
      data: employee,
    };
  }

  /**
   * PUT /hr/employees/:id
   * Update an employee
   */
  @Put('employees/:id')
  async updateEmployee(
    @Req() request: RequestWithTenant,
    @Param('id') employeeId: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const { tenantId } = request.tenantContext;
    const employee = await this.hrService.updateEmployee(tenantId, employeeId, updateEmployeeDto);

    return {
      success: true,
      tenantId,
      message: 'Employee updated successfully',
      data: employee,
    };
  }

  /**
   * DELETE /hr/employees/:id
   * Deactivate an employee (soft delete)
   */
  @Delete('employees/:id')
  async deactivateEmployee(@Req() request: RequestWithTenant, @Param('id') employeeId: string) {
    const { tenantId } = request.tenantContext;
    const employee = await this.hrService.deactivateEmployee(tenantId, employeeId);

    return {
      success: true,
      tenantId,
      message: 'Employee deactivated successfully',
      data: employee,
    };
  }

  // ==================== Attendance Management ====================

  /**
   * GET /hr/attendance
   * Get attendance records
   */
  @Get('attendance')
  async getAttendance(
    @Req() request: RequestWithTenant,
    @Query('employeeId') employeeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { tenantId, role } = request.tenantContext;
    
    const attendance = role === 'SUPERADMIN'
      ? await this.hrService.getGlobalAttendance(employeeId, startDate, endDate)
      : await this.hrService.getAttendance(tenantId, employeeId, startDate, endDate);

    return {
      success: true,
      tenantId,
      employeeId: employeeId || 'all',
      count: attendance.length,
      data: attendance,
    };
  }

  /**
   * POST /hr/attendance/clock-in
   * Clock in an employee
   */
  @Post('attendance/clock-in')
  async clockIn(@Req() request: RequestWithTenant, @Body() clockInDto: ClockInDto) {
    const { tenantId, locationId } = request.tenantContext;
    const effectiveLocationId = clockInDto.locationId || locationId || 'default';

    const attendance = await this.hrService.clockIn(
      tenantId,
      clockInDto.employeeId,
      effectiveLocationId,
    );

    return {
      success: true,
      tenantId,
      message: 'Clocked in successfully',
      data: attendance,
    };
  }

  /**
   * POST /hr/attendance/clock-out
   * Clock out an employee
   */
  @Post('attendance/clock-out')
  async clockOut(@Req() request: RequestWithTenant, @Body() body: { employeeId: string }) {
    const { tenantId } = request.tenantContext;
    const attendance = await this.hrService.clockOut(tenantId, body.employeeId);

    return {
      success: true,
      tenantId,
      message: 'Clocked out successfully',
      data: attendance,
    };
  }

  // ==================== Leave Management ====================

  /**
   * GET /hr/leave-requests
   * Get leave requests
   */
  @Get('leave-requests')
  async getLeaveRequests(
    @Req() request: RequestWithTenant,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const { tenantId, role } = request.tenantContext;
    
    const requests = role === 'SUPERADMIN'
      ? await this.hrService.getGlobalLeaveRequests(status, employeeId)
      : await this.hrService.getLeaveRequests(tenantId, status, employeeId);

    return {
      success: true,
      tenantId,
      count: requests.length,
      data: requests,
    };
  }

  /**
   * POST /hr/leave-requests
   * Create a leave request
   */
  @Post('leave-requests')
  async createLeaveRequest(
    @Req() request: RequestWithTenant,
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
  ) {
    const { tenantId } = request.tenantContext;
    const leaveRequest = await this.hrService.createLeaveRequest(tenantId, createLeaveRequestDto);

    return {
      success: true,
      tenantId,
      message: 'Leave request created successfully',
      data: leaveRequest,
    };
  }

  /**
   * PUT /hr/leave-requests/:id/approve
   * Approve a leave request
   */
  @Put('leave-requests/:id/approve')
  async approveLeaveRequest(
    @Req() request: RequestWithTenant,
    @Param('id') requestId: string,
    @Body() body: { reviewerId: string; notes?: string },
  ) {
    const { tenantId } = request.tenantContext;
    const leaveRequest = await this.hrService.approveLeaveRequest(
      tenantId,
      requestId,
      body.reviewerId,
      body.notes,
    );

    return {
      success: true,
      tenantId,
      message: 'Leave request approved',
      data: leaveRequest,
    };
  }

  /**
   * PUT /hr/leave-requests/:id/reject
   * Reject a leave request
   */
  @Put('leave-requests/:id/reject')
  async rejectLeaveRequest(
    @Req() request: RequestWithTenant,
    @Param('id') requestId: string,
    @Body() body: { reviewerId: string; notes: string },
  ) {
    const { tenantId } = request.tenantContext;
    const leaveRequest = await this.hrService.rejectLeaveRequest(
      tenantId,
      requestId,
      body.reviewerId,
      body.notes,
    );

    return {
      success: true,
      tenantId,
      message: 'Leave request rejected',
      data: leaveRequest,
    };
  }

  // ==================== Payroll Management ====================

  /**
   * GET /hr/payroll/:employeeId
   * Get payroll records for an employee
   */
  @Get('payroll/:employeeId')
  async getPayroll(
    @Req() request: RequestWithTenant,
    @Param('employeeId') employeeId: string,
    @Query('period') period?: string,
  ) {
    const { tenantId, role } = request.tenantContext;
    
    const payrolls = role === 'SUPERADMIN'
      ? await this.hrService.getGlobalPayroll(employeeId, period)
      : await this.hrService.getPayroll(tenantId, employeeId, period);

    return {
      success: true,
      tenantId,
      employeeId,
      count: payrolls.length,
      data: payrolls,
    };
  }

  /**
   * POST /hr/payroll/:employeeId/calculate
   * Calculate payroll for an employee
   */
  @Post('payroll/:employeeId/calculate')
  async calculatePayroll(
    @Req() request: RequestWithTenant,
    @Param('employeeId') employeeId: string,
    @Body() body: { period: string },
  ) {
    const { tenantId } = request.tenantContext;
    const payroll = await this.hrService.calculatePayroll(tenantId, employeeId, body.period);

    return {
      success: true,
      tenantId,
      message: 'Payroll calculated successfully',
      data: payroll,
    };
  }

  // ==================== Organization Management ====================

  @Get('departments')
  async getDepartments(@Req() request: RequestWithTenant) {
    const { tenantId, role } = request.tenantContext;
    
    const departments = role === 'SUPERADMIN'
      ? await this.hrService.getGlobalDepartments()
      : await this.hrService.getDepartments(tenantId);
      
    return { success: true, tenantId, data: departments };
  }

  @Post('departments')
  async createDepartment(@Req() request: RequestWithTenant, @Body() dto: CreateDepartmentDto) {
    const { tenantId } = request.tenantContext;
    const department = await this.hrService.createDepartment(tenantId, dto);
    return { success: true, tenantId, data: department };
  }

  // ==================== Recruitment Management ====================

  @Get('requisitions')
  async getRequisitions(@Req() request: RequestWithTenant, @Query('status') status?: string) {
    const { tenantId, role } = request.tenantContext;
    
    const requisitions = role === 'SUPERADMIN'
      ? await this.hrService.getGlobalRequisitions(status)
      : await this.hrService.getRequisitions(tenantId, status);
      
    return { success: true, tenantId, data: requisitions };
  }

  @Post('requisitions')
  async createRequisition(@Req() request: RequestWithTenant, @Body() dto: CreateRequisitionDto) {
    const { tenantId } = request.tenantContext;
    const requisition = await this.hrService.createRequisition(tenantId, dto);
    return { success: true, tenantId, data: requisition };
  }

  @Patch('requisitions/:id')
  async updateRequisition(
    @Req() request: RequestWithTenant,
    @Param('id') id: string,
    @Body() body: any
  ) {
    const { tenantId } = request.tenantContext;
    const requisition = await this.hrService.updateRequisition(tenantId, id, body);
    return { success: true, tenantId, data: requisition };
  }

  // ==================== Performance Management ====================

  @Get('performance/cycles')
  async getPerformanceCycles(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const cycles = await this.hrService.getPerformanceCycles(tenantId);
    return { success: true, tenantId, data: cycles };
  }

  @Post('performance/cycles')
  async createPerformanceCycle(@Req() request: RequestWithTenant, @Body() dto: CreatePerformanceCycleDto) {
    const { tenantId } = request.tenantContext;
    const cycle = await this.hrService.createPerformanceCycle(tenantId, dto);
    return { success: true, tenantId, data: cycle };
  }

  @Get('performance/reviews')
  async getPerformanceReviews(
    @Req() request: RequestWithTenant,
    @Query('cycleId') cycleId?: string,
    @Query('employeeId') employeeId?: string
  ) {
    const { tenantId, role } = request.tenantContext;
    
    const reviews = role === 'SUPERADMIN'
      ? await this.hrService.getGlobalPerformanceReviews(cycleId, employeeId)
      : await this.hrService.getPerformanceReviews(tenantId, cycleId, employeeId);
      
    return { success: true, tenantId, data: reviews };
  }

  @Post('performance/reviews')
  async submitPerformanceReview(@Req() request: RequestWithTenant, @Body() dto: SubmitReviewDto) {
    const { tenantId } = request.tenantContext;
    const review = await this.hrService.submitPerformanceReview(tenantId, dto);
    return { success: true, tenantId, data: review };
  }

  // ==================== Case Management ====================

  @Get('cases')
  async getCases(@Req() request: RequestWithTenant, @Query('status') status?: string) {
    const { tenantId } = request.tenantContext;
    const cases = await this.hrService.getCases(tenantId, status);
    return { success: true, tenantId, data: cases };
  }

  @Get('cases/:id')
  async getCase(@Req() request: RequestWithTenant, @Param('id') id: string) {
    const { tenantId } = request.tenantContext;
    const hrCase = await this.hrService.getCaseById(tenantId, id);
    return { success: true, tenantId, data: hrCase };
  }

  @Post('cases')
  async createCase(@Req() request: RequestWithTenant, @Body() dto: CreateCaseDto) {
    const { tenantId } = request.tenantContext;
    const hrCase = await this.hrService.createCase(tenantId, dto);
    return { success: true, tenantId, data: hrCase };
  }

  @Patch('cases/:id')
  async updateCase(
    @Req() request: RequestWithTenant,
    @Param('id') id: string,
    @Body() body: any
  ) {
    const { tenantId } = request.tenantContext;
    const hrCase = await this.hrService.updateCase(tenantId, id, body);
    return { success: true, tenantId, data: hrCase };
  }

  // ==================== Contract Management ====================

  @Get('contracts')
  async getContracts(@Req() request: RequestWithTenant, @Query('employeeId') employeeId?: string) {
    const { tenantId, role } = request.tenantContext;
    
    const contracts = role === 'SUPERADMIN'
      ? await this.hrService.getGlobalContracts(employeeId)
      : await this.hrService.getContracts(tenantId, employeeId);
      
    return { success: true, tenantId, data: contracts };
  }

  @Post('contracts')
  async createContract(@Req() request: RequestWithTenant, @Body() dto: CreateContractDto) {
    const { tenantId } = request.tenantContext;
    const contract = await this.hrService.createContract(tenantId, dto);
    return { success: true, tenantId, data: contract };
  }

  @Patch('contracts/:id')
  async updateContract(
    @Req() request: RequestWithTenant,
    @Param('id') id: string,
    @Body() body: any
  ) {
    const { tenantId } = request.tenantContext;
    const contract = await this.hrService.updateContract(tenantId, id, body);
    return { success: true, tenantId, data: contract };
  }
}
