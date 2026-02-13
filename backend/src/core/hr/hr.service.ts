import { Injectable } from '@nestjs/common';
import { IHRRepository } from './repositories/hr.repository.interface';
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { Payroll } from './entities/payroll.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';

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

  async getEmployeeById(tenantId: string, employeeId: string): Promise<Employee | null> {
    return this.hrRepository.getEmployeeById(tenantId, employeeId);
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

  async calculatePayroll(tenantId: string, employeeId: string, period: string): Promise<Payroll> {
    return this.hrRepository.calculatePayroll(tenantId, employeeId, period);
  }
}
