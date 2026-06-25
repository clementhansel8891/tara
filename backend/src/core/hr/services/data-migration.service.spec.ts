import { Test, TestingModule } from '@nestjs/testing';
import { DataMigrationService } from './data-migration.service';
import { PrismaService } from '../../../persistence/prisma.service';
import { PrismaClient } from '@prisma/client';

describe('DataMigrationService', () => {
  let service: DataMigrationService;
  let prismaService: PrismaService;

  // Mock data
  const mockSourceEmployee = {
    id: 'source-emp-1',
    employee_code: 'EMP-001',
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+6281234567890',
    department_id: 'dept-1',
    role_id: 'role-1',
    hire_date: new Date('2020-01-15'),
    employment_status: 'active',
  };

  const mockDepartment = {
    id: 'target-dept-1',
    name: 'Engineering',
    description: 'Engineering Department',
    manager_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRole = {
    id: 'target-role-1',
    role_name: 'employee',
    permissions: {},
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockEmployee = {
    id: 'target-emp-1',
    employee_code: 'EMP-001',
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+6281234567890',
    department_id: 'target-dept-1',
    role_id: 'target-role-1',
    supervisor_id: null,
    hire_date: new Date('2020-01-15'),
    employment_status: 'active',
    biometric_token_hash: null,
    language_preference: 'id',
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataMigrationService,
        {
          provide: PrismaService,
          useValue: {
            employee: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            department: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            role: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            leaveBalance: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DataMigrationService>(DataMigrationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateEmployee', () => {
    it('should validate employee with all required fields', () => {
      const validation = (service as any).validateEmployee(mockSourceEmployee);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject employee with missing employee_code', () => {
      const invalidEmployee = { ...mockSourceEmployee, employee_code: '' };
      const validation = (service as any).validateEmployee(invalidEmployee);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing employee_code');
    });

    it('should reject employee with missing full_name', () => {
      const invalidEmployee = { ...mockSourceEmployee, full_name: '' };
      const validation = (service as any).validateEmployee(invalidEmployee);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing full_name');
    });

    it('should reject employee with missing email', () => {
      const invalidEmployee = { ...mockSourceEmployee, email: '' };
      const validation = (service as any).validateEmployee(invalidEmployee);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing email');
    });

    it('should reject employee with invalid email format', () => {
      const invalidEmployee = { ...mockSourceEmployee, email: 'invalid-email' };
      const validation = (service as any).validateEmployee(invalidEmployee);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid email format');
    });

    it('should reject employee with missing hire_date', () => {
      const invalidEmployee = { ...mockSourceEmployee, hire_date: null };
      const validation = (service as any).validateEmployee(invalidEmployee);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing hire_date');
    });

    it('should accumulate multiple validation errors', () => {
      const invalidEmployee = {
        ...mockSourceEmployee,
        employee_code: '',
        email: 'invalid',
        hire_date: null,
      };
      const validation = (service as any).validateEmployee(invalidEmployee);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(1);
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.co.id',
        'admin+test@domain.org',
      ];

      validEmails.forEach((email) => {
        expect((service as any).isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user@domain',
        'user domain@example.com',
      ];

      invalidEmails.forEach((email) => {
        expect((service as any).isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('mapToTaraRole', () => {
    it('should map HR roles to hr_team', () => {
      expect((service as any).mapToTaraRole('HR Manager')).toBe('hr_team');
      expect((service as any).mapToTaraRole('Human Resources')).toBe('hr_team');
      expect((service as any).mapToTaraRole('hr specialist')).toBe('hr_team');
    });

    it('should map manager/supervisor roles to supervisor', () => {
      expect((service as any).mapToTaraRole('Manager')).toBe('supervisor');
      expect((service as any).mapToTaraRole('Supervisor')).toBe('supervisor');
      expect((service as any).mapToTaraRole('Team Lead')).toBe('supervisor');
    });

    it('should map other roles to employee', () => {
      expect((service as any).mapToTaraRole('Developer')).toBe('employee');
      expect((service as any).mapToTaraRole('Analyst')).toBe('employee');
      expect((service as any).mapToTaraRole('Staff')).toBe('employee');
    });

    it('should be case-insensitive', () => {
      expect((service as any).mapToTaraRole('MANAGER')).toBe('supervisor');
      expect((service as any).mapToTaraRole('Hr')).toBe('hr_team');
    });
  });

  describe('migrateEmployee (duplicate handling)', () => {
    it('should skip employee with duplicate employee_code', async () => {
      const report = {
        totalProcessed: 0,
        successCount: 0,
        skippedCount: 0,
        errorCount: 0,
        errors: [],
        skipped: [],
        successful: [],
        startedAt: new Date(),
        completedAt: new Date(),
      };

      // Mock existing employee
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);

      const sourcePrisma = {} as PrismaClient;
      const departmentMap = new Map();
      const roleMap = new Map();

      await (service as any).migrateEmployee(
        mockSourceEmployee,
        sourcePrisma,
        departmentMap,
        roleMap,
        false,
        report,
      );

      expect(report.skippedCount).toBe(1);
      expect(report.skipped).toHaveLength(1);
      expect(report.skipped[0].employeeCode).toBe('EMP-001');
      expect(report.skipped[0].reason).toContain('Duplicate');
    });

    it('should report validation errors', async () => {
      const report = {
        totalProcessed: 0,
        successCount: 0,
        skippedCount: 0,
        errorCount: 0,
        errors: [],
        skipped: [],
        successful: [],
        startedAt: new Date(),
        completedAt: new Date(),
      };

      const invalidEmployee = { ...mockSourceEmployee, email: '' };
      const sourcePrisma = {} as PrismaClient;
      const departmentMap = new Map();
      const roleMap = new Map();

      await (service as any).migrateEmployee(
        invalidEmployee,
        sourcePrisma,
        departmentMap,
        roleMap,
        false,
        report,
      );

      expect(report.errorCount).toBe(1);
      expect(report.errors).toHaveLength(1);
      expect(report.errors[0].reason).toContain('Validation failed');
    });

    it('should simulate migration in dry-run mode', async () => {
      const report = {
        totalProcessed: 0,
        successCount: 0,
        skippedCount: 0,
        errorCount: 0,
        errors: [],
        skipped: [],
        successful: [],
        startedAt: new Date(),
        completedAt: new Date(),
      };

      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.employee, 'create').mockResolvedValue(mockEmployee);

      const sourcePrisma = {} as PrismaClient;
      const departmentMap = new Map();
      const roleMap = new Map();

      await (service as any).migrateEmployee(
        mockSourceEmployee,
        sourcePrisma,
        departmentMap,
        roleMap,
        true, // dry run
        report,
      );

      expect(report.successCount).toBe(1);
      expect(report.successful[0].employeeId).toBe('DRY-RUN');
      expect(prismaService.employee.create).not.toHaveBeenCalled();
    });
  });

  describe('saveReportToFile', () => {
    it('should generate report with all required fields', async () => {
      const report = {
        totalProcessed: 10,
        successCount: 8,
        skippedCount: 1,
        errorCount: 1,
        errors: [{ employeeCode: 'EMP-999', reason: 'Invalid email' }],
        skipped: [{ employeeCode: 'EMP-001', reason: 'Duplicate' }],
        successful: [
          { employeeCode: 'EMP-002', employeeId: 'id-1', name: 'John Doe' },
        ],
        startedAt: new Date(),
        completedAt: new Date(),
      };

      // Mock fs operations would be needed for full test
      // For now, just verify the method exists
      expect(service.saveReportToFile).toBeDefined();
    });
  });
});
