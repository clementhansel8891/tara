import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../persistence/prisma.service";
import { IHRRepository } from "./repositories/hr.repository.interface";
import { AuditService } from "../../shared/audit/audit.service";
import { NotificationService } from "../../shared/comms/notification.service";
import { 
  LeaveRequest 
} from "./entities/hr.entity";
import { Prisma } from "@prisma/client";
import { CreateLeaveRequestDto } from "./dto";
import {
  BadRequestException,
  NotFoundException,
} from "./utils/hr-prisma.errors";

@Injectable()
export class HrLeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hrRepository: IHRRepository,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async getLeaveRequests(tenant_id: string, location_id?: string, status?: string, employee_id?: string): Promise<LeaveRequest[]> {
    return this.hrRepository.getLeaveRequests(tenant_id, location_id, status, employee_id);
  }

  async getGlobalLeaveRequests(status?: string, employee_id?: string): Promise<LeaveRequest[]> {
    return this.hrRepository.getGlobalLeaveRequests(status, employee_id);
  }

  async createLeaveRequest(tenant_id: string, data: CreateLeaveRequestDto, user_id?: string): Promise<LeaveRequest> {
    const event_reference_id = `EVT-HR-LEAVE-REQ-${Date.now()}`;
    return this.prisma.$transaction(async (tx: any) => {
      const leaveRequest = await this.hrRepository.createLeaveRequest(tenant_id, data, tx);
      await this.auditService.log({
        tenant_id, user_id: user_id || "SYSTEM", module: "HR", action: "CREATE_LEAVE_REQUEST", entity_type: "LEAVE_REQUEST", entity_id: leaveRequest.id, after_state: leaveRequest, event_reference_id, metadata: { total_days: data.total_days },
      }, tx);
      return leaveRequest;
    });
  }

  async approveLeaveRequest(tenant_id: string, request_id: string, reviewerId: string, notes?: string, user_id?: string): Promise<LeaveRequest> {
    // Lifecycle guard (Requirement 9.4): only a `pending` request may transition.
    // Load it tenant-scoped first so a missing/cross-tenant id is a 404 and a
    // non-pending request is a 400 — before any write is attempted.
    await this.assertPending(tenant_id, request_id);

    const event_reference_id = `EVT-HR-LEAVE-APP-${Date.now()}`;
    return this.prisma.$transaction(async (tx: any) => {
      const leaveRequest = await this.hrRepository.approveLeaveRequest(tenant_id, request_id, reviewerId, notes, tx);
      await this.auditService.log({
        tenant_id, user_id: user_id || "SYSTEM", module: "HR", action: "APPROVE_LEAVE_REQUEST", entity_type: "LEAVE_REQUEST", entity_id: request_id, after_state: leaveRequest, event_reference_id,
      }, tx);
      return leaveRequest;
    });
  }

  async rejectLeaveRequest(tenant_id: string, request_id: string, reviewerId: string, notes: string, user_id?: string): Promise<LeaveRequest> {
    // Lifecycle guard (Requirement 9.4): reject is only valid from `pending`.
    await this.assertPending(tenant_id, request_id);

    const event_reference_id = `EVT-HR-LEAVE-REJ-${Date.now()}`;
    return this.prisma.$transaction(async (tx: any) => {
      const leaveRequest = await this.hrRepository.rejectLeaveRequest(tenant_id, request_id, reviewerId, notes, tx);
      await this.auditService.log({
        tenant_id, user_id: user_id || "SYSTEM", module: "HR", action: "REJECT_LEAVE_REQUEST", entity_type: "LEAVE_REQUEST", entity_id: request_id, after_state: leaveRequest, event_reference_id,
      }, tx);
      return leaveRequest;
    });
  }

  /**
   * Loads a leave request within the caller's tenant scope and asserts it is in
   * the `pending` state, the only state from which approve/reject is valid
   * (Requirements 9.2, 9.3, 9.4). A missing or cross-tenant request is a 404; a
   * request in any non-pending state is a 400. The repository read mapper
   * normalises the legacy stored literal `requested` to `pending`, so both the
   * canonical and legacy initial states are accepted here.
   */
  private async assertPending(tenant_id: string, request_id: string): Promise<LeaveRequest> {
    const existing = await this.hrRepository.getLeaveRequestById(tenant_id, request_id);
    if (!existing) {
      throw new NotFoundException(`Leave request '${request_id}' not found.`);
    }
    if (existing.status !== "pending") {
      throw new BadRequestException(
        `Leave request '${request_id}' is '${existing.status}', not 'pending'; only a pending request can be approved or rejected.`,
      );
    }
    return existing;
  }
}
