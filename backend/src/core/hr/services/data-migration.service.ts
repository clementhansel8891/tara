import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../persistence/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MigrationOptions {
  sourceDbUrl: string;
  dryRun: boolean;
}

export interface MigrationReport {
  totalProcessed: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{ employeeCode?: string; reason: string; details?: any }>;
  skipped: Array<{ employeeCode: string; reason: string }>;
  successful: Array<{ employeeCode: string; employeeId: string; name: string }>;
  startedAt: Date;
  completedAt: Date;
}

interface SourceEmployee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  department_name?: string;
  role_id?: string;
  role_name?: string;
  hire_date: Date;
  employment_status?: string;
}

interface SourceLeaveBalance {
  employee_id: string;
  year: number;
  total_entitlement: number;
  used_days: number;
  remaining_days: number;
}

/**
 * Data Migration Service
 * Handles migration of employee data from project-hug database to TARA
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.6, 20.7, 20.8
 */
@Injectable()
export class DataMigrationService {
  private readonly logger = new Logger(DataMigrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Migrate employees from source database to TARA
   * Requirements: 20.1, 20.2, 20.3
   */
  async migrateEmployees(options: MigrationOptions): Promise<MigrationReport> {
    const startedAt = new Date();
    let sourcePrisma: PrismaClient | null = null;

    const report: MigrationReport = {
      totalProcessed: 0,
      successCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      skipped: [],
      successful: [],
      startedAt,
      completedAt: new Date(),
    };

    try {
      // Connect to source database
      sourcePrisma = new PrismaClient({
        datasources: {
          db: {
            url: options.sourceDbUrl,
          },
        },
      });

      await sourcePrisma.$connect();
      this.logger.log('Connected to source database');

      // Fetch employees from source database
      const sourceEmployees = await this.fetchSourceEmployees(sourcePrisma);
      this.logger.log(`Found ${sourceEmployees.length} employees in source database`);

      report.totalProcessed = sourceEmployees.length;

      // Map departments and roles first
      const departmentMap = await this.mapDepartments(sourcePrisma, options.dryRun);
      const roleMap = await this.mapRoles(sourcePrisma, options.dryRun);

      // Process each employee
      for (const sourceEmployee of sourceEmployees) {
        try {
          await this.migrateEmployee(
            sourceEmployee,
            sourcePrisma,
            departmentMap,
            roleMap,
            options.dryRun,
            report,
          );
        } catch (error) {
          this.logger.error(`Failed to migrate employee ${sourceEmployee.employee_code}:`, error);
          report.errorCount++;
          report.errors.push({
            employeeCode: sourceEmployee.employee_code,
            reason: error.message || 'Unknown error',
            details: error,
          });
        }
      }

      report.completedAt = new Date();
      this.logger.log('Migration completed');

      return report;
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    } finally {
      if (sourcePrisma) {
        await sourcePrisma.$disconnect();
        this.logger.log('Disconnected from source database');
      }
    }
  }

  /**
   * Fetch employees from source database
   * Attempts to query employees table with common schema structures
   */
  private async fetchSourceEmployees(sourcePrisma: PrismaClient): Promise<SourceEmployee[]> {
    try {
      // Try to fetch from employees table with department and role joins
      const employees = await sourcePrisma.$queryRawUnsafe<SourceEmployee[]>(`
        SELECT 
          e.id,
          e.employee_code,
          e.full_name,
          e.email,
          e.phone,
          e.department_id,
          d.name as department_name,
          e.role_id,
          r.role_name,
          e.hire_date,
          e.employment_status
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN roles r ON e.role_id = r.id
        WHERE e.employment_status != 'terminated' OR e.employment_status IS NULL
        ORDER BY e.created_at ASC
      `);

      return employees;
    } catch (error) {
      this.logger.warn('Failed to fetch with full query, trying simplified query:', error.message);
      
      // Fallback to simpler query
      try {
        const employees = await sourcePrisma.$queryRawUnsafe<SourceEmployee[]>(`
          SELECT 
            id,
            employee_code,
            full_name,
            email,
            phone,
            department_id,
            role_id,
            hire_date,
            employment_status
          FROM employees
          WHERE employment_status != 'terminated' OR employment_status IS NULL
        `);
        
        return employees;
      } catch (fallbackError) {
        this.logger.error('Failed to fetch employees:', fallbackError);
        throw new Error('Could not fetch employees from source database');
      }
    }
  }

  /**
   * Map departments from source to target
   * Requirements: 20.4
   */
  private async mapDepartments(
    sourcePrisma: PrismaClient,
    dryRun: boolean,
  ): Promise<Map<string, string>> {
    const departmentMap = new Map<string, string>();

    try {
      const sourceDepartments = await sourcePrisma.$queryRawUnsafe<any[]>(`
        SELECT id, name, description FROM departments
      `);

      for (const sourceDept of sourceDepartments) {
        // Check if department exists in target
        let targetDept = await this.prisma.department.findFirst({
          where: { name: sourceDept.name },
        });

        if (!targetDept && !dryRun) {
          // Create department in target
          targetDept = await this.prisma.department.create({
            data: {
              name: sourceDept.name,
              description: sourceDept.description || null,
            },
          });
          this.logger.log(`Created department: ${sourceDept.name}`);
        }

        if (targetDept) {
          departmentMap.set(sourceDept.id, targetDept.id);
        }
      }

      this.logger.log(`Mapped ${departmentMap.size} departments`);
    } catch (error) {
      this.logger.warn('Failed to map departments:', error.message);
    }

    return departmentMap;
  }

  /**
   * Map roles from source to target
   * Requirements: 20.5
   */
  private async mapRoles(
    sourcePrisma: PrismaClient,
    dryRun: boolean,
  ): Promise<Map<string, string>> {
    const roleMap = new Map<string, string>();

    try {
      const sourceRoles = await sourcePrisma.$queryRawUnsafe<any[]>(`
        SELECT id, role_name, permissions FROM roles
      `);

      for (const sourceRole of sourceRoles) {
        // Map source role to TARA role (Employee, Supervisor, HR_Team)
        const taraRoleName = this.mapToTaraRole(sourceRole.role_name);

        // Check if role exists in target
        let targetRole = await this.prisma.role.findFirst({
          where: { role_name: taraRoleName },
        });

        if (!targetRole && !dryRun) {
          // Create role in target
          targetRole = await this.prisma.role.create({
            data: {
              role_name: taraRoleName,
              permissions: sourceRole.permissions || {},
            },
          });
          this.logger.log(`Created role: ${taraRoleName}`);
        }

        if (targetRole) {
          roleMap.set(sourceRole.id, targetRole.id);
        }
      }

      this.logger.log(`Mapped ${roleMap.size} roles`);
    } catch (error) {
      this.logger.warn('Failed to map roles:', error.message);
    }

    return roleMap;
  }

  /**
   * Map source role name to TARA role
   * Requirements: 20.5
   */
  private mapToTaraRole(sourceRoleName: string): string {
    const normalized = sourceRoleName.toLowerCase();

    if (normalized.includes('hr') || normalized.includes('human resource')) {
      return 'hr_team';
    } else if (
      normalized.includes('manager') ||
      normalized.includes('supervisor') ||
      normalized.includes('lead')
    ) {
      return 'supervisor';
    } else {
      return 'employee';
    }
  }

  /**
   * Migrate single employee
   * Requirements: 20.2, 20.3, 20.6, 20.7
   */
  private async migrateEmployee(
    sourceEmployee: SourceEmployee,
    sourcePrisma: PrismaClient,
    departmentMap: Map<string, string>,
    roleMap: Map<string, string>,
    dryRun: boolean,
    report: MigrationReport,
  ): Promise<void> {
    // Validate required fields
    // Requirement 20.3: Validate imported data and report invalid/missing fields
    const validation = this.validateEmployee(sourceEmployee);
    if (!validation.isValid) {
      report.errorCount++;
      report.errors.push({
        employeeCode: sourceEmployee.employee_code,
        reason: `Validation failed: ${validation.errors.join(', ')}`,
      });
      return;
    }

    // Check for duplicate
    // Requirement 20.6: Handle duplicate employee IDs by skipping and logging
    const existing = await this.prisma.employee.findFirst({
      where: {
        OR: [
          { employee_code: sourceEmployee.employee_code },
          { email: sourceEmployee.email },
        ],
      },
    });

    if (existing) {
      report.skippedCount++;
      report.skipped.push({
        employeeCode: sourceEmployee.employee_code,
        reason: 'Duplicate employee_code or email already exists in target database',
      });
      this.logger.debug(`Skipped duplicate: ${sourceEmployee.employee_code}`);
      return;
    }

    if (dryRun) {
      report.successCount++;
      report.successful.push({
        employeeCode: sourceEmployee.employee_code,
        employeeId: 'DRY-RUN',
        name: sourceEmployee.full_name,
      });
      this.logger.debug(`[DRY RUN] Would migrate: ${sourceEmployee.employee_code}`);
      return;
    }

    // Map department and role
    const targetDepartmentId = sourceEmployee.department_id
      ? departmentMap.get(sourceEmployee.department_id)
      : null;
    const targetRoleId = sourceEmployee.role_id ? roleMap.get(sourceEmployee.role_id) : null;

    // Create employee in target database
    // Requirement 20.2: Import employee ID, name, department, role, email, hire date
    const newEmployee = await this.prisma.employee.create({
      data: {
        employee_code: sourceEmployee.employee_code,
        full_name: sourceEmployee.full_name,
        email: sourceEmployee.email,
        phone: sourceEmployee.phone || null,
        department_id: targetDepartmentId || null,
        role_id: targetRoleId || null,
        hire_date: sourceEmployee.hire_date,
        employment_status: sourceEmployee.employment_status || 'active',
        language_preference: 'id', // Default to Indonesian
      },
    });

    // Migrate leave balance
    // Requirement 20.2: Import current leave balance
    await this.migrateLeaveBalance(sourcePrisma, sourceEmployee.id, newEmployee.id);

    report.successCount++;
    report.successful.push({
      employeeCode: newEmployee.employee_code,
      employeeId: newEmployee.id,
      name: newEmployee.full_name,
    });

    this.logger.log(
      `Migrated employee: ${newEmployee.employee_code} - ${newEmployee.full_name}`,
    );
  }

  /**
   * Validate employee data
   * Requirements: 20.3
   */
  private validateEmployee(employee: SourceEmployee): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!employee.employee_code || employee.employee_code.trim() === '') {
      errors.push('Missing employee_code');
    }

    if (!employee.full_name || employee.full_name.trim() === '') {
      errors.push('Missing full_name');
    }

    if (!employee.email || employee.email.trim() === '') {
      errors.push('Missing email');
    } else if (!this.isValidEmail(employee.email)) {
      errors.push('Invalid email format');
    }

    if (!employee.hire_date) {
      errors.push('Missing hire_date');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Migrate leave balance for employee
   * Requirements: 20.2
   */
  private async migrateLeaveBalance(
    sourcePrisma: PrismaClient,
    sourceEmployeeId: string,
    targetEmployeeId: string,
  ): Promise<void> {
    try {
      const sourceBalance = await sourcePrisma.$queryRawUnsafe<SourceLeaveBalance[]>(
        `
        SELECT 
          employee_id,
          year,
          total_entitlement,
          used_days,
          remaining_days
        FROM leave_balances
        WHERE employee_id = $1
        ORDER BY year DESC
        LIMIT 1
      `,
        sourceEmployeeId,
      );

      if (sourceBalance && sourceBalance.length > 0) {
        const balance = sourceBalance[0];
        
        await this.prisma.leaveBalance.create({
          data: {
            employee_id: targetEmployeeId,
            year: balance.year,
            total_entitlement: balance.total_entitlement,
            used_days: balance.used_days,
            remaining_days: balance.remaining_days,
          },
        });

        this.logger.debug(`Migrated leave balance for employee: ${targetEmployeeId}`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to migrate leave balance for employee ${sourceEmployeeId}:`,
        error.message,
      );
      // Don't fail the entire migration if leave balance migration fails
    }
  }

  /**
   * Save migration report to file
   * Requirements: 20.7, 20.8
   */
  async saveReportToFile(report: MigrationReport): Promise<string> {
    const reportDir = path.join(process.cwd(), 'migration-reports');
    
    try {
      await fs.mkdir(reportDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const timestamp = report.startedAt.toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `employee-migration-${timestamp}.json`);

    const reportContent = {
      ...report,
      summary: {
        totalProcessed: report.totalProcessed,
        successCount: report.successCount,
        skippedCount: report.skippedCount,
        errorCount: report.errorCount,
      },
      duration: `${(report.completedAt.getTime() - report.startedAt.getTime()) / 1000}s`,
    };

    await fs.writeFile(reportPath, JSON.stringify(reportContent, null, 2), 'utf-8');

    return reportPath;
  }
}
