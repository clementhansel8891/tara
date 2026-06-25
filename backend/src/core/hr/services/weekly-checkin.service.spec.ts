import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { WeeklyCheckinService } from './weekly-checkin.service';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from './event-bus.service';

/**
 * Unit tests for WeeklyCheckinService (Task 15.1 / 15.4)
 *
 * Covers Requirements:
 * - 4.2: Store check-in responses with Employee ID and submission timestamp
 * - 4.5: Capture accomplishments, challenges, and next week's goals
 * - 9.6: Emit a structured event for every weekly check-in submission
 *
 * The service is constructed directly with mocked dependencies (rather than via
 * the Nest testing module) because the vitest transform does not emit the
 * decorator metadata Nest's DI relies on, which would leave injected providers
 * undefined. Direct construction is the established pattern across the HR
 * service specs in this package.
 */
describe('WeeklyCheckinService', () => {
  let service: WeeklyCheckinService;
  let prismaService: any;
  let eventBusService: any;

  const mockEmployeeId = 'employee-123';
  const mockEmployee = {
    id: mockEmployeeId,
    full_name: 'Budi Santoso',
    department_id: 'dept-1',
  };

  // Friday 2024-06-07 with a time component to verify normalization
  const weekStart = new Date('2024-06-03T10:30:00.000Z');

  const buildCheckin = (overrides: Partial<any> = {}) => ({
    id: 'checkin-1',
    employee_id: mockEmployeeId,
    week_start_date: new Date('2024-06-03'),
    accomplishments: 'Shipped the auth module',
    challenges: 'Flaky integration tests',
    next_week_goals: 'Finish leave management',
    submitted_at: new Date('2024-06-07T16:05:00.000Z'),
    created_at: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    prismaService = {
      employee: {
        findUnique: vi.fn(),
      },
      weeklyCheckin: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };

    eventBusService = {
      emit: vi.fn().mockResolvedValue({}),
    };

    service = new WeeklyCheckinService(
      prismaService as PrismaService,
      eventBusService as EventBusService,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('submitCheckin (Req 4.2, 4.5)', () => {
    it('stores the three check-in responses with employee id and timestamp', async () => {
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      prismaService.weeklyCheckin.findUnique.mockResolvedValue(null);
      prismaService.weeklyCheckin.create.mockResolvedValue(buildCheckin());

      const result = await service.submitCheckin({
        employee_id: mockEmployeeId,
        week_start_date: weekStart,
        accomplishments: 'Shipped the auth module',
        challenges: 'Flaky integration tests',
        next_week_goals: 'Finish leave management',
      });

      expect(prismaService.weeklyCheckin.create).toHaveBeenCalledTimes(1);
      const createArg = prismaService.weeklyCheckin.create.mock.calls[0][0];
      expect(createArg.data.employee_id).toBe(mockEmployeeId);
      expect(createArg.data.accomplishments).toBe('Shipped the auth module');
      expect(createArg.data.challenges).toBe('Flaky integration tests');
      expect(createArg.data.next_week_goals).toBe('Finish leave management');
      expect(createArg.data.submitted_at).toBeInstanceOf(Date);
      expect(result.id).toBe('checkin-1');
    });

    it('normalizes week_start_date to midnight before persistence', async () => {
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      prismaService.weeklyCheckin.findUnique.mockResolvedValue(null);
      prismaService.weeklyCheckin.create.mockResolvedValue(buildCheckin());

      await service.submitCheckin({
        employee_id: mockEmployeeId,
        week_start_date: weekStart,
      });

      const createArg = prismaService.weeklyCheckin.create.mock.calls[0][0];
      const storedDate: Date = createArg.data.week_start_date;
      expect(storedDate.getHours()).toBe(0);
      expect(storedDate.getMinutes()).toBe(0);
      expect(storedDate.getSeconds()).toBe(0);
      expect(storedDate.getMilliseconds()).toBe(0);
    });

    it('persists null for unanswered questions', async () => {
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      prismaService.weeklyCheckin.findUnique.mockResolvedValue(null);
      prismaService.weeklyCheckin.create.mockResolvedValue(
        buildCheckin({ accomplishments: null, challenges: null, next_week_goals: null }),
      );

      await service.submitCheckin({
        employee_id: mockEmployeeId,
        week_start_date: weekStart,
      });

      const createArg = prismaService.weeklyCheckin.create.mock.calls[0][0];
      expect(createArg.data.accomplishments).toBeNull();
      expect(createArg.data.challenges).toBeNull();
      expect(createArg.data.next_week_goals).toBeNull();
    });

    it('emits a checkin.response.submitted event after storing (Req 9.6)', async () => {
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      prismaService.weeklyCheckin.findUnique.mockResolvedValue(null);
      prismaService.weeklyCheckin.create.mockResolvedValue(buildCheckin());

      await service.submitCheckin({
        employee_id: mockEmployeeId,
        week_start_date: weekStart,
      });

      expect(eventBusService.emit).toHaveBeenCalledTimes(1);
      const event = eventBusService.emit.mock.calls[0][0];
      expect(event.event_type).toBe('checkin.response.submitted');
      expect(event.actor.id).toBe(mockEmployeeId);
      expect(event.entity.type).toBe('weekly_checkin');
      expect(event.payload.checkin_id).toBe('checkin-1');
      // Department is carried in metadata so downstream consumers can aggregate.
      expect(event.metadata.department_id).toBe('dept-1');
    });

    it('still succeeds when event emission fails', async () => {
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      prismaService.weeklyCheckin.findUnique.mockResolvedValue(null);
      prismaService.weeklyCheckin.create.mockResolvedValue(buildCheckin());
      eventBusService.emit.mockRejectedValue(new Error('bus down'));

      const result = await service.submitCheckin({
        employee_id: mockEmployeeId,
        week_start_date: weekStart,
      });

      expect(result.id).toBe('checkin-1');
    });

    it('rejects a duplicate submission for the same week', async () => {
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      prismaService.weeklyCheckin.findUnique.mockResolvedValue(buildCheckin());

      await expect(
        service.submitCheckin({
          employee_id: mockEmployeeId,
          week_start_date: weekStart,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prismaService.weeklyCheckin.create).not.toHaveBeenCalled();
    });

    it('maps a P2002 unique constraint violation to a BadRequestException', async () => {
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      prismaService.weeklyCheckin.findUnique.mockResolvedValue(null);
      prismaService.weeklyCheckin.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.submitCheckin({
          employee_id: mockEmployeeId,
          week_start_date: weekStart,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rethrows non-unique persistence errors', async () => {
      prismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      prismaService.weeklyCheckin.findUnique.mockResolvedValue(null);
      prismaService.weeklyCheckin.create.mockRejectedValue(
        new Error('connection reset'),
      );

      await expect(
        service.submitCheckin({
          employee_id: mockEmployeeId,
          week_start_date: weekStart,
        }),
      ).rejects.toThrow('connection reset');
      // A failed persistence must not emit a submission event.
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });

    it('throws when the employee does not exist', async () => {
      prismaService.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.submitCheckin({
          employee_id: 'missing',
          week_start_date: weekStart,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prismaService.weeklyCheckin.create).not.toHaveBeenCalled();
    });

    it('throws when employee_id is missing', async () => {
      await expect(
        service.submitCheckin({
          employee_id: '',
          week_start_date: weekStart,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when week_start_date is missing', async () => {
      await expect(
        service.submitCheckin({
          employee_id: mockEmployeeId,
          week_start_date: undefined as unknown as Date,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCheckin', () => {
    it('looks up a check-in by employee and normalized week', async () => {
      prismaService.weeklyCheckin.findUnique.mockResolvedValue(buildCheckin());

      const result = await service.getCheckin(mockEmployeeId, weekStart);

      const arg = prismaService.weeklyCheckin.findUnique.mock.calls[0][0];
      expect(arg.where.employee_id_week_start_date.employee_id).toBe(mockEmployeeId);
      expect(arg.where.employee_id_week_start_date.week_start_date.getHours()).toBe(0);
      expect(result.id).toBe('checkin-1');
    });

    it('returns null when no check-in exists for the week', async () => {
      prismaService.weeklyCheckin.findUnique.mockResolvedValue(null);

      const result = await service.getCheckin(mockEmployeeId, weekStart);

      expect(result).toBeNull();
    });
  });

  describe('getCheckinsForEmployee', () => {
    it('lists check-ins for an employee newest first', async () => {
      prismaService.weeklyCheckin.findMany.mockResolvedValue([buildCheckin()]);

      const result = await service.getCheckinsForEmployee(mockEmployeeId);

      const arg = prismaService.weeklyCheckin.findMany.mock.calls[0][0];
      expect(arg.where.employee_id).toBe(mockEmployeeId);
      expect(arg.orderBy.week_start_date).toBe('desc');
      expect(arg.take).toBe(50);
      expect(arg.skip).toBe(0);
      expect(result).toHaveLength(1);
    });

    it('applies provided pagination options', async () => {
      prismaService.weeklyCheckin.findMany.mockResolvedValue([]);

      await service.getCheckinsForEmployee(mockEmployeeId, {
        limit: 10,
        offset: 20,
      });

      const arg = prismaService.weeklyCheckin.findMany.mock.calls[0][0];
      expect(arg.take).toBe(10);
      expect(arg.skip).toBe(20);
    });
  });
});
