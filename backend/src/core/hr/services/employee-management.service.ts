// @ts-nocheck
import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from './event-bus.service';
import { Employee } from '../entities/employee.entity';
import { CacheAsideService } from '../../../shared/cache/cache-aside.service';

/**
 * Employee Management Service
 * Handles CRUD operations for Employee records with validation and audit logging
 * 
 * Requirements:
 * - 20.1: Employee management with CRUD operations
 * - 20.2: Employee creation with validation (unique email, employee_code)
 * - 20.3: Employee profile update with audit logging
 * - Employee search and filtering by department, role, status
 */

export interface CreateEmployeeDto {
  tenant_id: string;
  location_id: string;
  department_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employee_code: string;
  positions: string;
  employment_type?: 'full_time' | 'part_time' | 'contractor' | 'intern' | 'temporary';
  base_salary?: number;
  hourly_rate?: number;
  hire_date: Date;
  status?: string;
  manager_id?: string;
  tara_role_id?: string;
  job_role_id?: string;
  company_id?: string;
}

export interface UpdateEmployeeDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department_id?: string;
  positions?: string;
  employment_type?: 'full_time' | 'part_time' | 'contractor' | 'intern' | 'temporary';
  base_salary?: number;
  hourly_rate?: number;
  status?: string;
  manager_id?: string;
  tara_role_id?: string;
  job_role_id?: string;
  termination_date?: Date;
}

export interface EmployeeSearchFilters {
  tenant_id: string;
  department_id?: string;
  tara_role_id?: string;
  status?: string;
  employment_type?: string;
  search?: string; // Search by name, email, or employee_code
  page?: number;
  limit?: number;
}

@Injectable()
export class EmployeeManagementService {
  private readonly logger = new Logger(EmployeeManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly cacheAside: CacheAsideService,
  ) {}

  /**
   * Create a new employee with validation
   * 
   * Requirements:
   * - 20.1: Employee CRUD operations
   * - 20.2: Validation for unique email and employee_code
   * 
   * @param data Employee creation data
   * @param created_by User ID of the person creating the employee
   * @returns Created employee record
   * @throws ConflictException if email or employee_code already exists
   * @throws BadRequestException if required fields are missing
   */
  async createEmployee(data: CreateEmployeeDto, created_by?: string): Promise<any> {
    this.logger.log(`Creating employee: ${data.email}`);

    // Validate required fields
    if (!data.first_name || !data.last_name || !data.email || !data.employee_code) {
      throw new BadRequestException('Missing required fields: first_name, last_name, email, employee_code');
    }

    // Check for unique email within tenant
    const existingEmail = await this.prisma.employee.findFirst({
      where: {
        tenant_id: data.tenant_id,
        email: data.email,
        deleted_at: null,
      },
    });

    if (existingEmail) {
      throw new ConflictException(`Email ${data.email} already exists for this tenant`);
    }

    // Check for unique employee_code within tenant
    const existingCode = await this.prisma.employee.findFirst({
      where: {
        tenant_id: data.tenant_id,
        employee_code: data.employee_code,
        deleted_at: null,
      },
    });

    if (existingCode) {
      throw new ConflictException(`Employee code ${data.employee_code} already exists for this tenant`);
    }

    // Create employee record
    const employee = await this.prisma.employee.create({
      data: {
        tenant_id: data.tenant_id,
        location_id: data.location_id,
        department_id: data.department_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        employee_code: data.employee_code,
        positions: data.positions,
        employment_type: data.employment_type || 'full_time',
        base_salary: data.base_salary,
        hourly_rate: data.hourly_rate,
        hire_date: data.hire_date,
        status: data.status || 'active',
        manager_id: data.manager_id,
        tara_role_id: data.tara_role_id,
        job_role_id: data.job_role_id,
        company_id: data.company_id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        departments: true,
        tara_roles: true,
        locations: true,
      },
    });

    // Emit employee creation event
    await this.eventBus.publish({
      event_type: 'hr.employee.created',
      tenant_id: data.tenant_id,
      entity_id: employee.id,
      entity_type: 'Employee',
      source_module: 'HR',
      event_reference_id: `employee-created-${employee.id}`,
      payload: {
        employee_id: employee.id,
        employee_code: employee.employee_code,
        full_name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        department_id: employee.department_id,
        status: employee.status,
        hire_date: employee.hire_date.toISOString(),
        created_by: created_by,
      },
    });

    this.logger.log(`Employee created successfully: ${employee.id}`);

    return employee;
  }

  /**
   * Update an employee profile with audit logging
   * 
   * Requirements:
   * - 20.1: Employee CRUD operations
   * - 20.3: Employee profile update with audit logging
   * 
   * @param employee_id Employee ID to update
   * @param tenant_id Tenant ID for verification
   * @param data Update data
   * @param updated_by User ID of the person updating the employee
   * @returns Updated employee record
   * @throws NotFoundException if employee doesn't exist
   * @throws ConflictException if email already exists (when changing email)
   */
  async updateEmployee(
    employee_id: string,
    tenant_id: string,
    data: UpdateEmployeeDto,
    updated_by?: string,
  ): Promise<any> {
    // Self-edit guard (Requirements 30.10): Employees (including HR_Team) cannot
    // modify their own department_id or role-related fields (positions, tara_role_id, job_role_id).
    // Such changes require a system administrator.
    if (updated_by && updated_by === employee_id && (data.department_id !== undefined || data.positions !== undefined || data.tara_role_id !== undefined || data.job_role_id !== undefined)) {
      throw new BadRequestException(
        `Self-editing of department or role is not permitted. Changes to your own department or role require a system administrator.`,
      );
    }

    this.logger.log(`Updating employee: ${employee_id}`);

    // Verify employee exists
    const existing = await this.prisma.employee.findFirst({
      where: {
        id: employee_id,
        tenant_id: tenant_id,
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Employee ${employee_id} not found`);
    }

    // If email is being changed, check for uniqueness
    if (data.email && data.email !== existing.email) {
      const emailExists = await this.prisma.employee.findFirst({
        where: {
          tenant_id: tenant_id,
          email: data.email,
          id: { not: employee_id },
          deleted_at: null,
        },
      });

      if (emailExists) {
        throw new ConflictException(`Email ${data.email} already exists for this tenant`);
      }
    }

    // Track changes for audit log
    const changes: Record<string, { old: any; new: any }> = {};
    Object.keys(data).forEach((key) => {
      const oldValue = (existing as any)[key];
      const newValue = (data as any)[key];
      if (oldValue !== newValue) {
        changes[key] = { old: oldValue, new: newValue };
      }
    });

    // Update employee record
    const employee = await this.prisma.employee.update({
      where: { id: employee_id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        departments: true,
        tara_roles: true,
        locations: true,
      },
    });

    // Emit employee update event with changes
    await this.eventBus.publish({
      event_type: 'hr.employee.updated',
      tenant_id: tenant_id,
      entity_id: employee.id,
      entity_type: 'Employee',
      source_module: 'HR',
      event_reference_id: `employee-updated-${employee.id}`,
      payload: {
        employee_id: employee.id,
        employee_code: employee.employee_code,
        full_name: `${employee.first_name} ${employee.last_name}`,
        changes: changes,
        updated_by: updated_by,
      },
    });

    // Log audit trail (Requirement 20.3: audit logging)
    // Note: The event bus emission serves as the audit log
    // Additional audit_log table entry could be added here if needed

    this.logger.log(`Employee updated successfully: ${employee.id}, Changes: ${Object.keys(changes).join(', ')}`);

    // Invalidate cached employee profile after update
    await this.cacheAside.invalidate(CacheAsideService.employeeProfileKey(employee_id));

    return employee;
  }

  /**
   * Get employee by ID
   * 
   * @param employee_id Employee ID
   * @param tenant_id Tenant ID for verification
   * @returns Employee record
   * @throws NotFoundException if employee doesn't exist
   */
  async getEmployeeById(employee_id: string, tenant_id: string): Promise<any> {
    const cacheKey = CacheAsideService.employeeProfileKey(employee_id);

    const employee = await this.cacheAside.getOrSet(
      cacheKey,
      () =>
        this.prisma.employee.findFirst({
          where: {
            id: employee_id,
            tenant_id: tenant_id,
            deleted_at: null,
          },
          include: {
            departments: true,
            tara_roles: true,
            locations: true,
            job_roles: true,
          },
        }),
      CacheAsideService.EMPLOYEE_PROFILE_TTL,
    );

    if (!employee) {
      throw new NotFoundException(`Employee ${employee_id} not found`);
    }

    return employee;
  }

  /**
   * Search and filter employees
   * 
   * Requirements:
   * - 20.1: Employee search and filtering by department, role, status
   * 
   * @param filters Search filters
   * @returns Paginated list of employees
   */
  async searchEmployees(filters: EmployeeSearchFilters): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenant_id: filters.tenant_id,
      deleted_at: null,
    };

    if (filters.department_id) {
      where.department_id = filters.department_id;
    }

    if (filters.tara_role_id) {
      where.tara_role_id = filters.tara_role_id;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.employment_type) {
      where.employment_type = filters.employment_type;
    }

    // Search by name, email, or employee_code
    if (filters.search) {
      where.OR = [
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { employee_code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    this.logger.debug(`Searching employees with filters: ${JSON.stringify(filters)}`);

    // Get total count
    const total = await this.prisma.employee.count({ where });

    // Get paginated results
    const employees = await this.prisma.employee.findMany({
      where,
      skip,
      take: limit,
      include: {
        departments: {
          select: {
            id: true,
            department_name: true,
          },
        },
        tara_roles: {
          select: {
            id: true,
            role_name: true,
          },
        },
        locations: {
          select: {
            id: true,
            location_name: true,
          },
        },
      },
      orderBy: [
        { last_name: 'asc' },
        { first_name: 'asc' },
      ],
    });

    return {
      data: employees,
      total,
      page,
      limit,
    };
  }

  /**
   * Delete (soft delete) an employee
   * 
   * @param employee_id Employee ID
   * @param tenant_id Tenant ID for verification
   * @param deleted_by User ID of the person deleting the employee
   * @returns Deleted employee record
   * @throws NotFoundException if employee doesn't exist
   */
  async deleteEmployee(employee_id: string, tenant_id: string, deleted_by?: string): Promise<any> {
    this.logger.log(`Soft deleting employee: ${employee_id}`);

    // Verify employee exists
    const existing = await this.prisma.employee.findFirst({
      where: {
        id: employee_id,
        tenant_id: tenant_id,
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Employee ${employee_id} not found`);
    }

    // Soft delete (set deleted_at timestamp)
    const employee = await this.prisma.employee.update({
      where: { id: employee_id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Emit employee deletion event
    await this.eventBus.publish({
      event_type: 'hr.employee.deleted',
      tenant_id: tenant_id,
      entity_id: employee.id,
      entity_type: 'Employee',
      source_module: 'HR',
      event_reference_id: `employee-deleted-${employee.id}`,
      payload: {
        employee_id: employee.id,
        employee_code: employee.employee_code,
        full_name: `${employee.first_name} ${employee.last_name}`,
        deleted_by: deleted_by,
      },
    });

    this.logger.log(`Employee soft deleted successfully: ${employee.id}`);

    return employee;
  }

  /**
   * Get employees by department
   * 
   * @param department_id Department ID
   * @param tenant_id Tenant ID
   * @returns List of employees in the department
   */
  async getEmployeesByDepartment(department_id: string, tenant_id: string): Promise<any[]> {
    return this.prisma.employee.findMany({
      where: {
        department_id: department_id,
        tenant_id: tenant_id,
        deleted_at: null,
      },
      include: {
        tara_roles: {
          select: {
            id: true,
            role_name: true,
          },
        },
      },
      orderBy: [
        { last_name: 'asc' },
        { first_name: 'asc' },
      ],
    });
  }

  /**
   * Get employees by role
   * 
   * @param tara_role_id TARA Role ID
   * @param tenant_id Tenant ID
   * @returns List of employees with the role
   */
  async getEmployeesByRole(tara_role_id: string, tenant_id: string): Promise<any[]> {
    return this.prisma.employee.findMany({
      where: {
        tara_role_id: tara_role_id,
        tenant_id: tenant_id,
        deleted_at: null,
      },
      include: {
        departments: {
          select: {
            id: true,
            department_name: true,
          },
        },
      },
      orderBy: [
        { last_name: 'asc' },
        { first_name: 'asc' },
      ],
    });
  }

  /**
   * Get employees by status
   * 
   * @param status Employment status
   * @param tenant_id Tenant ID
   * @returns List of employees with the status
   */
  async getEmployeesByStatus(status: string, tenant_id: string): Promise<any[]> {
    return this.prisma.employee.findMany({
      where: {
        status: status,
        tenant_id: tenant_id,
        deleted_at: null,
      },
      include: {
        departments: {
          select: {
            id: true,
            department_name: true,
          },
        },
        tara_roles: {
          select: {
            id: true,
            role_name: true,
          },
        },
      },
      orderBy: [
        { last_name: 'asc' },
        { first_name: 'asc' },
      ],
    });
  }

  /**
   * Bulk create employees (useful for migration)
   * 
   * @param employees Array of employee data
   * @param tenant_id Tenant ID
   * @param created_by User ID of the person creating the employees
   * @returns Array of created employees
   */
  async bulkCreateEmployees(
    employees: CreateEmployeeDto[],
    tenant_id: string,
    created_by?: string,
  ): Promise<{ created: any[]; errors: Array<{ data: CreateEmployeeDto; error: string }> }> {
    const created: any[] = [];
    const errors: Array<{ data: CreateEmployeeDto; error: string }> = [];

    this.logger.log(`Bulk creating ${employees.length} employees`);

    for (const employeeData of employees) {
      try {
        const employee = await this.createEmployee(employeeData, created_by);
        created.push(employee);
      } catch (error) {
        this.logger.error(`Failed to create employee ${employeeData.email}: ${error.message}`);
        errors.push({
          data: employeeData,
          error: error.message,
        });
      }
    }

    this.logger.log(`Bulk creation completed: ${created.length} successful, ${errors.length} failed`);

    return { created, errors };
  }
}
