import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard, Roles } from '../../auth/guards/roles.guard';
import { PayrollService } from '../services/payroll.service';
import { LoanService } from '../services/loan.service';
import { ScheduleService } from '../services/schedule.service';

@Controller('payroll')
@UseGuards(JwtGuard)
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly loanService: LoanService,
    private readonly scheduleService: ScheduleService,
  ) {}

  // === Payroll Periods (HR only) ===

  @Get('periods')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async getPeriods(@Query('status') status?: string) {
    return { success: true, data: await this.payrollService.getPeriods(status) };
  }

  @Post('periods')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async createPeriod(@Body() dto: any) {
    return { success: true, data: await this.payrollService.createPeriod(dto) };
  }

  @Post('periods/:id/process')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async processPeriod(@Param('id') id: string, @Req() req: any) {
    return { success: true, data: await this.payrollService.processPeriod(id, req.user.sub) };
  }

  @Post('periods/:id/finalize')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async finalizePeriod(@Param('id') id: string) {
    return { success: true, data: await this.payrollService.finalizePeriod(id) };
  }

  // === Payslips ===

  @Get('payslips')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async getPayslips(@Query('period_id') periodId: string) {
    return { success: true, data: await this.payrollService.getPayslips(periodId) };
  }

  @Get('my-payslips')
  async getMyPayslips(@Req() req: any) {
    return { success: true, data: await this.payrollService.getEmployeePayslips(req.user.sub) };
  }

  @Get('payslips/:id')
  async getPayslipDetail(@Param('id') id: string) {
    return { success: true, data: await this.payrollService.getPayslipDetail(id) };
  }

  @Post('payslips/:id/items')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async addPayslipItem(@Param('id') id: string, @Body() dto: any) {
    return { success: true, data: await this.payrollService.addPayslipItem(id, dto) };
  }

  @Delete('payslip-items/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async removePayslipItem(@Param('id') id: string) {
    await this.payrollService.removePayslipItem(id);
    return { success: true };
  }

  // === Payroll Components ===

  @Get('components')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async getComponents() {
    return { success: true, data: await this.payrollService.getComponents() };
  }

  @Post('components')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async createComponent(@Body() dto: any) {
    return { success: true, data: await this.payrollService.createComponent(dto) };
  }

  @Put('components/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async updateComponent(@Param('id') id: string, @Body() dto: any) {
    return { success: true, data: await this.payrollService.updateComponent(id, dto) };
  }

  @Delete('components/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async deleteComponent(@Param('id') id: string) {
    return { success: true, data: await this.payrollService.deleteComponent(id) };
  }

  // === Loans / Kasbon ===

  @Get('loans')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async getLoans(@Query('status') status?: string, @Query('employee_id') empId?: string) {
    return { success: true, data: await this.loanService.getLoans({ status, employee_id: empId }) };
  }

  @Get('my-loans')
  async getMyLoans(@Req() req: any) {
    return { success: true, data: await this.loanService.getMyLoans(req.user.sub) };
  }

  @Post('loans/request')
  async requestLoan(@Req() req: any, @Body() dto: any) {
    return { success: true, data: await this.loanService.requestLoan({ ...dto, employee_id: req.user.sub }) };
  }

  @Post('loans/:id/approve')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async approveLoan(@Param('id') id: string, @Req() req: any) {
    return { success: true, data: await this.loanService.approveLoan(id, req.user.sub) };
  }

  @Post('loans/:id/reject')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async rejectLoan(@Param('id') id: string, @Body() dto: any) {
    return { success: true, data: await this.loanService.rejectLoan(id, dto.notes) };
  }

  @Post('loans/:id/repayment')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async recordRepayment(@Param('id') id: string, @Body() dto: any) {
    return { success: true, data: await this.loanService.recordRepayment(id, dto) };
  }

  // === Schedules ===

  @Get('schedules')
  async getSchedules() {
    return { success: true, data: await this.scheduleService.getSchedules() };
  }

  @Post('schedules')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async createSchedule(@Body() dto: any) {
    return { success: true, data: await this.scheduleService.createSchedule(dto) };
  }

  @Put('schedules/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async updateSchedule(@Param('id') id: string, @Body() dto: any) {
    return { success: true, data: await this.scheduleService.updateSchedule(id, dto) };
  }

  @Delete('schedules/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async deleteSchedule(@Param('id') id: string) {
    return { success: true, data: await this.scheduleService.deleteSchedule(id) };
  }

  @Post('schedules/assign')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async assignSchedule(@Body() dto: any) {
    return { success: true, data: await this.scheduleService.assignSchedule(dto) };
  }

  @Get('my-schedule')
  async getMySchedule(@Req() req: any) {
    return { success: true, data: await this.scheduleService.getEmployeeSchedule(req.user.sub) };
  }

  // === Absences ===

  @Get('absences')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin', 'Supervisor')
  async getAbsences(@Query() query: any) {
    return { success: true, data: await this.scheduleService.getAbsences(query) };
  }

  @Post('absences')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async recordAbsence(@Body() dto: any, @Req() req: any) {
    return { success: true, data: await this.scheduleService.recordAbsence({ ...dto, reported_by: req.user.sub }) };
  }

  @Put('absences/:id/resolve')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async resolveAbsence(@Param('id') id: string, @Body() dto: any) {
    return { success: true, data: await this.scheduleService.resolveAbsence(id, dto.resolution_note) };
  }

  // === Company Holidays ===

  @Get('company-holidays')
  async getCompanyHolidays() {
    return { success: true, data: await this.scheduleService.getCompanyHolidays() };
  }

  @Post('company-holidays')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async createCompanyHoliday(@Body() dto: any) {
    return { success: true, data: await this.scheduleService.createCompanyHoliday(dto) };
  }

  @Delete('company-holidays/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'HR_Admin')
  async deleteCompanyHoliday(@Param('id') id: string) {
    await this.scheduleService.deleteCompanyHoliday(id);
    return { success: true };
  }
}
