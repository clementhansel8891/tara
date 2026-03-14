import { Injectable } from "@nestjs/common";
import { IHRRepository } from "./repositories/hr.repository.interface";
import { Employee } from "./entities/employee.entity";
import { Attendance } from "./entities/attendance.entity";
import { LeaveRequest } from "./entities/leave-request.entity";
import { Payroll } from "./entities/payroll.entity";
import { Department } from "./entities/department.entity";
import { JobRequisition } from "./entities/requisition.entity";
import { PerformanceCycle } from "./entities/performance-cycle.entity";
import { PerformanceReview } from "./entities/performance-review.entity";
import { HRCase } from "./entities/hr-case.entity";
import { Contract } from "./entities/contract.entity";
import { Candidate } from "./entities/candidate.entity";
import { Position } from "./entities/position.entity";
import { Compensation } from "./entities/compensation.entity";
import { Interview } from "./entities/interview.entity";
import { TalentLead } from "./entities/talent-lead.entity";
import { IngestTalentLeadDto } from "./dto/ingest-talent-lead.dto";

import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { CreateRequisitionDto } from "./dto/create-requisition.dto";
import { CreatePerformanceCycleDto } from "./dto/create-performance-cycle.dto";
import { SubmitReviewDto } from "./dto/submit-review.dto";
import { CreateCaseDto } from "./dto/create-case.dto";
import { CreateContractDto } from "./dto/create-contract.dto";

import { FileProcessingService } from "../../shared/file-processing/file-processing.service";
import { AuditService } from "../../shared/audit/audit.service";
import { LoggerService } from "../../shared/logger/logger.service";
import { EventBusService } from "../../shared/events/event-bus.service";

/**
 * HR Service
 * Business logic layer for HR operations
 *
 * CRITICAL: All methods require tenantId as the first argument
 */
@Injectable()
export class HRService {
  constructor(
    private readonly hrRepository: IHRRepository,
    private readonly fileProcessingService: FileProcessingService,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
    private readonly eventBus: EventBusService,
  ) {}

  // Employee Management
  async getEmployees(
    tenantId: string,
    locationId?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Employee[]; total: number }> {
    return this.hrRepository.getEmployees(tenantId, locationId, page, limit);
  }

  async getGlobalEmployees(
    locationId?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Employee[]; total: number }> {
    return this.hrRepository.getGlobalEmployees(locationId, page, limit);
  }

  async getEmployeeById(
    tenantId: string,
    employeeId: string,
  ): Promise<Employee | null> {
    return this.hrRepository.getEmployeeById(tenantId, employeeId);
  }

  async getGlobalEmployeeById(employeeId: string): Promise<Employee | null> {
    return this.hrRepository.getGlobalEmployeeById(employeeId);
  }

  async createEmployee(
    tenantId: string,
    data: CreateEmployeeDto,
    userId?: string,
  ): Promise<Employee> {
    const employee = await this.hrRepository.createEmployee(tenantId, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "CREATE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        afterState: employee,
        metadata: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          role: employee.roleTitle,
        },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "EMPLOYEE_CREATED",
      message: `Employee created: ${employee.firstName} ${employee.lastName}`,
      payload: { employeeId: employee.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.EMPLOYEE_CREATED",
      tenantId,
      entityId: employee.id,
      entityType: "EMPLOYEE",
      sourceModule: "HR",
      userId,
      payload: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        departmentId: employee.departmentId,
      },
    });

    return employee;
  }

  async updateEmployee(
    tenantId: string,
    employeeId: string,
    data: UpdateEmployeeDto,
    userId?: string,
  ): Promise<Employee> {
    // Fetch before state for high-fidelity audit
    const beforeState = await this.hrRepository.getEmployeeById(tenantId, employeeId);
    
    const employee = await this.hrRepository.updateEmployee(
      tenantId,
      employeeId,
      data,
    );

    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "UPDATE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        beforeState,
        afterState: employee,
        metadata: { updates: data },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "EMPLOYEE_UPDATED",
      message: `Employee updated: ${employee.id}`,
      payload: { employeeId: employee.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.EMPLOYEE_UPDATED",
      tenantId,
      entityId: employee.id,
      entityType: "EMPLOYEE",
      sourceModule: "HR",
      userId,
      payload: { updates: data },
    });

    return employee;
  }

  async deactivateEmployee(
    tenantId: string,
    employeeId: string,
    userId?: string,
  ): Promise<Employee> {
    const beforeState = await this.hrRepository.getEmployeeById(tenantId, employeeId);
    
    const employee = await this.hrRepository.deactivateEmployee(
      tenantId,
      employeeId,
    );

    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "DEACTIVATE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        beforeState,
        afterState: employee,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "EMPLOYEE_DEACTIVATED",
      message: `Employee deactivated: ${employee.firstName} ${employee.lastName}`,
      payload: { employeeId: employee.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.EMPLOYEE_DEACTIVATED",
      tenantId,
      entityId: employee.id,
      entityType: "EMPLOYEE",
      sourceModule: "HR",
      userId,
      payload: { 
        reason: "Deactivated",
        fullName: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        departmentId: employee.departmentId
      },
    });

    return employee;
  }

  async promoteEmployee(
    tenantId: string,
    employeeId: string,
    data: any,
    userId?: string,
  ): Promise<Employee> {
    const beforeState = await this.hrRepository.getEmployeeById(tenantId, employeeId);
    const employee = await this.hrRepository.promoteEmployee(tenantId, employeeId, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "PROMOTE",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        beforeState,
        afterState: employee,
        metadata: data,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "EMPLOYEE_PROMOTED",
      message: `Employee promoted: ${employee.id}`,
      payload: { employeeId: employee.id, newRole: data.newRole },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.EMPLOYEE_PROMOTED",
      tenantId,
      entityId: employeeId,
      entityType: "EMPLOYEE",
      sourceModule: "HR",
      userId,
      payload: { ...data, employeeId },
    });

    return employee;
  }

  async transferEmployee(
    tenantId: string,
    employeeId: string,
    data: any,
    userId?: string,
  ): Promise<Employee> {
    const beforeState = await this.hrRepository.getEmployeeById(tenantId, employeeId);
    const employee = await this.hrRepository.transferEmployee(tenantId, employeeId, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "TRANSFER",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        beforeState,
        afterState: employee,
        metadata: data,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "EMPLOYEE_TRANSFERRED",
      message: `Employee transferred: ${employee.id} to ${data.targetLocation || data.targetDepartment}`,
      payload: { employeeId: employee.id, transferData: data },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.EMPLOYEE_TRANSFERRED",
      tenantId,
      entityId: employeeId,
      entityType: "EMPLOYEE",
      sourceModule: "HR",
      userId,
      payload: { ...data, employeeId },
    });

    return employee;
  }

  async suspendEmployee(
    tenantId: string,
    employeeId: string,
    reason: string,
    userId?: string,
  ): Promise<Employee> {
    const beforeState = await this.hrRepository.getEmployeeById(tenantId, employeeId);
    const employee = await this.hrRepository.suspendEmployee(tenantId, employeeId, reason);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "SUSPEND",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        beforeState,
        afterState: employee,
        metadata: { reason },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "WARN",
      event: "EMPLOYEE_SUSPENDED",
      message: `Employee suspended: ${employee.id} - Reason: ${reason}`,
      payload: { employeeId: employee.id, reason },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.EMPLOYEE_SUSPENDED",
      tenantId,
      entityId: employeeId,
      entityType: "EMPLOYEE",
      sourceModule: "HR",
      userId,
      payload: { 
        reason,
        fullName: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        departmentId: employee.departmentId
      },
    });

    return employee;
  }

  /**
   * Bulk import employees from file (CSV/Excel)
   */
  async importEmployees(
    tenantId: string,
    buffer: Buffer,
    fileType: "csv" | "xlsx",
    userId: string,
  ): Promise<{ imported: number; errors: any[] }> {
    const { data, errors } =
      fileType === "csv"
        ? await this.fileProcessingService.parseCsv(buffer, CreateEmployeeDto)
        : await this.fileProcessingService.parseExcel(
            buffer,
            CreateEmployeeDto,
          );

    if (errors.length > 0) {
      return { imported: 0, errors };
    }

    let importedCount = 0;
    for (const employeeData of data) {
      // Ensure tenantId is set for creation if repo doesn't handle it automagically
      await this.createEmployee(tenantId, employeeData, userId);
      importedCount++;
    }

    await this.auditService.log({
      tenantId,
      userId,
      module: "hr",
      action: "IMPORT",
      entityType: "EMPLOYEE",
      entityId: "bulk-import",
      metadata: { count: importedCount, fileType },
    });

    return { imported: importedCount, errors: [] };
  }

  /**
   * Export Employee list to Excel
   */
  async exportEmployees(tenantId: string, userId: string): Promise<Buffer> {
    const employees = await this.getEmployees(tenantId);

    const columns = [
      { header: "Employee ID", key: "id", width: 15 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Role", key: "role", width: 15 },
      { header: "Department", key: "department", width: 20 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Joined Date", key: "joinedAt", width: 20 },
      { header: "Status", key: "status", width: 10 },
    ];

    return this.fileProcessingService.generateExcel(employees.data, columns, {
      traceId: `HR-${tenantId}-${userId}-${Date.now()}`,
      watermark: { text: "ZENVIX CONFIDENTIAL" },
    });
  }

  // Attendance Management
  async getAttendance(
    tenantId: string,
    locationId?: string,
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: Attendance[]; total: number }> {
    return this.hrRepository.getAttendance(
      tenantId,
      locationId,
      employeeId,
      startDate,
      endDate,
      page,
      limit,
    );
  }

  async getGlobalAttendance(
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: Attendance[]; total: number }> {
    return this.hrRepository.getGlobalAttendance(
      employeeId,
      startDate,
      endDate,
      page,
      limit,
    );
  }

  async clockIn(
    tenantId: string,
    employeeId: string,
    locationId: string,
    userId?: string,
  ): Promise<Attendance> {
    const attendance = await this.hrRepository.clockIn(
      tenantId,
      employeeId,
      locationId,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CLOCK_IN",
        entityType: "ATTENDANCE",
        entityId: attendance.id,
        metadata: { employeeId, locationId },
      });
    }
    return attendance;
  }

  async clockOut(
    tenantId: string,
    employeeId: string,
    userId?: string,
  ): Promise<Attendance> {
    const attendance = await this.hrRepository.clockOut(tenantId, employeeId);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CLOCK_OUT",
        entityType: "ATTENDANCE",
        entityId: attendance.id,
        metadata: { employeeId },
      });
    }
    return attendance;
  }

  // Leave Management
  async getLeaveRequests(
    tenantId: string,
    locationId?: string,
    status?: string,
    employeeId?: string,
  ): Promise<LeaveRequest[]> {
    return this.hrRepository.getLeaveRequests(
      tenantId,
      locationId,
      status,
      employeeId,
    );
  }

  async getGlobalLeaveRequests(
    status?: string,
    employeeId?: string,
  ): Promise<LeaveRequest[]> {
    return this.hrRepository.getGlobalLeaveRequests(status, employeeId);
  }

  async createLeaveRequest(
    tenantId: string,
    data: CreateLeaveRequestDto,
    userId?: string,
  ): Promise<LeaveRequest> {
    const request = await this.hrRepository.createLeaveRequest(tenantId, data);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CREATE",
        entityType: "LEAVE_REQUEST",
        entityId: request.id,
        metadata: {
          employeeId: data.employeeId,
          type: data.leaveType,
          startDate: data.startDate,
          endDate: data.endDate,
        },
      });
    }
    return request;
  }

  async approveLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes?: string,
    userId?: string,
  ): Promise<LeaveRequest> {
    const beforeState = await this.hrRepository.getLeaveRequestById(tenantId, requestId);
    const request = await this.hrRepository.approveLeaveRequest(
      tenantId,
      requestId,
      reviewerId,
      notes,
    );
    
    // 1. Audit Logging
    if (userId || reviewerId) {
      await this.auditService.log({
        tenantId,
        userId: userId || reviewerId,
        module: "HR",
        action: "APPROVE_LEAVE",
        entityType: "LEAVE_REQUEST",
        entityId: requestId,
        beforeState,
        afterState: request,
        metadata: { notes },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "LEAVE_APPROVED",
      message: `Leave request ${requestId} approved by ${reviewerId}`,
      payload: { requestId, reviewerId },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.LEAVE_APPROVED",
      tenantId,
      entityId: requestId,
      entityType: "LEAVE_REQUEST",
      sourceModule: "HR",
      userId,
      payload: { employeeId: request.employeeId, reviewerId, notes },
    });

    return request;
  }

  async rejectLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes: string,
    userId?: string,
  ): Promise<LeaveRequest> {
    const beforeState = await this.hrRepository.getLeaveRequestById(tenantId, requestId);
    const request = await this.hrRepository.rejectLeaveRequest(
      tenantId,
      requestId,
      reviewerId,
      notes,
    );
    
    // 1. Audit Logging
    if (userId || reviewerId) {
      await this.auditService.log({
        tenantId,
        userId: userId || reviewerId,
        module: "HR",
        action: "REJECT_LEAVE",
        entityType: "LEAVE_REQUEST",
        entityId: requestId,
        beforeState,
        afterState: request,
        metadata: { notes },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "LEAVE_REJECTED",
      message: `Leave request ${requestId} rejected by ${reviewerId}`,
      payload: { requestId, reviewerId },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.LEAVE_REJECTED",
      tenantId,
      entityId: requestId,
      entityType: "LEAVE_REQUEST",
      sourceModule: "HR",
      userId,
      payload: { employeeId: request.employeeId, reviewerId, notes },
    });

    return request;
  }

  // Payroll Management
  async getPayroll(
    tenantId: string,
    locationId?: string,
    employeeId?: string,
    period?: string,
  ): Promise<Payroll[]> {
    return this.hrRepository.getPayroll(
      tenantId,
      locationId,
      employeeId,
      period,
    );
  }

  async getGlobalPayroll(
    employeeId: string,
    period?: string,
  ): Promise<Payroll[]> {
    return this.hrRepository.getGlobalPayroll(employeeId, period);
  }

  async calculatePayroll(
    tenantId: string,
    employeeId: string,
    period: string,
    userId?: string,
  ): Promise<Payroll> {
    const payroll = await this.hrRepository.calculatePayroll(
      tenantId,
      employeeId,
      period,
    );
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "CALCULATE",
        entityType: "PAYROLL",
        entityId: payroll.id,
        afterState: payroll,
        metadata: { employeeId, period },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "PAYROLL_CALCULATED",
      message: `Payroll calculated for ${employeeId} - Period: ${period}`,
      payload: { payrollId: payroll.id, employeeId, period },
      userId,
    });

    // 3. Domain Event (High Frequency Event)
    await this.eventBus.publish({
      eventType: "HR.PAYROLL_CALCULATED",
      tenantId,
      entityId: payroll.id,
      entityType: "PAYROLL",
      sourceModule: "HR",
      userId,
      payload: { employeeId, period, totalAmount: payroll.netPay },
    });

    return payroll;
  }

  // Organization Management
  async getDepartments(tenantId: string): Promise<Department[]> {
    return this.hrRepository.getDepartments(tenantId);
  }

  async getGlobalDepartments(): Promise<Department[]> {
    return this.hrRepository.getGlobalDepartments();
  }

  async getDepartmentById(
    tenantId: string,
    departmentId: string,
  ): Promise<Department | null> {
    return this.hrRepository.getDepartmentById(tenantId, departmentId);
  }

  async createDepartment(
    tenantId: string,
    data: CreateDepartmentDto,
    userId?: string,
  ): Promise<Department> {
    const department = await this.hrRepository.createDepartment(tenantId, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "CREATE",
        entityType: "DEPARTMENT",
        entityId: department.id,
        afterState: department,
        metadata: { name: department.name },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "DEPARTMENT_CREATED",
      message: `Department created: ${department.name}`,
      payload: { departmentId: department.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.DEPARTMENT_CREATED",
      tenantId,
      entityId: department.id,
      entityType: "DEPARTMENT",
      sourceModule: "HR",
      userId,
      payload: { name: department.name },
    });

    return department;
  }

  // Recruitment Management
  async getRequisitions(
    tenantId: string,
    status?: string,
  ): Promise<JobRequisition[]> {
    return this.hrRepository.getRequisitions(tenantId, status);
  }

  async getGlobalRequisitions(status?: string): Promise<JobRequisition[]> {
    return this.hrRepository.getGlobalRequisitions(status);
  }

  async createRequisition(
    tenantId: string,
    data: CreateRequisitionDto,
    userId?: string,
  ): Promise<JobRequisition> {
    const requisition = await this.hrRepository.createRequisition(
      tenantId,
      data,
    );

    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "CREATE",
        entityType: "REQUISITION",
        entityId: requisition.id,
        afterState: requisition,
        metadata: { title: data.title, departmentId: data.departmentId },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "REQUISITION_CREATED",
      message: `Job Requisition created: ${requisition.title}`,
      payload: { requisitionId: requisition.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.REQUISITION_CREATED",
      tenantId,
      entityId: requisition.id,
      entityType: "REQUISITION",
      sourceModule: "HR",
      userId,
      payload: { title: requisition.title, departmentId: requisition.departmentId },
    });

    return requisition;
  }

   async updateRequisition(
    tenantId: string,
    id: string,
    data: Partial<JobRequisition>,
    userId?: string,
  ): Promise<JobRequisition> {
    const beforeState = await this.hrRepository.getRequisitionById?.(tenantId, id);
    const requisition = await this.hrRepository.updateRequisition(
      tenantId,
      id,
      data,
    );
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "UPDATE",
        entityType: "REQUISITION",
        entityId: id,
        beforeState,
        afterState: requisition,
        changes: data,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "REQUISITION_UPDATED",
      message: `Job Requisition updated: ${id}`,
      payload: { requisitionId: id, updates: data },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.REQUISITION_UPDATED",
      tenantId,
      entityId: id,
      entityType: "REQUISITION",
      sourceModule: "HR",
      userId,
      payload: data,
    });

    return requisition;
  }
  // Talent Management
  async getCandidates(tenantId: string, status?: string): Promise<Candidate[]> {
    return this.hrRepository.getCandidates(tenantId, status);
  }

  async createCandidate(tenantId: string, data: any, userId?: string): Promise<Candidate> {
    const candidate = await this.hrRepository.createCandidate(tenantId, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "CREATE",
        entityType: "CANDIDATE",
        entityId: candidate.id,
        afterState: candidate,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "CANDIDATE_CREATED",
      message: `Candidate profile created for: ${candidate.firstName} ${candidate.lastName}`,
      payload: { candidateId: candidate.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.CANDIDATE_APPLIED",
      tenantId,
      entityId: candidate.id,
      entityType: "CANDIDATE",
      sourceModule: "HR",
      userId,
      payload: { requisitionId: candidate.requisitionId, source: candidate.source },
    });

    return candidate;
  }

  async convertLeadToCandidate(
    tenantId: string,
    leadId: string,
    requisitionId: string,
    userId?: string,
  ): Promise<Candidate> {
    const lead = await this.hrRepository.getTalentLeadById(tenantId, leadId);
    if (!lead) throw new Error("Lead not found");

    const candidate = await this.hrRepository.createCandidate(tenantId, {
      firstName: lead.name.split(" ")[0],
      lastName: lead.name.split(" ").slice(1).join(" ") || "N/A",
      email: lead.email,
      phone: lead.phone,
      requisitionId,
      source: lead.source,
    });

    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "CONVERT_LEAD",
        entityType: "CANDIDATE",
        entityId: candidate.id,
        afterState: candidate,
        metadata: { leadId },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "TALENT_LEAD_CONVERTED",
      message: `Talent Lead ${leadId} converted to Candidate ${candidate.id}`,
      payload: { leadId, candidateId: candidate.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.CANDIDATE_CONVERTED",
      tenantId,
      entityId: candidate.id,
      entityType: "CANDIDATE",
      sourceModule: "HR",
      userId,
      payload: { leadId, requisitionId },
    });

    return candidate;
  }

  async hireCandidate(tenantId: string, candidateId: string, userId?: string): Promise<Employee> {
    const employee = await this.hrRepository.hireCandidate(tenantId, candidateId);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "HIRE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        afterState: employee,
        metadata: { candidateId },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "CANDIDATE_HIRED",
      message: `Candidate ${candidateId} hired as Employee ${employee.id}`,
      payload: { candidateId, employeeId: employee.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.CANDIDATE_HIRED",
      tenantId,
      entityId: candidateId,
      entityType: "CANDIDATE",
      sourceModule: "HR",
      userId,
      payload: { 
        employeeId: employee.id, 
        hireDate: employee.hireDate,
        fullName: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        roleTitle: employee.roleTitle,
        departmentId: employee.departmentId
      },
    });

    return employee;
  }

  // Headcount & Compensation Management
  async getPositions(tenantId: string, deptId?: string): Promise<Position[]> {
    return this.hrRepository.getPositions(tenantId, deptId);
  }

  async updatePosition(tenantId: string, id: string, data: any, userId?: string): Promise<Position> {
    const beforeState = await this.hrRepository.getPositionById(tenantId, id);
    const position = await this.hrRepository.updatePosition(tenantId, id, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "UPDATE",
        entityType: "POSITION",
        entityId: position.id,
        beforeState,
        afterState: position,
        metadata: data,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "POSITION_UPDATED",
      message: `Position updated: ${position.id}`,
      payload: { positionId: position.id },
      userId,
    });

    // 3. Domain Event (Optional for Position, but keeping consistency)
    await this.eventBus.publish({
      eventType: "HR.POSITION_UPDATED",
      tenantId,
      entityId: id,
      entityType: "POSITION",
      sourceModule: "HR",
      userId,
      payload: data,
    });

    return position;
  }

  async getCompensation(tenantId: string, employeeId: string): Promise<Compensation | null> {
    return this.hrRepository.getCompensation(tenantId, employeeId);
  }

  async updateCompensation(tenantId: string, employeeId: string, data: any, userId?: string): Promise<Compensation> {
    const beforeState = await this.hrRepository.getCompensation(tenantId, employeeId);
    const compensation = await this.hrRepository.updateCompensation(tenantId, employeeId, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "UPDATE",
        entityType: "COMPENSATION",
        entityId: compensation.id,
        beforeState,
        afterState: compensation,
        metadata: data,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "COMPENSATION_UPDATED",
      message: `Compensation updated for employee: ${employeeId}`,
      payload: { employeeId, compensationId: compensation.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.COMPENSATION_UPDATED",
      tenantId,
      entityId: employeeId,
      entityType: "COMPENSATION",
      sourceModule: "HR",
      userId,
      payload: data,
    });

    return compensation;
  }


  // Performance Management
  async getPerformanceCycles(tenantId: string): Promise<PerformanceCycle[]> {
    return this.hrRepository.getPerformanceCycles(tenantId);
  }

  async createPerformanceCycle(
    tenantId: string,
    data: CreatePerformanceCycleDto,
    userId?: string,
  ): Promise<PerformanceCycle> {
    const cycle = await this.hrRepository.createPerformanceCycle(
      tenantId,
      data,
    );
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "CREATE",
        entityType: "PERFORMANCE_CYCLE",
        entityId: cycle.id,
        afterState: cycle,
        metadata: { name: data.name },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "PERFORMANCE_CYCLE_CREATED",
      message: `Performance Cycle created: ${data.name}`,
      payload: { cycleId: cycle.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.PERFORMANCE_CYCLE_CREATED",
      tenantId,
      entityId: cycle.id,
      entityType: "PERFORMANCE_CYCLE",
      sourceModule: "HR",
      userId,
      payload: { name: data.name },
    });

    return cycle;
  }

  async updatePerformanceCycle(
    tenantId: string,
    id: string,
    data: Partial<PerformanceCycle>,
    userId?: string,
  ): Promise<PerformanceCycle> {
    const beforeState = await this.hrRepository.getPerformanceCycleById?.(tenantId, id);
    const cycle = await this.hrRepository.updatePerformanceCycle(
      tenantId,
      id,
      data,
    );
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "UPDATE",
        entityType: "PERFORMANCE_CYCLE",
        entityId: id,
        beforeState,
        afterState: cycle,
        changes: data,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "PERFORMANCE_CYCLE_UPDATED",
      message: `Performance Cycle updated: ${id}`,
      payload: { cycleId: id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.PERFORMANCE_CYCLE_UPDATED",
      tenantId,
      entityId: id,
      entityType: "PERFORMANCE_CYCLE",
      sourceModule: "HR",
      userId,
      payload: data,
    });

    return cycle;
  }

  async getPerformanceReviews(
    tenantId: string,
    cycleId?: string,
    employeeId?: string,
  ): Promise<PerformanceReview[]> {
    return this.hrRepository.getPerformanceReviews(
      tenantId,
      cycleId,
      employeeId,
    );
  }

  async getGlobalPerformanceReviews(
    cycleId?: string,
    employeeId?: string,
  ): Promise<PerformanceReview[]> {
    return this.hrRepository.getGlobalPerformanceReviews(cycleId, employeeId);
  }

  async submitPerformanceReview(
    tenantId: string,
    data: SubmitReviewDto,
    userId?: string,
  ): Promise<PerformanceReview> {
    const review = await this.hrRepository.submitPerformanceReview(
      tenantId,
      data,
    );
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "SUBMIT",
        entityType: "PERFORMANCE_REVIEW",
        entityId: review.id,
        afterState: review,
        metadata: { employeeId: data.employeeId, rating: data.rating },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "PERFORMANCE_REVIEW_SUBMITTED",
      message: `Performance review submitted for employee: ${data.employeeId} - Rating: ${data.rating}`,
      payload: { reviewId: review.id, employeeId: data.employeeId, rating: data.rating },
      userId,
    });

    // 3. Domain Event (High Value Event)
    await this.eventBus.publish({
      eventType: "HR.PERFORMANCE_REVIEW_SUBMITTED",
      tenantId,
      entityId: review.id,
      entityType: "PERFORMANCE_REVIEW",
      sourceModule: "HR",
      userId,
      payload: { employeeId: data.employeeId, rating: data.rating },
    });

    return review;
  }

  // Case Management
  async getCases(
    tenantId: string,
    locationId?: string,
    status?: string,
  ): Promise<HRCase[]> {
    return this.hrRepository.getCases(tenantId, locationId, status);
  }

  async getCaseById(tenantId: string, id: string): Promise<HRCase | null> {
    return this.hrRepository.getCaseById(tenantId, id);
  }

  async createCase(
    tenantId: string,
    data: CreateCaseDto,
    userId?: string,
  ): Promise<HRCase> {
    const hrCase = await this.hrRepository.createCase(tenantId, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "CREATE",
        entityType: "CASE",
        entityId: hrCase.id,
        afterState: hrCase,
        metadata: { title: data.title, type: data.type },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "CASE_CREATED",
      message: `HR Case created: ${data.title}`,
      payload: { caseId: hrCase.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.CASE_CREATED",
      tenantId,
      entityId: hrCase.id,
      entityType: "CASE",
      sourceModule: "HR",
      userId,
      payload: { title: data.title, type: data.type },
    });

    return hrCase;
  }

   async updateCase(
    tenantId: string,
    id: string,
    data: Partial<HRCase>,
    userId?: string,
  ): Promise<HRCase> {
    const beforeState = await this.hrRepository.getCaseById(tenantId, id);
    const hrCase = await this.hrRepository.updateCase(tenantId, id, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "UPDATE",
        entityType: "CASE",
        entityId: id,
        beforeState,
        afterState: hrCase,
        changes: data,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "CASE_UPDATED",
      message: `HR Case updated: ${id}`,
      payload: { caseId: id, updates: data },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.CASE_UPDATED",
      tenantId,
      entityId: id,
      entityType: "CASE",
      sourceModule: "HR",
      userId,
      payload: data,
    });

    return hrCase;
  }

  // Contract Management
  async getContracts(
    tenantId: string,
    locationId?: string,
    employeeId?: string,
  ): Promise<Contract[]> {
    return this.hrRepository.getContracts(tenantId, locationId, employeeId);
  }

  async getGlobalContracts(employeeId?: string): Promise<Contract[]> {
    return this.hrRepository.getGlobalContracts(employeeId);
  }

  async createContract(
    tenantId: string,
    data: CreateContractDto,
    userId?: string,
  ): Promise<Contract> {
    const contract = await this.hrRepository.createContract(tenantId, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "CREATE",
        entityType: "CONTRACT",
        entityId: contract.id,
        afterState: contract,
        metadata: { employeeId: data.employeeId, type: data.type },
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "CONTRACT_CREATED",
      message: `Employment contract created for employee: ${data.employeeId}`,
      payload: { contractId: contract.id, employeeId: data.employeeId },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.CONTRACT_CREATED",
      tenantId,
      entityId: contract.id,
      entityType: "CONTRACT",
      sourceModule: "HR",
      userId,
      payload: { employeeId: data.employeeId, type: data.type },
    });

    return contract;
  }

   async updateContract(
    tenantId: string,
    id: string,
    data: Partial<Contract>,
    userId?: string,
  ): Promise<Contract> {
    const beforeState = await this.hrRepository.getContractById?.(tenantId, id);
    const contract = await this.hrRepository.updateContract(tenantId, id, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "HR",
        action: "UPDATE",
        entityType: "CONTRACT",
        entityId: id,
        beforeState,
        afterState: contract,
        changes: data,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "CONTRACT_UPDATED",
      message: `Employment contract updated: ${id}`,
      payload: { contractId: id, updates: data },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.CONTRACT_UPDATED",
      tenantId,
      entityId: id,
      entityType: "CONTRACT",
      sourceModule: "HR",
      userId,
      payload: data,
    });

    return contract;
  }

  // Location Management
  async getLocations(tenantId: string): Promise<any[]> {
    return this.hrRepository.getLocations(tenantId);
  }

  // Training Management
  async getTrainingPrograms(tenantId: string): Promise<any[]> {
    return this.hrRepository.getTrainingPrograms(tenantId);
  }

  async createTrainingProgram(tenantId: string, data: any, userId?: string): Promise<any> {
    const program = await this.hrRepository.createTrainingProgram(tenantId, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CREATE",
        entityType: "TRAINING_PROGRAM",
        entityId: program.id,
        afterState: program,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "TRAINING_PROGRAM_CREATED",
      message: `Training program created: ${data.title || program.id}`,
      payload: { programId: program.id },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.TRAINING_PROGRAM_CREATED",
      tenantId,
      entityId: program.id,
      entityType: "TRAINING_PROGRAM",
      sourceModule: "HR",
      userId,
      payload: { title: data.title },
    });

    return program;
  }

  async getTrainingAssignments(tenantId: string): Promise<any[]> {
    return this.hrRepository.getTrainingAssignments(tenantId);
  }

  async createTrainingAssignment(tenantId: string, data: any, userId?: string): Promise<any> {
    const assignment = await this.hrRepository.createTrainingAssignment(tenantId, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CREATE",
        entityType: "TRAINING_ASSIGNMENT",
        entityId: assignment.id,
        afterState: assignment,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "TRAINING_ASSIGNMENT_CREATED",
      message: `Training assigned: ${assignment.id}`,
      payload: { assignmentId: assignment.id, employeeId: data.employeeId },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.TRAINING_ASSIGNED",
      tenantId,
      entityId: assignment.id,
      entityType: "TRAINING_ASSIGNMENT",
      sourceModule: "HR",
      userId,
      payload: { employeeId: data.employeeId, programId: data.programId },
    });

    return assignment;
  }

  async updateTrainingAssignment(tenantId: string, id: string, data: any, userId?: string): Promise<any> {
    const beforeState = await this.hrRepository.getTrainingAssignmentById?.(tenantId, id);
    const assignment = await this.hrRepository.updateTrainingAssignment(tenantId, id, data);
    
    // 1. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "UPDATE",
        entityType: "TRAINING_ASSIGNMENT",
        entityId: assignment.id,
        beforeState,
        afterState: assignment,
        changes: data,
      });
    }

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "TRAINING_STATUS_UPDATED",
      message: `Training assignment ${id} updated to status: ${data.status}`,
      payload: { assignmentId: id, status: data.status },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.TRAINING_STATUS_UPDATED",
      tenantId,
      entityId: id,
      entityType: "TRAINING_ASSIGNMENT",
      sourceModule: "HR",
      userId,
      payload: { status: data.status },
    });

    return assignment;
  }

  // Analytics & Reporting
  async getHeadcountTrend(tenantId: string): Promise<any[]> {
    return this.hrRepository.getHeadcountTrend(tenantId);
  }

  async getTurnoverStats(tenantId: string): Promise<any> {
    return this.hrRepository.getTurnoverStats(tenantId);
  }

  async getDepartmentAnalytics(tenantId: string): Promise<any[]> {
    return this.hrRepository.getDepartmentAnalytics(tenantId);
  }

  async getCompensationAnalytics(tenantId: string): Promise<any> {
    return this.hrRepository.getCompensationAnalytics(tenantId);
  }

  // Recruitment & Scheduling
  async getInterviews(tenantId: string, candidateId?: string): Promise<Interview[]> {
    return this.hrRepository.getInterviews(tenantId, candidateId);
  }

  async scheduleInterview(tenantId: string, data: any, userId: string): Promise<Interview> {
    const interview = await this.hrRepository.scheduleInterview(tenantId, data);

    // 1. Audit Logging
    await this.auditService.log({
      tenantId,
      userId,
      module: "HR",
      action: "SCHEDULE",
      entityType: "INTERVIEW",
      entityId: interview.id,
      afterState: interview,
    });

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "INTERVIEW_SCHEDULED",
      message: `Interview scheduled for candidate: ${data.candidateId}`,
      payload: { interviewId: interview.id, candidateId: data.candidateId },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.INTERVIEW_SCHEDULED",
      tenantId,
      entityId: interview.id,
      entityType: "INTERVIEW",
      sourceModule: "HR",
      userId,
      payload: {
        candidateId: interview.candidateId,
        interviewerId: interview.interviewerId,
        title: interview.title,
        scheduledAt: interview.scheduledAt,
      },
    });

    return interview;
  }

  async updateInterviewStatus(tenantId: string, id: string, status: string, userId: string): Promise<Interview> {
    const beforeState = await this.hrRepository.getInterviewById(tenantId, id);
    const interview = await this.hrRepository.updateInterviewStatus(tenantId, id, status);

    // 1. Audit Logging
    await this.auditService.log({
      tenantId,
      userId,
      module: "HR",
      action: "UPDATE_STATUS",
      entityType: "INTERVIEW",
      entityId: interview.id,
      beforeState,
      afterState: interview,
    });

    // 2. System Logging
    await this.loggerService.log({
      tenantId,
      module: "HR",
      level: "INFO",
      event: "INTERVIEW_STATUS_UPDATED",
      message: `Interview ${id} status updated to: ${status}`,
      payload: { interviewId: id, status },
      userId,
    });

    // 3. Domain Event
    await this.eventBus.publish({
      eventType: "HR.INTERVIEW_STATUS_UPDATED",
      tenantId,
      entityId: interview.id,
      entityType: "INTERVIEW",
      sourceModule: "HR",
      userId,
      payload: {
        status: interview.status,
      },
    });

    return interview;
  }

  // Talent Lead Management
  async getTalentLeads(tenantId: string, status?: string): Promise<TalentLead[]> {
    return this.hrRepository.getTalentLeads(tenantId, status);
  }

  async getTalentLeadById(tenantId: string, id: string): Promise<TalentLead | null> {
    return this.hrRepository.getTalentLeadById(tenantId, id);
  }
}

