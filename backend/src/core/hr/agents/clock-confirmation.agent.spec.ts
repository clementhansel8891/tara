import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClockConfirmationAgent } from './clock-confirmation.agent';
import { PrismaService } from '../../../persistence/prisma.service';
import {
  NotificationService,
  TaraNotificationType,
} from '../services/notification.service';
import { EventBusService } from '../services/event-bus.service';

/**
 * Unit tests for ClockConfirmationAgent (Task 13.3)
 *
 * Covers Requirements 3.1 - 3.7:
 * - 3.1 / 3.2: private confirmation on clock-in / clock-out
 * - 3.3: exact timestamp (HH:mm in WIB)
 * - 3.4: employee name included
 * - 3.5: tardiness status when late
 * - 3.6: operates automatically via event listeners (no manual trigger)
 * - 3.7: sent privately only to the acting employee
 */
describe('ClockConfirmationAgent', () => {
  let agent: ClockConfirmationAgent;
  let prismaService: any;
  let notificationService: any;
  let eventBusService: any;

  beforeEach(() => {
    prismaService = {
      notification: { count: vi.fn() },
      eventBusLog: { count: vi.fn(), findMany: vi.fn() },
    };

    notificationService = {
      sendPrivateNotification: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    eventBusService = {
      emit: vi.fn().mockResolvedValue({ id: 'event-1' }),
    };

    agent = new ClockConfirmationAgent(
      prismaService as PrismaService,
      notificationService as NotificationService,
      eventBusService as EventBusService,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const buildClockInEvent = (overrides: any = {}) => ({
    event_id: 'evt-clock-in',
    event_type: 'attendance.clock_in',
    entity: { id: 'attendance-1', type: 'attendance' },
    event_timestamp: new Date('2024-01-15T01:00:00Z'),
    payload: {
      employee_id: 'employee-123',
      employee_name: 'John Doe',
      attendance_date: '2024-01-15T00:00:00.000Z',
      clock_in_time: '2024-01-15T01:00:00.000Z', // 08:00 WIB
      is_tardy: false,
      tardiness_minutes: 0,
      ...overrides,
    },
  });

  describe('handleClockIn (Req 3.1, 3.3, 3.4, 3.7)', () => {
    it('sends a private clock-in confirmation with name and WIB time', async () => {
      await agent.handleClockIn(buildClockInEvent());

      expect(notificationService.sendPrivateNotification).toHaveBeenCalledTimes(1);
      const arg = notificationService.sendPrivateNotification.mock.calls[0][0];

      // Req 3.7: private, only to the acting employee
      expect(arg.recipient_id).toBe('employee-123');
      expect(arg.type).toBe(TaraNotificationType.CLOCK_IN_CONFIRMATION);

      // Req 3.4: employee name included
      expect(arg.content).toContain('John Doe');

      // Req 3.3: exact HH:mm in WIB (01:00 UTC -> 08:00 WIB)
      expect(arg.content).toContain('08:00 WIB');
      expect(arg.metadata.clock_time_wib).toBe('08:00');

      // On time messaging
      expect(arg.content).toContain('tepat waktu');
      expect(arg.metadata.is_tardy).toBe(false);
    });

    it('emits a confirmation delivery event after sending (Req 3.6 tracking)', async () => {
      await agent.handleClockIn(buildClockInEvent());

      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'notification.clock_confirmation_sent',
          actor: expect.objectContaining({ id: 'clock_confirmation_agent' }),
          payload: expect.objectContaining({
            employee_id: 'employee-123',
            action_type: 'clock_in',
          }),
        }),
      );
    });
  });

  describe('tardiness messaging (Req 3.5)', () => {
    it('includes tardiness status when the employee is late', async () => {
      const event = buildClockInEvent({
        clock_in_time: '2024-01-15T02:30:00.000Z', // 09:30 WIB
        is_tardy: true,
        tardiness_minutes: 30,
      });

      await agent.handleClockIn(event);

      const arg = notificationService.sendPrivateNotification.mock.calls[0][0];
      expect(arg.content).toContain('09:30 WIB');
      expect(arg.content).toContain('terlambat 30 menit');
      expect(arg.metadata.is_tardy).toBe(true);
      expect(arg.metadata.tardiness_minutes).toBe(30);
    });
  });

  describe('handleClockOut (Req 3.2, 3.3, 3.4, 3.7)', () => {
    it('sends a private clock-out confirmation with name and WIB time', async () => {
      const event = {
        event_id: 'evt-clock-out',
        event_type: 'attendance.clock_out',
        entity: { id: 'attendance-1', type: 'attendance' },
        event_timestamp: new Date('2024-01-15T10:00:00Z'),
        payload: {
          employee_id: 'employee-123',
          employee_name: 'Jane Smith',
          attendance_date: '2024-01-15T00:00:00.000Z',
          clock_in_time: '2024-01-15T01:00:00.000Z',
          clock_out_time: '2024-01-15T10:00:00.000Z', // 17:00 WIB
        },
      };

      await agent.handleClockOut(event);

      const arg = notificationService.sendPrivateNotification.mock.calls[0][0];
      expect(arg.recipient_id).toBe('employee-123');
      expect(arg.type).toBe(TaraNotificationType.CLOCK_OUT_CONFIRMATION);
      expect(arg.content).toContain('Jane Smith');
      expect(arg.content).toContain('17:00 WIB');
      expect(arg.metadata.action_type).toBe('clock_out');
    });
  });

  describe('robustness', () => {
    it('accepts a bare payload (no event wrapper)', async () => {
      await agent.handleClockIn({
        employee_id: 'employee-999',
        employee_name: 'Bare Payload',
        clock_in_time: '2024-01-15T01:00:00.000Z',
        is_tardy: false,
      });

      expect(notificationService.sendPrivateNotification).toHaveBeenCalledTimes(1);
      const arg = notificationService.sendPrivateNotification.mock.calls[0][0];
      expect(arg.recipient_id).toBe('employee-999');
    });

    it('does not send when employee_id is missing', async () => {
      await agent.handleClockIn({
        event_type: 'attendance.clock_in',
        payload: { clock_in_time: '2024-01-15T01:00:00.000Z' },
      });

      expect(notificationService.sendPrivateNotification).not.toHaveBeenCalled();
    });

    it('emits a failure event (and does not throw) when notification sending fails', async () => {
      notificationService.sendPrivateNotification.mockRejectedValueOnce(
        new Error('notification service down'),
      );

      await expect(
        agent.handleClockIn(buildClockInEvent()),
      ).resolves.toBeUndefined();

      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'notification.clock_confirmation_failed',
          payload: expect.objectContaining({
            error_message: 'notification service down',
          }),
        }),
      );
    });
  });

  describe('getHealthStatus', () => {
    it('returns healthy status with aggregated metrics', async () => {
      prismaService.notification.count
        .mockResolvedValueOnce(5) // clock-in confirmations
        .mockResolvedValueOnce(3); // clock-out confirmations
      prismaService.eventBusLog.count.mockResolvedValueOnce(0); // failures
      prismaService.eventBusLog.findMany.mockResolvedValueOnce([
        { event_payload: { processing_time_ms: 100 } },
        { event_payload: { processing_time_ms: 200 } },
      ]);

      const result = await agent.getHealthStatus();

      expect(result).toMatchObject({
        agent_name: 'Clock_Confirmation_Agent',
        status: 'healthy',
        metrics: {
          confirmations_sent_today: 8,
          clock_in_confirmations: 5,
          clock_out_confirmations: 3,
          failed_confirmations: 0,
          average_processing_time_ms: 150,
          sla_breaches_today: 0,
        },
      });
    });

    it('returns unhealthy status on error', async () => {
      prismaService.notification.count.mockRejectedValue(new Error('db error'));

      const result = await agent.getHealthStatus();

      expect(result.agent_name).toBe('Clock_Confirmation_Agent');
      expect(result.status).toBe('unhealthy');
    });
  });
});
