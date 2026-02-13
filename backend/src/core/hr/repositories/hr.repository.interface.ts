import { Employee } from '../entities/employee.entity';
import { Attendance } from '../entities/attendance.entity';
import { LeaveRequest } from '../entities/leave-request.entity';
import { Payroll } from '../entities/payroll.entity';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';

/**
 * HR Repository Interface
 * Abstract class defining the contract for HR data persistence
 * 
 * CRITICAL: All methods MUST accept tenantId as the first argument
 */
export abstract class IHRRepository {
  // Employee Management
  abstract getEmployees(tenantId: string, locationId?: string): Promise<Employee[]>;
  abstract getEmployeeById(tenantId: string, employeeId: string): Promise<Employee | null>;
  abstract createEmployee(tenantId: string, data: CreateEmployeeDto): Promise<Employee>;
  abstract updateEmployee(tenantId: string, employeeId: string, data: UpdateEmployeeDto): Promise<Employee>;
  abstract deactivateEmployee(tenantId: string, employeeId: string): Promise<Employee>;

  // Attendance Management
  abstract getAttendance(
    tenantId: string,
    employeeId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]>;
  abstract clockIn(tenantId: string, employeeId: string, locationId: string): Promise<Attendance>;
  abstract clockOut(tenantId: string, employeeId: string): Promise<Attendance>;

  // Leave Management
  abstract getLeaveRequests(
    tenantId: string,
    status?: string,
    employeeId?: string,
  ): Promise<LeaveRequest[]>;
  abstract createLeaveRequest(tenantId: string, data: CreateLeaveRequestDto): Promise<LeaveRequest>;
  abstract approveLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes?: string,
  ): Promise<LeaveRequest>;
  abstract rejectLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes: string,
  ): Promise<LeaveRequest>;

  // Payroll Management
  abstract getPayroll(tenantId: string, employeeId: string, period?: string): Promise<Payroll[]>;
  abstract calculatePayroll(tenantId: string, employeeId: string, period: string): Promise<Payroll>;
}
