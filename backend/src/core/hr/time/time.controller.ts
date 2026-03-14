import { Controller, Post, Body, Headers, Param } from '@nestjs/common';
import { TimeAndAttendanceService } from './time.service';

@Controller('api/hr/time')
export class TimeAndAttendanceController {
  constructor(private readonly timeService: TimeAndAttendanceService) {}

  @Post('leave/request')
  async requestLeave(
    @Headers('x-tenant-id') tenantId: string,
    @Body('employeeId') employeeId: string,
    @Body() dto: { type: string, startDate: Date, endDate: Date, reason?: string }
  ) {
    const result = await this.timeService.requestLeave(tenantId, employeeId, dto);
    return { success: true, data: result };
  }

  @Post('leave/:id/approve')
  async approveLeave(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') leaveId: string,
    @Body('approverId') approverId: string,
  ) {
    await this.timeService.approveLeave(tenantId, leaveId, approverId);
    return { success: true, message: 'Leave approved' };
  }

  @Post('clock-in')
  async clockIn(
    @Headers('x-tenant-id') tenantId: string,
    @Body('employeeId') employeeId: string,
    @Body('locationId') locationId: string,
  ) {
    const result = await this.timeService.clockIn(tenantId, employeeId, locationId);
    return { success: true, data: result };
  }

  @Post('clock-out')
  async clockOut(
    @Headers('x-tenant-id') tenantId: string,
    @Body('employeeId') employeeId: string,
  ) {
    await this.timeService.clockOut(tenantId, employeeId);
    return { success: true, message: 'Clocked out successfully' };
  }

  @Post('shift/assign')
  async assignShift(
    @Headers('x-tenant-id') tenantId: string,
    @Body('employeeId') employeeId: string,
    @Body('shiftId') shiftId: string,
    @Body('locationId') locationId: string,
    @Body('date') date: string,
  ) {
    await this.timeService.assignShift(tenantId, employeeId, shiftId, locationId, date);
    return { success: true, message: 'Shift assigned' };
  }
}
