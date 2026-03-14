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
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CREATE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        metadata: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          role: employee.roleTitle,
        },
      });
    }

    await this.eventBus.publish({
      eventType: "employee.created",
      tenantId,
      entityId: employee.id,
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
    const employee = await this.hrRepository.updateEmployee(
      tenantId,
      employeeId,
      data,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "UPDATE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        metadata: { updates: data },
      });
    }
    return employee;
  }

  async deactivateEmployee(
    tenantId: string,
    employeeId: string,
    userId?: string,
  ): Promise<Employee> {
    const employee = await this.hrRepository.deactivateEmployee(
      tenantId,
      employeeId,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "DEACTIVATE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
      });
    }

    await this.eventBus.publish({
      eventType: "employee.terminated",
      tenantId,
      entityId: employee.id,
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
    const employee = await this.hrRepository.promoteEmployee(tenantId, employeeId, data);
    
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "PROMOTE",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        metadata: data,
      });
    }

    await this.eventBus.publish({
      eventType: "employee.promoted",
      tenantId,
      entityId: employeeId,
      payload: data,
    });

    return employee;
  }

  async transferEmployee(
    tenantId: string,
    employeeId: string,
    data: any,
    userId?: string,
  ): Promise<Employee> {
    const employee = await this.hrRepository.transferEmployee(tenantId, employeeId, data);
    
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "TRANSFER",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        metadata: data,
      });
    }

    await this.eventBus.publish({
      eventType: "employee.transferred",
      tenantId,
      entityId: employeeId,
      payload: data,
    });

    return employee;
  }

  async suspendEmployee(
    tenantId: string,
    employeeId: string,
    reason: string,
    userId?: string,
  ): Promise<Employee> {
    const employee = await this.hrRepository.suspendEmployee(tenantId, employeeId, reason);
    
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "SUSPEND",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        metadata: { reason },
      });
    }

    await this.eventBus.publish({
      eventType: "employee.suspended",
      tenantId,
      entityId: employeeId,
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
    const request = await this.hrRepository.approveLeaveRequest(
      tenantId,
      requestId,
      reviewerId,
      notes,
    );
    if (userId || reviewerId) {
      await this.auditService.log({
        tenantId,
        userId: userId || reviewerId,
        module: "hr",
        action: "APPROVE",
        entityType: "LEAVE_REQUEST",
        entityId: requestId,
        metadata: { reviewerId, notes },
      });
    }
    return request;
  }

  async rejectLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes: string,
    userId?: string,
  ): Promise<LeaveRequest> {
    const request = await this.hrRepository.rejectLeaveRequest(
      tenantId,
      requestId,
      reviewerId,
      notes,
    );
    if (userId || reviewerId) {
      await this.auditService.log({
        tenantId,
        userId: userId || reviewerId,
        module: "hr",
        action: "REJECT",
        entityType: "LEAVE_REQUEST",
        entityId: requestId,
        metadata: { reviewerId, notes },
      });
    }
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
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CALCULATE",
        entityType: "PAYROLL",
        entityId: payroll.id,
        metadata: { employeeId, period },
      });
    }
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
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CREATE",
        entityType: "DEPARTMENT",
        entityId: department.id,
        metadata: { name: department.name },
      });
    }
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
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CREATE",
        entityType: "REQUISITION",
        entityId: requisition.id,
        metadata: { title: data.title, departmentId: data.departmentId },
      });
    }
    return requisition;
  }

  async updateRequisition(
    tenantId: string,
    id: string,
    data: Partial<JobRequisition>,
    userId?: string,
  ): Promise<JobRequisition> {
    const requisition = await this.hrRepository.updateRequisition(
      tenantId,
      id,
      data,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "UPDATE",
        entityType: "REQUISITION",
        entityId: id,
        changes: data,
      });
    }
    return requisition;
  }
  // Talent Management
  async getCandidates(tenantId: string, status?: string): Promise<Candidate[]> {
    return this.hrRepository.getCandidates(tenantId, status);
  }

  async createCandidate(tenantId: string, data: any, userId?: string): Promise<Candidate> {
    const candidate = await this.hrRepository.createCandidate(tenantId, data);
    
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CREATE",
        entityType: "CANDIDATE",
        entityId: candidate.id,
      });
    }

    await this.eventBus.publish({
      eventType: "candidate.applied",
      tenantId,
      entityId: candidate.id,
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

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CONVERT_LEAD",
        entityType: "CANDIDATE",
        entityId: candidate.id,
        metadata: { leadId },
      });
    }

    await this.eventBus.publish({
      eventType: "candidate.converted",
      tenantId,
      entityId: candidate.id,
      payload: { leadId, requisitionId },
    });

    return candidate;
  }

  async hireCandidate(tenantId: string, candidateId: string, userId?: string): Promise<Employee> {
    const employee = await this.hrRepository.hireCandidate(tenantId, candidateId);
    
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "HIRE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        metadata: { candidateId },
      });
    }

    await this.eventBus.publish({
      eventType: "candidate.hired",
      tenantId,
      entityId: candidateId,
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
    const position = await this.hrRepository.updatePosition(tenantId, id, data);
    
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "UPDATE",
        entityType: "POSITION",
        entityId: position.id,
        metadata: data,
      });
    }

    return position;
  }

  async getCompensation(tenantId: string, employeeId: string): Promise<Compensation | null> {
    return this.hrRepository.getCompensation(tenantId, employeeId);
  }

  async updateCompensation(tenantId: string, employeeId: string, data: any, userId?: string): Promise<Compensation> {
    const compensation = await this.hrRepository.updateCompensation(tenantId, employeeId, data);
    
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "UPDATE",
        entityType: "COMPENSATION",
        entityId: compensation.id,
        metadata: data,
      });
    }

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
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CREATE",
        entityType: "PERFORMANCE_CYCLE",
        entityId: cycle.id,
        metadata: { name: data.name },
      });
    }
    return cycle;
  }

  async updatePerformanceCycle(
    tenantId: string,
    id: string,
    data: Partial<PerformanceCycle>,
    userId?: string,
  ): Promise<PerformanceCycle> {
    const cycle = await this.hrRepository.updatePerformanceCycle(
      tenantId,
      id,
      data,
    );
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "UPDATE",
        entityType: "PERFORMANCE_CYCLE",
        entityId: id,
        changes: data,
      });
    }
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
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "SUBMIT",
        entityType: "PERFORMANCE_REVIEW",
        entityId: review.id,
        metadata: { employeeId: data.employeeId, rating: data.rating },
      });
    }
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
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CREATE",
        entityType: "CASE",
        entityId: hrCase.id,
        metadata: { title: data.title, type: data.type },
      });
    }
    return hrCase;
  }

  async updateCase(
    tenantId: string,
    id: string,
    data: Partial<HRCase>,
    userId?: string,
  ): Promise<HRCase> {
    const hrCase = await this.hrRepository.updateCase(tenantId, id, data);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "UPDATE",
        entityType: "CASE",
        entityId: id,
        changes: data,
      });
    }
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
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "CREATE",
        entityType: "CONTRACT",
        entityId: contract.id,
        metadata: { employeeId: data.employeeId, type: data.type },
      });
    }
    return contract;
  }

  async updateContract(
    tenantId: string,
    id: string,
    data: Partial<Contract>,
    userId?: string,
  ): Promise<Contract> {
    const contract = await this.hrRepository.updateContract(tenantId, id, data);
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        module: "hr",
        action: "UPDATE",
        entityType: "CONTRACT",
        entityId: id,
        changes: data,
      });
    }
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

  async createTrainingProgram(tenantId: string, data: any, userId: string): Promise<any> {
    const program = await this.hrRepository.createTrainingProgram(tenantId, data);
    await this.auditService.log({
      tenantId,
      userId,
      module: "hr",
      action: "CREATE",
      entityType: "TRAINING_PROGRAM",
      entityId: program.id,
    });
    return program;
  }

  async getTrainingAssignments(tenantId: string): Promise<any[]> {
    return this.hrRepository.getTrainingAssignments(tenantId);
  }

  async createTrainingAssignment(tenantId: string, data: any, userId: string): Promise<any> {
    const assignment = await this.hrRepository.createTrainingAssignment(tenantId, data);
    await this.auditService.log({
      tenantId,
      userId,
      module: "hr",
      action: "CREATE",
      entityType: "TRAINING_ASSIGNMENT",
      entityId: assignment.id,
    });
    return assignment;
  }

  async updateTrainingAssignment(tenantId: string, id: string, data: any, userId: string): Promise<any> {
    const assignment = await this.hrRepository.updateTrainingAssignment(tenantId, id, data);
    await this.auditService.log({
      tenantId,
      userId,
      module: "hr",
      action: "UPDATE",
      entityType: "TRAINING_ASSIGNMENT",
      entityId: assignment.id,
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

    await this.eventBus.publish({
      eventType: "interview.scheduled",
      tenantId,
      entityId: interview.id,
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
    const interview = await this.hrRepository.updateInterviewStatus(tenantId, id, status);

    await this.eventBus.publish({
      eventType: "interview.status_updated",
      tenantId,
      entityId: interview.id,
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

