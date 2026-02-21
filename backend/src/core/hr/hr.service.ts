import { Injectable } from '@nestjs/common';
import { IHRRepository } from './repositories/hr.repository.interface';
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { Payroll } from './entities/payroll.entity';
import { Department } from './entities/department.entity';
import { JobRequisition } from './entities/requisition.entity';
import { PerformanceCycle } from './entities/performance-cycle.entity';
import { PerformanceReview } from './entities/performance-review.entity';
import { HRCase } from './entities/hr-case.entity';
import { Contract } from './entities/contract.entity';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { CreatePerformanceCycleDto } from './dto/create-performance-cycle.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { CreateCaseDto } from './dto/create-case.dto';
import { CreateContractDto } from './dto/create-contract.dto';

/**
 * HR Service
 * Business logic layer for HR operations
 * 
 * CRITICAL: All methods require tenantId as the first argument
 */
@Injectable()
export class HRService {
  constructor(private readonly hrRepository: IHRRepository) {}

  // Employee Management
  async getEmployees(tenantId: string, locationId?: string): Promise<Employee[]> {
    return this.hrRepository.getEmployees(tenantId, locationId);
  }

  async getGlobalEmployees(locationId?: string): Promise<Employee[]> {
    return this.hrRepository.getGlobalEmployees(locationId);
  }

  async getEmployeeById(tenantId: string, employeeId: string): Promise<Employee | null> {
    return this.hrRepository.getEmployeeById(tenantId, employeeId);
  }

  async getGlobalEmployeeById(employeeId: string): Promise<Employee | null> {
    return this.hrRepository.getGlobalEmployeeById(employeeId);
  }

  async createEmployee(tenantId: string, data: CreateEmployeeDto): Promise<Employee> {
    return this.hrRepository.createEmployee(tenantId, data);
  }

  async updateEmployee(tenantId: string, employeeId: string, data: UpdateEmployeeDto): Promise<Employee> {
    return this.hrRepository.updateEmployee(tenantId, employeeId, data);
  }

  async deactivateEmployee(tenantId: string, employeeId: string): Promise<Employee> {
    return this.hrRepository.deactivateEmployee(tenantId, employeeId);
  }

  // Attendance Management
  async getAttendance(
    tenantId: string,
    employeeId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]> {
    return this.hrRepository.getAttendance(tenantId, employeeId, startDate, endDate);
  }

  async getGlobalAttendance(
    employeeId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]> {
    return this.hrRepository.getGlobalAttendance(employeeId, startDate, endDate);
  }

  async clockIn(tenantId: string, employeeId: string, locationId: string): Promise<Attendance> {
    return this.hrRepository.clockIn(tenantId, employeeId, locationId);
  }

  async clockOut(tenantId: string, employeeId: string): Promise<Attendance> {
    return this.hrRepository.clockOut(tenantId, employeeId);
  }

  // Leave Management
  async getLeaveRequests(tenantId: string, status?: string, employeeId?: string): Promise<LeaveRequest[]> {
    return this.hrRepository.getLeaveRequests(tenantId, status, employeeId);
  }

  async getGlobalLeaveRequests(status?: string, employeeId?: string): Promise<LeaveRequest[]> {
    return this.hrRepository.getGlobalLeaveRequests(status, employeeId);
  }

  async createLeaveRequest(tenantId: string, data: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return this.hrRepository.createLeaveRequest(tenantId, data);
  }

  async approveLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes?: string,
  ): Promise<LeaveRequest> {
    return this.hrRepository.approveLeaveRequest(tenantId, requestId, reviewerId, notes);
  }

  async rejectLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes: string,
  ): Promise<LeaveRequest> {
    return this.hrRepository.rejectLeaveRequest(tenantId, requestId, reviewerId, notes);
  }

  // Payroll Management
  async getPayroll(tenantId: string, employeeId: string, period?: string): Promise<Payroll[]> {
    return this.hrRepository.getPayroll(tenantId, employeeId, period);
  }

  async getGlobalPayroll(employeeId: string, period?: string): Promise<Payroll[]> {
    return this.hrRepository.getGlobalPayroll(employeeId, period);
  }

  async calculatePayroll(tenantId: string, employeeId: string, period: string): Promise<Payroll> {
    return this.hrRepository.calculatePayroll(tenantId, employeeId, period);
  }

  // Organization Management
  async getDepartments(tenantId: string): Promise<Department[]> {
    return this.hrRepository.getDepartments(tenantId);
  }

  async getGlobalDepartments(): Promise<Department[]> {
    return this.hrRepository.getGlobalDepartments();
  }

  async getDepartmentById(tenantId: string, departmentId: string): Promise<Department | null> {
    return this.hrRepository.getDepartmentById(tenantId, departmentId);
  }

  async createDepartment(tenantId: string, data: CreateDepartmentDto): Promise<Department> {
    return this.hrRepository.createDepartment(tenantId, data);
  }

  // Recruitment Management
  async getRequisitions(tenantId: string, status?: string): Promise<JobRequisition[]> {
    return this.hrRepository.getRequisitions(tenantId, status);
  }

  async getGlobalRequisitions(status?: string): Promise<JobRequisition[]> {
    return this.hrRepository.getGlobalRequisitions(status);
  }

  async createRequisition(tenantId: string, data: CreateRequisitionDto): Promise<JobRequisition> {
    return this.hrRepository.createRequisition(tenantId, data);
  }

  async updateRequisition(tenantId: string, id: string, data: Partial<JobRequisition>): Promise<JobRequisition> {
    return this.hrRepository.updateRequisition(tenantId, id, data);
  }

  // Performance Management
  async getPerformanceCycles(tenantId: string): Promise<PerformanceCycle[]> {
    return this.hrRepository.getPerformanceCycles(tenantId);
  }

  async createPerformanceCycle(tenantId: string, data: CreatePerformanceCycleDto): Promise<PerformanceCycle> {
    return this.hrRepository.createPerformanceCycle(tenantId, data);
  }

  async updatePerformanceCycle(tenantId: string, id: string, data: Partial<PerformanceCycle>): Promise<PerformanceCycle> {
    return this.hrRepository.updatePerformanceCycle(tenantId, id, data);
  }

  async getPerformanceReviews(tenantId: string, cycleId?: string, employeeId?: string): Promise<PerformanceReview[]> {
    return this.hrRepository.getPerformanceReviews(tenantId, cycleId, employeeId);
  }

  async getGlobalPerformanceReviews(cycleId?: string, employeeId?: string): Promise<PerformanceReview[]> {
    return this.hrRepository.getGlobalPerformanceReviews(cycleId, employeeId);
  }

  async submitPerformanceReview(tenantId: string, data: SubmitReviewDto): Promise<PerformanceReview> {
    return this.hrRepository.submitPerformanceReview(tenantId, data);
  }

  // Case Management
  async getCases(tenantId: string, status?: string): Promise<HRCase[]> {
    return this.hrRepository.getCases(tenantId, status);
  }

  async getCaseById(tenantId: string, id: string): Promise<HRCase | null> {
    return this.hrRepository.getCaseById(tenantId, id);
  }

  async createCase(tenantId: string, data: CreateCaseDto): Promise<HRCase> {
    return this.hrRepository.createCase(tenantId, data);
  }

  async updateCase(tenantId: string, id: string, data: Partial<HRCase>): Promise<HRCase> {
    return this.hrRepository.updateCase(tenantId, id, data);
  }

  // Contract Management
  async getContracts(tenantId: string, employeeId?: string): Promise<Contract[]> {
    return this.hrRepository.getContracts(tenantId, employeeId);
  }

  async getGlobalContracts(employeeId?: string): Promise<Contract[]> {
    return this.hrRepository.getGlobalContracts(employeeId);
  }

  async createContract(tenantId: string, data: CreateContractDto): Promise<Contract> {
    return this.hrRepository.createContract(tenantId, data);
  }

  async updateContract(tenantId: string, id: string, data: Partial<Contract>): Promise<Contract> {
    return this.hrRepository.updateContract(tenantId, id, data);
  }
}
