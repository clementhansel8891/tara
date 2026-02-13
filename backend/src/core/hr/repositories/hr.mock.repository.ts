import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IHRRepository } from './hr.repository.interface';
import { Employee } from '../entities/employee.entity';
import { Attendance } from '../entities/attendance.entity';
import { LeaveRequest } from '../entities/leave-request.entity';
import { Payroll } from '../entities/payroll.entity';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';

/**
 * HR Mock Repository
 * In-memory implementation for DEV_MOCK_MODE
 */
@Injectable()
export class HRMockRepository extends IHRRepository {
  private employees: Employee[] = [];
  private attendance: Attendance[] = [];
  private leaveRequests: LeaveRequest[] = [];
  private payrolls: Payroll[] = [];

  constructor() {
    super();
    this.initializeMockData();
  }

  /**
   * Initialize mock data for two tenants
   */
  private initializeMockData(): void {
    // Tenant 001: Tech Startup
    this.createMockEmployees('tenant-001', 'location-001', [
      {
        employeeCode: 'EMP-1001',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@techstartup.local',
        departmentId: 'dept-engineering',
        roleTitle: 'Senior Software Engineer',
        employmentType: 'full_time' as any,
        baseSalary: 95000,
        hireDate: '2023-01-15',
      },
      {
        employeeCode: 'EMP-1002',
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@techstartup.local',
        departmentId: 'dept-product',
        roleTitle: 'Product Manager',
        employmentType: 'full_time' as any,
        baseSalary: 105000,
        hireDate: '2022-08-20',
      },
      {
        employeeCode: 'EMP-1003',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@techstartup.local',
        departmentId: 'dept-design',
        roleTitle: 'UX Designer',
        employmentType: 'full_time' as any,
        baseSalary: 80000,
        hireDate: '2023-03-10',
      },
      {
        employeeCode: 'EMP-1004',
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@techstartup.local',
        departmentId: 'dept-engineering',
        roleTitle: 'DevOps Engineer',
        employmentType: 'contractor' as any,
        hourlyRate: 75,
        hireDate: '2024-01-05',
      },
      {
        employeeCode: 'EMP-1005',
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson@techstartup.local',
        departmentId: 'dept-hr',
        roleTitle: 'HR Manager',
        employmentType: 'full_time' as any,
        baseSalary: 75000,
        hireDate: '2022-06-01',
      },
    ]);

    // Tenant 002: Retail Chain
    this.createMockEmployees('tenant-002', 'location-002', [
      {
        employeeCode: 'EMP-2001',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@retailchain.local',
        departmentId: 'dept-store-ops',
        roleTitle: 'Store Manager',
        employmentType: 'full_time' as any,
        baseSalary: 55000,
        hireDate: '2021-04-15',
      },
      {
        employeeCode: 'EMP-2002',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@retailchain.local',
        departmentId: 'dept-store-ops',
        roleTitle: 'Assistant Manager',
        employmentType: 'full_time' as any,
        baseSalary: 42000,
        hireDate: '2022-02-20',
      },
      {
        employeeCode: 'EMP-2003',
        firstName: 'Robert',
        lastName: 'Taylor',
        email: 'robert.taylor@retailchain.local',
        departmentId: 'dept-sales',
        roleTitle: 'Sales Associate',
        employmentType: 'part_time' as any,
        hourlyRate: 18,
        hireDate: '2023-09-01',
      },
      {
        employeeCode: 'EMP-2004',
        firstName: 'Jennifer',
        lastName: 'Martinez',
        email: 'jennifer.martinez@retailchain.local',
        departmentId: 'dept-sales',
        roleTitle: 'Sales Associate',
        employmentType: 'part_time' as any,
        hourlyRate: 18,
        hireDate: '2023-10-15',
      },
      {
        employeeCode: 'EMP-2005',
        firstName: 'William',
        lastName: 'Brown',
        email: 'william.brown@retailchain.local',
        departmentId: 'dept-inventory',
        roleTitle: 'Inventory Specialist',
        employmentType: 'full_time' as any,
        baseSalary: 38000,
        hireDate: '2022-11-01',
      },
      {
        employeeCode: 'EMP-2006',
        firstName: 'Amanda',
        lastName: 'Davis',
        email: 'amanda.davis@retailchain.local',
        departmentId: 'dept-cashier',
        roleTitle: 'Cashier',
        employmentType: 'part_time' as any,
        hourlyRate: 16,
        hireDate: '2024-01-10',
      },
    ]);

    // Create attendance records for the past 7 days
    this.createMockAttendance();

    // Create some leave requests
    this.createMockLeaveRequests();
  }

  private createMockEmployees(tenantId: string, locationId: string, employeesData: any[]): void {
    employeesData.forEach((data, index) => {
      const employee: Employee = {
        id: `${tenantId}-emp-${this.employees.length + 1}`,
        tenantId,
        locationId,
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        email: data.email,
        departmentId: data.departmentId,
        roleTitle: data.roleTitle,
        status: 'active',
        employmentType: data.employmentType,
        baseSalary: data.baseSalary,
        hourlyRate: data.hourlyRate,
        hireDate: new Date(data.hireDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.employees.push(employee);
    });
  }

  private createMockAttendance(): void {
    const today = new Date();
    
    // Create attendance for the past 7 days for all active employees
    this.employees.filter(emp => emp.status === 'active').forEach(employee => {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const clockInTime = new Date(date);
        clockInTime.setHours(9, Math.floor(Math.random() * 30), 0); // 9:00-9:30 AM

        const clockOutTime = new Date(date);
        clockOutTime.setHours(17, Math.floor(Math.random() * 60), 0); // 5:00-6:00 PM

        const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

        const attendance: Attendance = {
          id: `${employee.tenantId}-att-${this.attendance.length + 1}`,
          tenantId: employee.tenantId,
          employeeId: employee.id,
          locationId: employee.locationId!,
          clockIn: clockInTime,
          clockOut: clockOutTime,
          date: date.toISOString().split('T')[0],
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          status: 'present',
          createdAt: clockInTime,
          updatedAt: clockOutTime,
        };

        this.attendance.push(attendance);
      }
    });
  }

  private createMockLeaveRequests(): void {
    // Create some leave requests for tenant-001
    const tenant001Employees = this.employees.filter(emp => emp.tenantId === 'tenant-001');
    
    if (tenant001Employees.length > 0) {
      // Approved leave
      this.leaveRequests.push({
        id: 'tenant-001-leave-1',
        tenantId: 'tenant-001',
        employeeId: tenant001Employees[0].id,
        leaveType: 'annual',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-05'),
        totalDays: 5,
        reason: 'Family vacation',
        status: 'approved',
        requestedAt: new Date('2026-02-01'),
        reviewedBy: tenant001Employees[4].id, // HR Manager
        reviewedAt: new Date('2026-02-02'),
        reviewNotes: 'Approved. Enjoy your vacation!',
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-02'),
      });

      // Pending leave
      this.leaveRequests.push({
        id: 'tenant-001-leave-2',
        tenantId: 'tenant-001',
        employeeId: tenant001Employees[2].id,
        leaveType: 'sick',
        startDate: new Date('2026-02-20'),
        endDate: new Date('2026-02-21'),
        totalDays: 2,
        reason: 'Medical appointment',
        status: 'pending',
        requestedAt: new Date('2026-02-13'),
        createdAt: new Date('2026-02-13'),
        updatedAt: new Date('2026-02-13'),
      });
    }

    // Create leave requests for tenant-002
    const tenant002Employees = this.employees.filter(emp => emp.tenantId === 'tenant-002');
    
    if (tenant002Employees.length > 0) {
      this.leaveRequests.push({
        id: 'tenant-002-leave-1',
        tenantId: 'tenant-002',
        employeeId: tenant002Employees[2].id,
        leaveType: 'annual',
        startDate: new Date('2026-02-25'),
        endDate: new Date('2026-02-26'),
        totalDays: 2,
        reason: 'Personal matters',
        status: 'pending',
        requestedAt: new Date('2026-02-12'),
        createdAt: new Date('2026-02-12'),
        updatedAt: new Date('2026-02-12'),
      });
    }
  }

  // Employee Management Methods
  async getEmployees(tenantId: string, locationId?: string): Promise<Employee[]> {
    let employees = this.employees.filter(emp => emp.tenantId === tenantId);
    
    if (locationId) {
      employees = employees.filter(emp => emp.locationId === locationId);
    }

    return employees;
  }

  async getEmployeeById(tenantId: string, employeeId: string): Promise<Employee | null> {
    const employee = this.employees.find(
      emp => emp.tenantId === tenantId && emp.id === employeeId,
    );
    return employee || null;
  }

  async createEmployee(tenantId: string, data: CreateEmployeeDto): Promise<Employee> {
    const employee: Employee = {
      id: `${tenantId}-emp-${this.employees.length + 1}`,
      tenantId,
      locationId: data.locationId,
      employeeCode: data.employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      departmentId: data.departmentId,
      managerId: data.managerId,
      roleTitle: data.roleTitle,
      status: 'active',
      employmentType: data.employmentType as any,
      baseSalary: data.baseSalary,
      hourlyRate: data.hourlyRate,
      hireDate: new Date(data.hireDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.employees.push(employee);
    return employee;
  }

  async updateEmployee(tenantId: string, employeeId: string, data: UpdateEmployeeDto): Promise<Employee> {
    const index = this.employees.findIndex(
      emp => emp.tenantId === tenantId && emp.id === employeeId,
    );

    if (index === -1) {
      throw new NotFoundException('Employee not found');
    }

    const employee = this.employees[index];
    const updated: Employee = {
      ...employee,
      ...data,
      fullName: data.firstName || data.lastName 
        ? `${data.firstName || employee.firstName} ${data.lastName || employee.lastName}`
        : employee.fullName,
      terminationDate: data.terminationDate ? new Date(data.terminationDate) : employee.terminationDate,
      updatedAt: new Date(),
    };

    this.employees[index] = updated;
    return updated;
  }

  async deactivateEmployee(tenantId: string, employeeId: string): Promise<Employee> {
    return this.updateEmployee(tenantId, employeeId, { status: 'inactive' as any });
  }

  // Attendance Management Methods
  async getAttendance(
    tenantId: string,
    employeeId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]> {
    let records = this.attendance.filter(att => att.tenantId === tenantId);

    if (employeeId) {
      records = records.filter(att => att.employeeId === employeeId);
    }

    if (startDate) {
      records = records.filter(att => att.date >= startDate);
    }

    if (endDate) {
      records = records.filter(att => att.date <= endDate);
    }

    return records.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime());
  }

  async clockIn(tenantId: string, employeeId: string, locationId: string): Promise<Attendance> {
    // Check if employee exists
    const employee = await this.getEmployeeById(tenantId, employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if already clocked in today
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = this.attendance.find(
      att => att.tenantId === tenantId && att.employeeId === employeeId && att.date === today && !att.clockOut,
    );

    if (existingAttendance) {
      throw new BadRequestException('Employee already clocked in today');
    }

    const attendance: Attendance = {
      id: `${tenantId}-att-${this.attendance.length + 1}`,
      tenantId,
      employeeId,
      locationId,
      clockIn: new Date(),
      date: today,
      status: 'present',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.attendance.push(attendance);
    return attendance;
  }

  async clockOut(tenantId: string, employeeId: string): Promise<Attendance> {
    const today = new Date().toISOString().split('T')[0];
    const index = this.attendance.findIndex(
      att => att.tenantId === tenantId && att.employeeId === employeeId && att.date === today && !att.clockOut,
    );

    if (index === -1) {
      throw new NotFoundException('No active clock-in found for today');
    }

    const attendance = this.attendance[index];
    const clockOutTime = new Date();
    const hoursWorked = (clockOutTime.getTime() - attendance.clockIn.getTime()) / (1000 * 60 * 60);

    const updated: Attendance = {
      ...attendance,
      clockOut: clockOutTime,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      updatedAt: clockOutTime,
    };

    this.attendance[index] = updated;
    return updated;
  }

  // Leave Management Methods
  async getLeaveRequests(tenantId: string, status?: string, employeeId?: string): Promise<LeaveRequest[]> {
    let requests = this.leaveRequests.filter(req => req.tenantId === tenantId);

    if (status) {
      requests = requests.filter(req => req.status === status);
    }

    if (employeeId) {
      requests = requests.filter(req => req.employeeId === employeeId);
    }

    return requests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async createLeaveRequest(tenantId: string, data: CreateLeaveRequestDto): Promise<LeaveRequest> {
    const request: LeaveRequest = {
      id: `${tenantId}-leave-${this.leaveRequests.length + 1}`,
      tenantId,
      employeeId: data.employeeId,
      leaveType: data.leaveType as any,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      totalDays: data.totalDays,
      reason: data.reason,
      status: 'pending',
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.leaveRequests.push(request);
    return request;
  }

  async approveLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes?: string,
  ): Promise<LeaveRequest> {
    const index = this.leaveRequests.findIndex(
      req => req.tenantId === tenantId && req.id === requestId,
    );

    if (index === -1) {
      throw new NotFoundException('Leave request not found');
    }

    const request = this.leaveRequests[index];
    const updated: LeaveRequest = {
      ...request,
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
      updatedAt: new Date(),
    };

    this.leaveRequests[index] = updated;
    return updated;
  }

  async rejectLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes: string,
  ): Promise<LeaveRequest> {
    const index = this.leaveRequests.findIndex(
      req => req.tenantId === tenantId && req.id === requestId,
    );

    if (index === -1) {
      throw new NotFoundException('Leave request not found');
    }

    const request = this.leaveRequests[index];
    const updated: LeaveRequest = {
      ...request,
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
      updatedAt: new Date(),
    };

    this.leaveRequests[index] = updated;
    return updated;
  }

  // Payroll Management Methods
  async getPayroll(tenantId: string, employeeId: string, period?: string): Promise<Payroll[]> {
    let payrolls = this.payrolls.filter(
      pay => pay.tenantId === tenantId && pay.employeeId === employeeId,
    );

    if (period) {
      payrolls = payrolls.filter(pay => pay.period === period);
    }

    return payrolls.sort((a, b) => b.period.localeCompare(a.period));
  }

  async calculatePayroll(tenantId: string, employeeId: string, period: string): Promise<Payroll> {
    const employee = await this.getEmployeeById(tenantId, employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Get attendance for the period
    const [year, month] = period.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;
    const attendanceRecords = await this.getAttendance(tenantId, employeeId, startDate, endDate);

    let grossPay = 0;
    let hoursWorked = 0;

    if (employee.baseSalary) {
      // Salaried employee
      grossPay = employee.baseSalary;
    } else if (employee.hourlyRate) {
      // Hourly employee
      hoursWorked = attendanceRecords.reduce((sum, att) => sum + (att.hoursWorked || 0), 0);
      grossPay = hoursWorked * employee.hourlyRate;
    }

    // Simple deductions (10% tax)
    const deductions = grossPay * 0.1;
    const netPay = grossPay - deductions;

    const payroll: Payroll = {
      id: `${tenantId}-payroll-${this.payrolls.length + 1}`,
      tenantId,
      employeeId,
      period,
      baseSalary: employee.baseSalary || 0,
      hoursWorked: employee.hourlyRate ? hoursWorked : undefined,
      hourlyRate: employee.hourlyRate,
      grossPay,
      deductions,
      netPay,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.payrolls.push(payroll);
    return payroll;
  }
}
