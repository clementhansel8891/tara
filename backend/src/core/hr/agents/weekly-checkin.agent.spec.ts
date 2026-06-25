import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'reflect-metadata';
import { WeeklyCheckinAgent } from './weekly-checkin.agent';
import { PrismaService } from '../../../persistence/prisma.service';
import {
  NotificationService,
  TaraNotificationType,
} from '../services/notification.service';
import { EventBusService } from '../services/event-bus.service';
import { WeeklyCheckinService } from '../services/weekly-checkin.service';

/**
 * Unit tests for WeeklyCheckinAgent (Task 15.2 / 15.3 / 15.4)
 *
 * Covers Requirements:
 * - 4.1: Friday 16:00 WIB form distribution to all active employees
 * - 4.3: Generate a summary report every Monday once forms are collected
 * - 4.4: Send the report to HR_Team and Supervisors only (privacy)
 * - 4.6: Monday reminder for employees who did not submit
 * - 4.7: Aggregate responses by department for trend analysis
 * - 4.8: Scheduled / autonomous operation
 *
 * The agent is constructed directly with mocked dependencies (the established
 * pattern in this package) because the vitest transform does not emit the
 * decorator metadata Nest's DI relies on.
 */
describe('WeeklyCheckinAgent', () => {
  let agent: WeeklyCheckinAgent;
  let prismaService: any;
  let notificationService: any;
  let eventBusService: any;
  let weeklyCheckinService: any;

  beforeEach(() => {
    prismaService = {
      employee: { findMany: vi.fn() },
      weeklyCheckin: { findMany: vi.fn() },
    };

    notificationService = {
      sendPrivateNotification: vi.fn().mockResolvedValue({ id: 'notif-1' }),
      sendHRTeamNotification: vi.fn().mockResolvedValue([{ id: 'notif-hr-1' }]),
    };

    eventBusService = {
      emit: vi.fn().mockResolvedValue({ id: 'event-1' }),
    };

    weeklyCheckinService = {
      getCheckin: vi.fn(),
    };

    agent = new WeeklyCheckinAgent(
      prismaService as PrismaService,
      notificationService as NotificationService,
      eventBusService as EventBusService,
      weeklyCheckinService as WeeklyCheckinService,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Scheduling metadata (Req 4.1, 4.8)
  // ---------------------------------------------------------------------------
  describe('scheduling (Req 4.1, 4.8)', () => {
    const cronOptionsFor = (method: (...args: any[]) => any) =>
      Reflect.getMetadata('SCHEDULE_CRON_OPTIONS', method) as
        | { cronTime: string; timeZone?: string }
        | undefined;

    it('schedules form distribution for Friday 16:00 WIB', () => {
      const options = cronOptionsFor(agent.distributeCheckinForms);
      expect(options).toBeDefined();
      // "minute hour * * day-of-week" => 16:00 on Friday (5)
      expect(options?.cronTime).toBe('0 16 * * 5');
      expect(options?.timeZone).toBe('Asia/Jakarta');
    });

    it('schedules the Monday reminder for 08:00 WIB', () => {
      const options = cronOptionsFor(agent.sendMondayReminders);
      expect(options).toBeDefined();
      // "minute hour * * day-of-week" => 08:00 on Monday (1)
      expect(options?.cronTime).toBe('0 8 * * 1');
      expect(options?.timeZone).toBe('Asia/Jakarta');
    });

    it('schedules the weekly report for Monday 08:00 WIB', () => {
      const options = cronOptionsFor(agent.generateWeeklyReport);
      expect(options).toBeDefined();
      expect(options?.cronTime).toBe('0 8 * * 1');
      expect(options?.timeZone).toBe('Asia/Jakarta');
    });
  });

  // ---------------------------------------------------------------------------
  // Friday form distribution (Req 4.1, 4.8)
  // ---------------------------------------------------------------------------
  describe('distributeCheckinForms (Req 4.1, 4.8)', () => {
    it('sends a private check-in form to every active employee', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Alice', department_id: 'dept-1' },
        { id: 'emp-2', full_name: 'Bob', department_id: 'dept-2' },
      ]);

      await agent.distributeCheckinForms();

      expect(notificationService.sendPrivateNotification).toHaveBeenCalledTimes(2);
      const firstCall = notificationService.sendPrivateNotification.mock.calls[0][0];
      expect(firstCall.type).toBe(TaraNotificationType.WEEKLY_CHECKIN_FORM);
      expect(firstCall.recipient_id).toBe('emp-1');

      // Emits a form-distributed event for downstream consumers
      expect(eventBusService.emit).toHaveBeenCalledTimes(1);
      const event = eventBusService.emit.mock.calls[0][0];
      expect(event.event_type).toBe('checkin.form_distributed');
      expect(event.payload.recipients_count).toBe(2);
      expect(event.payload.total_employees).toBe(2);
    });

    it('only targets active employees', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Alice', department_id: 'dept-1' },
      ]);

      await agent.distributeCheckinForms();

      const where = prismaService.employee.findMany.mock.calls[0][0].where;
      expect(where.employment_status).toBe('active');
    });

    it('includes the three standard questions in the form metadata (Req 4.5)', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Alice', department_id: 'dept-1' },
      ]);

      await agent.distributeCheckinForms();

      const form = notificationService.sendPrivateNotification.mock.calls[0][0];
      expect(form.metadata.form_type).toBe('weekly_checkin');
      expect(form.metadata.questions).toEqual([
        'accomplishments',
        'challenges',
        'next_week_goals',
      ]);
    });

    it('does nothing when there are no active employees', async () => {
      prismaService.employee.findMany.mockResolvedValue([]);

      await agent.distributeCheckinForms();

      expect(notificationService.sendPrivateNotification).not.toHaveBeenCalled();
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });

    it('continues distributing when an individual send fails and counts only successes', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Alice', department_id: 'dept-1' },
        { id: 'emp-2', full_name: 'Bob', department_id: 'dept-2' },
        { id: 'emp-3', full_name: 'Carol', department_id: 'dept-1' },
      ]);
      notificationService.sendPrivateNotification
        .mockResolvedValueOnce({ id: 'n-1' })
        .mockRejectedValueOnce(new Error('delivery failed'))
        .mockResolvedValueOnce({ id: 'n-3' });

      await agent.distributeCheckinForms();

      expect(notificationService.sendPrivateNotification).toHaveBeenCalledTimes(3);
      const event = eventBusService.emit.mock.calls[0][0];
      expect(event.payload.recipients_count).toBe(2);
      expect(event.payload.total_employees).toBe(3);
    });

    it('does not throw when employee lookup fails (error resilience)', async () => {
      prismaService.employee.findMany.mockRejectedValue(new Error('db down'));

      await expect(agent.distributeCheckinForms()).resolves.toBeUndefined();
      expect(notificationService.sendPrivateNotification).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Monday reminders for non-submissions (Req 4.6, 4.8)
  // ---------------------------------------------------------------------------
  describe('sendMondayReminders (Req 4.6, 4.8)', () => {
    it('reminds only employees who did not submit last week', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Alice' },
        { id: 'emp-2', full_name: 'Bob' },
        { id: 'emp-3', full_name: 'Carol' },
      ]);
      // emp-1 already submitted; emp-2 and emp-3 did not.
      prismaService.weeklyCheckin.findMany.mockResolvedValue([
        { employee_id: 'emp-1' },
      ]);

      await agent.sendMondayReminders();

      expect(notificationService.sendPrivateNotification).toHaveBeenCalledTimes(2);
      const recipients = notificationService.sendPrivateNotification.mock.calls.map(
        (c: any[]) => c[0].recipient_id,
      );
      expect(recipients).toEqual(['emp-2', 'emp-3']);
      expect(
        notificationService.sendPrivateNotification.mock.calls[0][0].type,
      ).toBe(TaraNotificationType.WEEKLY_CHECKIN_REMINDER);

      const event = eventBusService.emit.mock.calls[0][0];
      expect(event.event_type).toBe('checkin.reminder_sent');
      expect(event.payload.reminders_sent).toBe(2);
      expect(event.payload.pending_count).toBe(2);
    });

    it('reminds everyone when nobody submitted', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Alice' },
        { id: 'emp-2', full_name: 'Bob' },
      ]);
      prismaService.weeklyCheckin.findMany.mockResolvedValue([]);

      await agent.sendMondayReminders();

      expect(notificationService.sendPrivateNotification).toHaveBeenCalledTimes(2);
    });

    it('sends no reminders when everyone has submitted', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Alice' },
      ]);
      prismaService.weeklyCheckin.findMany.mockResolvedValue([
        { employee_id: 'emp-1' },
      ]);

      await agent.sendMondayReminders();

      expect(notificationService.sendPrivateNotification).not.toHaveBeenCalled();
      // No one pending, but the cycle event is still emitted with zero reminders.
      const event = eventBusService.emit.mock.calls[0][0];
      expect(event.event_type).toBe('checkin.reminder_sent');
      expect(event.payload.reminders_sent).toBe(0);
    });

    it('does nothing when there are no active employees', async () => {
      prismaService.employee.findMany.mockResolvedValue([]);

      await agent.sendMondayReminders();

      expect(prismaService.weeklyCheckin.findMany).not.toHaveBeenCalled();
      expect(notificationService.sendPrivateNotification).not.toHaveBeenCalled();
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });

    it('chases the previous week (7 days before this Monday)', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Alice' },
      ]);
      prismaService.weeklyCheckin.findMany.mockResolvedValue([]);

      await agent.sendMondayReminders();

      const queriedWeek =
        prismaService.weeklyCheckin.findMany.mock.calls[0][0].where
          .week_start_date;
      expect(queriedWeek).toBeInstanceOf(Date);
      // Always a Monday at midnight.
      expect(queriedWeek.getDay()).toBe(1);
      expect(queriedWeek.getHours()).toBe(0);
    });

    it('continues reminding when one reminder fails (error resilience)', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Alice' },
        { id: 'emp-2', full_name: 'Bob' },
      ]);
      prismaService.weeklyCheckin.findMany.mockResolvedValue([]);
      notificationService.sendPrivateNotification
        .mockRejectedValueOnce(new Error('delivery failed'))
        .mockResolvedValueOnce({ id: 'n-2' });

      await agent.sendMondayReminders();

      expect(notificationService.sendPrivateNotification).toHaveBeenCalledTimes(2);
      const event = eventBusService.emit.mock.calls[0][0];
      expect(event.payload.reminders_sent).toBe(1);
      expect(event.payload.pending_count).toBe(2);
    });

    it('does not throw when employee lookup fails (error resilience)', async () => {
      prismaService.employee.findMany.mockRejectedValue(new Error('db down'));

      await expect(agent.sendMondayReminders()).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Report aggregation by department (Req 4.3, 4.7)
  // ---------------------------------------------------------------------------
  describe('generateWeeklyReport - aggregation (Req 4.3, 4.7)', () => {
    it('aggregates responses by department with participation rates', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', department_id: 'dept-1', department: { name: 'Engineering' } },
        { id: 'emp-2', department_id: 'dept-1', department: { name: 'Engineering' } },
        { id: 'emp-3', department_id: 'dept-2', department: { name: 'Sales' } },
      ]);
      // Only emp-1 (Engineering) and emp-3 (Sales) submitted.
      prismaService.weeklyCheckin.findMany.mockResolvedValue([
        {
          id: 'c-1',
          employee_id: 'emp-1',
          accomplishments: 'Shipped feature',
          challenges: 'Flaky tests',
          next_week_goals: 'Stabilize CI',
          employee: { department_id: 'dept-1', department: { name: 'Engineering' } },
        },
        {
          id: 'c-2',
          employee_id: 'emp-3',
          accomplishments: 'Closed 3 deals',
          challenges: null,
          next_week_goals: 'Follow up leads',
          employee: { department_id: 'dept-2', department: { name: 'Sales' } },
        },
      ]);

      await agent.generateWeeklyReport();

      const reportCall = notificationService.sendHRTeamNotification.mock.calls[0][0];
      const breakdown = reportCall.metadata.department_breakdown;
      expect(breakdown).toHaveLength(2);

      const eng = breakdown.find((d: any) => d.department_name === 'Engineering');
      const sales = breakdown.find((d: any) => d.department_name === 'Sales');
      expect(eng.responses).toBe(1);
      expect(eng.total_employees).toBe(2);
      expect(eng.participation_rate).toBe(50);
      expect(sales.responses).toBe(1);
      expect(sales.total_employees).toBe(1);
      expect(sales.participation_rate).toBe(100);

      expect(reportCall.metadata.total_responses).toBe(2);
      expect(reportCall.metadata.total_employees).toBe(3);
      expect(reportCall.metadata.participation_rate).toBe(67); // 2/3 rounded
    });

    it('counts per-question content, ignoring blank answers', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', department_id: 'dept-1', department: { name: 'Engineering' } },
        { id: 'emp-2', department_id: 'dept-1', department: { name: 'Engineering' } },
      ]);
      prismaService.weeklyCheckin.findMany.mockResolvedValue([
        {
          id: 'c-1',
          employee_id: 'emp-1',
          accomplishments: 'Shipped feature',
          challenges: '   ', // whitespace only -> should not count
          next_week_goals: null,
          employee: { department_id: 'dept-1', department: { name: 'Engineering' } },
        },
        {
          id: 'c-2',
          employee_id: 'emp-2',
          accomplishments: 'Fixed bugs',
          challenges: 'Tooling',
          next_week_goals: 'Docs',
          employee: { department_id: 'dept-1', department: { name: 'Engineering' } },
        },
      ]);

      await agent.generateWeeklyReport();

      const breakdown =
        notificationService.sendHRTeamNotification.mock.calls[0][0].metadata
          .department_breakdown;
      const eng = breakdown.find((d: any) => d.department_name === 'Engineering');
      expect(eng.accomplishments_count).toBe(2);
      expect(eng.challenges_count).toBe(1); // whitespace-only ignored
      expect(eng.goals_count).toBe(1); // null ignored
    });

    it('groups employees without a department under a fallback bucket', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', department_id: null, department: null },
        { id: 'emp-2', department_id: null, department: null },
      ]);
      prismaService.weeklyCheckin.findMany.mockResolvedValue([
        {
          id: 'c-1',
          employee_id: 'emp-1',
          accomplishments: 'Worked',
          challenges: null,
          next_week_goals: null,
          employee: { department_id: null, department: null },
        },
      ]);

      await agent.generateWeeklyReport();

      const breakdown =
        notificationService.sendHRTeamNotification.mock.calls[0][0].metadata
          .department_breakdown;
      expect(breakdown).toHaveLength(1);
      expect(breakdown[0].department_name).toBe('Tidak Ada Departemen');
      expect(breakdown[0].total_employees).toBe(2);
      expect(breakdown[0].responses).toBe(1);
      expect(breakdown[0].participation_rate).toBe(50);
    });

    it('reports zero participation when no one submitted', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', department_id: 'dept-1', department: { name: 'Engineering' } },
      ]);
      prismaService.weeklyCheckin.findMany.mockResolvedValue([]);

      await agent.generateWeeklyReport();

      const reportCall = notificationService.sendHRTeamNotification.mock.calls[0][0];
      expect(reportCall.metadata.total_responses).toBe(0);
      expect(reportCall.metadata.participation_rate).toBe(0);
      const eng = reportCall.metadata.department_breakdown[0];
      expect(eng.responses).toBe(0);
      expect(eng.participation_rate).toBe(0);
    });

    it('sorts the department breakdown alphabetically by name', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', department_id: 'dept-2', department: { name: 'Sales' } },
        { id: 'emp-2', department_id: 'dept-1', department: { name: 'Engineering' } },
        { id: 'emp-3', department_id: 'dept-3', department: { name: 'Marketing' } },
      ]);
      prismaService.weeklyCheckin.findMany.mockResolvedValue([]);

      await agent.generateWeeklyReport();

      const breakdown =
        notificationService.sendHRTeamNotification.mock.calls[0][0].metadata
          .department_breakdown;
      expect(breakdown.map((d: any) => d.department_name)).toEqual([
        'Engineering',
        'Marketing',
        'Sales',
      ]);
    });

    it('does nothing when there are no active employees', async () => {
      prismaService.employee.findMany.mockResolvedValue([]);

      await agent.generateWeeklyReport();

      expect(notificationService.sendHRTeamNotification).not.toHaveBeenCalled();
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });

    it('does not throw when delivery fails (error resilience)', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', department_id: 'dept-1', department: { name: 'Engineering' } },
      ]);
      prismaService.weeklyCheckin.findMany.mockResolvedValue([]);
      notificationService.sendHRTeamNotification.mockRejectedValue(
        new Error('notify down'),
      );

      await expect(agent.generateWeeklyReport()).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Report privacy (Req 4.4)
  // ---------------------------------------------------------------------------
  describe('generateWeeklyReport - privacy (Req 4.4)', () => {
    beforeEach(() => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', department_id: 'dept-1', department: { name: 'Engineering' } },
      ]);
      prismaService.weeklyCheckin.findMany.mockResolvedValue([
        {
          id: 'c-1',
          employee_id: 'emp-1',
          accomplishments: 'Work',
          challenges: null,
          next_week_goals: null,
          employee: { department_id: 'dept-1', department: { name: 'Engineering' } },
        },
      ]);
    });

    it('delivers the report to HR_Team and Supervisors only', async () => {
      await agent.generateWeeklyReport();

      expect(notificationService.sendHRTeamNotification).toHaveBeenCalledTimes(1);
      const reportCall = notificationService.sendHRTeamNotification.mock.calls[0][0];
      expect(reportCall.type).toBe(TaraNotificationType.WEEKLY_CHECKIN_REPORT);
      expect(reportCall.include_supervisors).toBe(true);
    });

    it('never sends the report to individual employees', async () => {
      await agent.generateWeeklyReport();

      expect(notificationService.sendPrivateNotification).not.toHaveBeenCalled();
    });

    it('emits a report-generated event with recipient count', async () => {
      notificationService.sendHRTeamNotification.mockResolvedValue([
        { id: 'hr-1' },
        { id: 'sup-1' },
      ]);

      await agent.generateWeeklyReport();

      const event = eventBusService.emit.mock.calls[0][0];
      expect(event.event_type).toBe('checkin.report_generated');
      expect(event.payload.recipients_count).toBe(2);
    });
  });
});
