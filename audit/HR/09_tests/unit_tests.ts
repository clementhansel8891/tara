import { Test, TestingModule } from '@nestjs/testing';
import { HRService } from '../hr.service';
import { IHRRepository } from '../repositories/hr.repository.interface';
import { AuditService } from '../../../shared/audit/audit.service';
import { EventBusService } from '../../../shared/events/event-bus.service';
import { LoggerService } from '../../../shared/logger/logger.service';

describe('HRService (Audit Unit Test)', () => {
  let service: HRService;
  let repo: jest.Mocked<IHRRepository>;
  let audit: jest.Mocked<AuditService>;
  let events: jest.Mocked<EventBusService>;

  const TENANT_ID = 'test-tenant-uuid';
  const ACTOR_ID = 'admin-user-uuid';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HRService,
        {
          provide: IHRRepository,
          useValue: {
            createEmployee: jest.fn(),
            getEmployeeById: jest.fn(),
            updateEmployee: jest.fn(),
            deactivateEmployee: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: EventBusService,
          useValue: { publish: jest.fn() },
        },
        {
          provide: LoggerService,
          useValue: { log: jest.fn() },
        },
        {
          provide: 'FileProcessingService',
          useValue: {},
        }
      ],
    }).compile();

    service = module.get<HRService>(HRService);
    repo = module.get(IHRRepository);
    audit = module.get(AuditService);
    events = module.get(EventBusService);
  });

  it('SHOULD log audit and publish event when employee is created', async () => {
    const dto = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } as any;
    const mockEmployee = { id: 'emp-1', ...dto };
    repo.createEmployee.mockResolvedValue(mockEmployee);

    await service.createEmployee(TENANT_ID, dto, ACTOR_ID);

    expect(repo.createEmployee).toHaveBeenCalledWith(TENANT_ID, dto);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'CREATE',
      entityType: 'EMPLOYEE',
      tenantId: TENANT_ID,
    }));
    expect(events.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'HR.EMPLOYEE_CREATED',
      tenantId: TENANT_ID,
    }));
  });

  it('SHOULD capture beforeState when updating employee', async () => {
    const empId = 'emp-1';
    const beforeState = { id: empId, firstName: 'John' };
    const updates = { firstName: 'Johnny' };
    const afterState = { ...beforeState, ...updates };

    repo.getEmployeeById.mockResolvedValue(beforeState as any);
    repo.updateEmployee.mockResolvedValue(afterState as any);

    await service.updateEmployee(TENANT_ID, empId, updates as any, ACTOR_ID);

    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'UPDATE',
      beforeState,
      afterState,
    }));
  });

  it('SHOULD soft-delete employee on deactivation', async () => {
    const empId = 'emp-1';
    repo.deactivateEmployee.mockResolvedValue({ id: empId, status: 'terminated' } as any);

    await service.deactivateEmployee(TENANT_ID, empId, ACTOR_ID);

    expect(repo.deactivateEmployee).toHaveBeenCalledWith(TENANT_ID, empId);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'DEACTIVATE' }));
  });
});
