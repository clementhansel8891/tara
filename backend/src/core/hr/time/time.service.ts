import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../shared/events/event-bus.service';
import { EVENT_NAMES } from '../events/event-names';
import { IHRRepository } from '../repositories/hr.repository.interface';
import { LeaveRequest } from '../entities/leave-request.entity';
import { Attendance } from '../entities/attendance.entity';
import { LeaveType } from '../dto/create-leave-request.dto';

@Injectable()
export class TimeAndAttendanceService {
  private readonly logger = new Logger(TimeAndAttendanceService.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly hrRepository: IHRRepository,
  ) {}

  // ──────────────────────────────────────────────
  // LEAVE MANAGEMENT
  // ──────────────────────────────────────────────

  async requestLeave(tenantId: string, employeeId: string, dto: { type: string, startDate: Date, endDate: Date, reason?: string, totalDays?: number }): Promise<LeaveRequest> {
    this.logger.log(`Leave requested by employee ${employeeId}`);
    
    const request = await this.hrRepository.createLeaveRequest(tenantId, {
      employeeId,
      leaveType: dto.type as LeaveType,
      startDate: dto.startDate.toISOString(),
      endDate: dto.endDate.toISOString(),
      reason: dto.reason || 'No reason provided',
      totalDays: dto.totalDays || 1,
    });

    await this.eventBus.publish({
      eventType: EVENT_NAMES.LEAVE_REQUESTED,
      tenantId,
      entityId: employeeId,
      payload: { leaveId: request.id, leaveType: request.leaveType, startDate: request.startDate, endDate: request.endDate },
    } as any);

    return request;
  }

  async approveLeave(tenantId: string, leaveId: string, approverId: string, notes?: string): Promise<void> {
    this.logger.log(`Leave ${leaveId} approved by ${approverId}`);
    
    await this.hrRepository.approveLeaveRequest(tenantId, leaveId, approverId, notes);

    await this.eventBus.publish({
      eventType: EVENT_NAMES.LEAVE_APPROVED,
      tenantId,
      entityId: leaveId,
      payload: { approverId },
    } as any);
  }

  // ──────────────────────────────────────────────
  // ATTENDANCE TRACKING
  // ──────────────────────────────────────────────

  async clockIn(tenantId: string, employeeId: string, locationId: string): Promise<Attendance> {
    this.logger.log(`Employee ${employeeId} clocked in`);

    const record = await this.hrRepository.clockIn(tenantId, employeeId, locationId);

    await this.eventBus.publish({
      eventType: EVENT_NAMES.CLOCK_IN,
      tenantId,
      entityId: employeeId,
      payload: { recordId: record.id, clockInTime: record.clockIn },
    } as any);

    return record;
  }

  async clockOut(tenantId: string, employeeId: string): Promise<void> {
    this.logger.log(`Employee ${employeeId} clocked out`);
    
    await this.hrRepository.clockOut(tenantId, employeeId);

    await this.eventBus.publish({
      eventType: EVENT_NAMES.CLOCK_OUT,
      tenantId,
      entityId: employeeId,
      payload: { clockOutTime: new Date() },
    } as any);
  }

  // ──────────────────────────────────────────────
  // SHIFT MANAGEMENT
  // ──────────────────────────────────────────────

  async assignShift(tenantId: string, employeeId: string, shiftId: string, locationId: string, date: string): Promise<void> {
    this.logger.log(`Assigning shift ${shiftId} to employee ${employeeId} at ${locationId} for date ${date}`);
    
    await this.hrRepository.assignShift(tenantId, employeeId, shiftId, locationId, date);

    await this.eventBus.publish({
      eventType: EVENT_NAMES.SHIFT_ASSIGNED,
      tenantId,
      entityId: employeeId,
      payload: { shiftId, locationId, date },
    } as any);
  }
}
