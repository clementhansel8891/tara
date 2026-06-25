import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'reflect-metadata';
import { LateReportAgent } from './late-report.agent';
import { PrismaService } from '../../../persistence/prisma.service';
import {
  NotificationService,
  TaraNotificationType,
} from '../services/notification.service';
import { EventBusService } from '../services/event-bus.service';

/**
 * Smoke tests for LateReportAgent (Task 16.1)
 *
 * Covers Requirements:
 * - 5.1: Generate a tardiness report every workday at 09:05 WIB (schedule)
 * - 5.2: Include all employees flagged tardy for the current day
 * - 5.3: Send the report as a Public_Announcement to all employees
 * - 5.4: Send a detailed recap to the HR_Team
 * - 5.5: Include employee names, actual arrival times, and minutes late
 * - 5.6: Exclude weekends and public holidays from report generation (Task 16.2)
 * - 5.7: Send a positive acknowledgment when no one is tardy (Task 16.2)
 *
 * The agent is constructed directly with mocked dependencies (the established
 * pattern in this package) because the vitest transform does not emit the
 * decorator metadata Nest's DI relies on.
 */
describe('LateReportAgent', () => {
  let agent: LateReportAgent;
  let prismaService: any;
  let notificationService: any;
  let eventBusService: any;

  beforeEach(() => {
    prismaService = {
      attendance: { findMany: vi.fn() },
      publicHoliday: { findFirst: vi.fn().mockResolvedValue(null) },
    };

    notificationService = {
      sendPublicAnnouncement: vi
        .fn()
        .mockResolvedValue([{ id: 'pub-1' }, { id: 'pub-2' }]),
      sendHRTeamNotification: vi.fn().mockResolvedValue([{ id: 'hr-1' }]),
    };

    eventBusService = {
      emit: vi.fn().mockResolvedValue({ id: 'event-1' }),
    };

    agent = new LateReportAgent(
      prismaService as PrismaService,
      notificationService as NotificationService,
      eventBusService as EventBusService,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Scheduling metadata (Req 5.1)
  // ---------------------------------------------------------------------------
  describe('scheduling (Req 5.1)', () => {
    it('schedules the report for 09:05 WIB on weekdays', () => {
      const options = Reflect.getMetadata(
        'SCHEDULE_CRON_OPTIONS',
        agent.generateDailyTardinessReport,
      ) as { cronTime: string; timeZone?: string } | undefined;

      expect(options).toBeDefined();
      // "minute hour * * day-of-week" => 09:05 Monday-Friday
      expect(options?.cronTime).toBe('5 9 * * 1-5');
      expect(options?.timeZone).toBe('Asia/Jakarta');
    });
  });

  // ---------------------------------------------------------------------------
  // Report generation & delivery (Req 5.2 - 5.5)
  // ---------------------------------------------------------------------------
  describe('generateDailyTardinessReport (Req 5.2 - 5.5)', () => {
    // Monday 2026-01-05 (a valid workday, not a holiday) so the weekend/holiday
    // guards never short-circuit these report-generation tests.
    const WORKDAY = new Date(2026, 0, 5);

    const tardyRecords = [
      {
        id: 'att-1',
        employee_id: 'emp-1',
        clock_in_time: new Date('2026-01-05T02:15:00.000Z'), // 09:15 WIB
        tardiness_minutes: 15,
        employee: {
          id: 'emp-1',
          full_name: 'Alice',
          department: { name: 'Engineering' },
        },
      },
      {
        id: 'att-2',
        employee_id: 'emp-2',
        clock_in_time: new Date('2026-01-05T02:30:00.000Z'), // 09:30 WIB
        tardiness_minutes: 30,
        employee: {
          id: 'emp-2',
          full_name: 'Bob',
          department: { name: 'Sales' },
        },
      },
    ];

    it('queries tardy attendance records for the current day', async () => {
      prismaService.attendance.findMany.mockResolvedValue(tardyRecords);

      await agent.generateDailyTardinessReport(WORKDAY);

      const where = prismaService.attendance.findMany.mock.calls[0][0].where;
      expect(where.is_tardy).toBe(true);
      expect(where.attendance_date).toBeInstanceOf(Date);
    });

    it('sends a public announcement to all employees (Req 5.3)', async () => {
      prismaService.attendance.findMany.mockResolvedValue(tardyRecords);

      await agent.generateDailyTardinessReport(WORKDAY);

      expect(notificationService.sendPublicAnnouncement).toHaveBeenCalledTimes(1);
      const call = notificationService.sendPublicAnnouncement.mock.calls[0][0];
      expect(call.type).toBe(TaraNotificationType.TARDINESS_ANNOUNCEMENT);
      // Req 5.5: names, arrival times, minutes late present in the content
      expect(call.content).toContain('Alice');
      expect(call.content).toContain('Bob');
      expect(call.content).toContain('15 menit');
      expect(call.content).toContain('30 menit');
      expect(call.metadata.tardy_count).toBe(2);
    });

    it('sends a detailed recap to the HR_Team (Req 5.4)', async () => {
      prismaService.attendance.findMany.mockResolvedValue(tardyRecords);

      await agent.generateDailyTardinessReport(WORKDAY);

      expect(notificationService.sendHRTeamNotification).toHaveBeenCalledTimes(1);
      const call = notificationService.sendHRTeamNotification.mock.calls[0][0];
      expect(call.type).toBe(TaraNotificationType.WEEKLY_ATTENDANCE_RECAP);
      expect(call.content).toContain('Engineering');
      expect(call.content).toContain('Sales');
      expect(call.metadata.tardy_employees).toHaveLength(2);
    });

    it('emits report-generated and announcement-published events', async () => {
      prismaService.attendance.findMany.mockResolvedValue(tardyRecords);

      await agent.generateDailyTardinessReport(WORKDAY);

      const eventTypes = eventBusService.emit.mock.calls.map(
        (c: any[]) => c[0].event_type,
      );
      expect(eventTypes).toContain('report.tardiness_generated');
      expect(eventTypes).toContain('announcement.tardiness_published');
    });

    it('sends a positive acknowledgment to all employees when no one is tardy (Req 5.7)', async () => {
      prismaService.attendance.findMany.mockResolvedValue([]);

      await agent.generateDailyTardinessReport(WORKDAY);

      // Positive message broadcast to all employees via a public type.
      expect(notificationService.sendPublicAnnouncement).toHaveBeenCalledTimes(1);
      const call = notificationService.sendPublicAnnouncement.mock.calls[0][0];
      expect(call.type).toBe(TaraNotificationType.ATTENDANCE_ANNOUNCEMENT);
      expect(call.metadata.tardy_count).toBe(0);
      expect(call.metadata.no_tardiness).toBe(true);
      // No HR tardiness recap when there is nothing to report.
      expect(notificationService.sendHRTeamNotification).not.toHaveBeenCalled();
    });

    it('does not throw when the attendance query fails (error resilience)', async () => {
      prismaService.attendance.findMany.mockRejectedValue(new Error('db down'));

      await expect(
        agent.generateDailyTardinessReport(WORKDAY),
      ).resolves.toBeUndefined();
      expect(notificationService.sendPublicAnnouncement).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Weekend & public holiday exclusion (Req 5.6)
  // ---------------------------------------------------------------------------
  describe('weekend & public holiday exclusion (Req 5.6)', () => {
    it('skips report generation on Saturdays', async () => {
      const saturday = new Date(2026, 0, 3); // 2026-01-03 is a Saturday

      await agent.generateDailyTardinessReport(saturday);

      expect(prismaService.attendance.findMany).not.toHaveBeenCalled();
      expect(notificationService.sendPublicAnnouncement).not.toHaveBeenCalled();
    });

    it('skips report generation on Sundays', async () => {
      const sunday = new Date(2026, 0, 4); // 2026-01-04 is a Sunday

      await agent.generateDailyTardinessReport(sunday);

      expect(prismaService.attendance.findMany).not.toHaveBeenCalled();
      expect(notificationService.sendPublicAnnouncement).not.toHaveBeenCalled();
    });

    it('skips report generation on active public holidays', async () => {
      const workday = new Date(2026, 0, 5); // Monday
      prismaService.publicHoliday.findFirst.mockResolvedValue({ id: 'holiday-1' });

      await agent.generateDailyTardinessReport(workday);

      expect(prismaService.publicHoliday.findFirst).toHaveBeenCalledTimes(1);
      expect(prismaService.attendance.findMany).not.toHaveBeenCalled();
      expect(notificationService.sendPublicAnnouncement).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Automatic operation & performance (Req 5.8, Req 18.3) - Task 16.3
  // ---------------------------------------------------------------------------
  describe('automatic operation & performance (Req 5.8, Req 18.3)', () => {
    // Monday 2026-01-05 (a valid, non-holiday workday).
    const WORKDAY = new Date(2026, 0, 5);

    function buildTardyRecords(count: number) {
      return Array.from({ length: count }, (_, i) => ({
        id: `att-${i}`,
        employee_id: `emp-${i}`,
        clock_in_time: new Date('2026-01-05T02:15:00.000Z'), // 09:15 WIB
        tardiness_minutes: 5 + (i % 60),
        employee: {
          id: `emp-${i}`,
          full_name: `Employee ${i}`,
          department: { name: `Dept ${i % 5}` },
        },
      }));
    }

    it('operates automatically with no manual trigger required (Req 5.8)', async () => {
      // Automatic operation is driven by the @Cron schedule: the runner invokes
      // the entrypoint with NO arguments. Confirm both that the cron metadata is
      // present and that the method runs end-to-end with zero arguments.
      const cronOptions = Reflect.getMetadata(
        'SCHEDULE_CRON_OPTIONS',
        agent.generateDailyTardinessReport,
      );
      expect(cronOptions).toBeDefined();

      prismaService.attendance.findMany.mockResolvedValue([]);

      // Invoked exactly the way the scheduler does - no manual trigger/args.
      await expect(
        agent.generateDailyTardinessReport(),
      ).resolves.toBeUndefined();
    });

    it('generates the report well within the 2-minute target with 50+ tardy employees (Req 18.3)', async () => {
      const tardyRecords = buildTardyRecords(60);
      prismaService.attendance.findMany.mockResolvedValue(tardyRecords);

      const start = Date.now();
      await agent.generateDailyTardinessReport(WORKDAY);
      const elapsedMs = Date.now() - start;

      // Req 18.3: must finish within 2 minutes (120000ms). A tight 5s ceiling
      // gives a large safety margin and fails loudly on any N+1 regression.
      expect(elapsedMs).toBeLessThan(5000);

      // The single report reflects all 60 tardy employees.
      const publicCall =
        notificationService.sendPublicAnnouncement.mock.calls[0][0];
      expect(publicCall.metadata.tardy_count).toBe(60);
      expect(publicCall.metadata.tardy_employees).toHaveLength(60);
    });

    it('issues a bounded number of queries regardless of tardy count (Req 18.3)', async () => {
      prismaService.attendance.findMany.mockResolvedValue(buildTardyRecords(60));

      await agent.generateDailyTardinessReport(WORKDAY);

      // Agent-side DB access is constant: one tardy-attendance query plus one
      // public-holiday guard query. It does NOT grow with the tardy count.
      expect(prismaService.attendance.findMany).toHaveBeenCalledTimes(1);
      expect(prismaService.publicHoliday.findFirst).toHaveBeenCalledTimes(1);

      // Distribution is delegated to exactly one bulk public announcement and
      // one bulk HR recap - not one call per tardy employee.
      expect(notificationService.sendPublicAnnouncement).toHaveBeenCalledTimes(1);
      expect(notificationService.sendHRTeamNotification).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Focused unit tests (Task 16.4)
  //
  // Deepens coverage of the four required scenarios with robust assertions and
  // edge cases:
  //   1. Report generation with multiple tardy employees (Req 5.2 - 5.5)
  //   2. Positive acknowledgment when no tardiness (Req 5.7)
  //   3. Public holiday exclusion (Req 5.6 / Req 8.7)
  //   4. Performance with 50+ employees (Req 18.3)
  // ---------------------------------------------------------------------------
  describe('unit tests (Task 16.4)', () => {
    // Monday 2026-01-05 - a valid, non-holiday workday so the weekend/holiday
    // guards never short-circuit these tests.
    const WORKDAY = new Date(2026, 0, 5);

    /**
     * Build a single tardy Attendance record as returned by the Prisma query.
     * `wibHHmm` is the desired WIB (UTC+7) arrival time; it is converted to the
     * matching UTC instant so the agent's WIB formatting is exercised honestly.
     */
    function makeRecord(opts: {
      id: string;
      employeeId: string;
      name: string | null;
      department: string | null;
      wibHHmm: string; // e.g. '09:45'
      minutesLate: number;
    }) {
      const [hh, mm] = opts.wibHHmm.split(':').map(Number);
      // WIB is UTC+7, so subtract 7 hours to obtain the UTC instant.
      const utcHour = hh - 7;
      const clockIn = new Date(
        `2026-01-05T${String(utcHour).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00.000Z`,
      );
      return {
        id: opts.id,
        employee_id: opts.employeeId,
        clock_in_time: clockIn,
        tardiness_minutes: opts.minutesLate,
        employee:
          opts.name === null
            ? null
            : {
                id: opts.employeeId,
                full_name: opts.name,
                department: opts.department
                  ? { name: opts.department }
                  : null,
              },
      };
    }

    // -------------------------------------------------------------------------
    // 1. Report generation with multiple tardy employees (Req 5.2 - 5.5)
    // -------------------------------------------------------------------------
    describe('report generation with multiple tardy employees (Req 5.2 - 5.5)', () => {
      // Returned by the DB already ordered by minutes late descending.
      const multiTardy = [
        makeRecord({
          id: 'att-1',
          employeeId: 'emp-1',
          name: 'Charlie',
          department: 'Finance',
          wibHHmm: '09:45',
          minutesLate: 45,
        }),
        makeRecord({
          id: 'att-2',
          employeeId: 'emp-2',
          name: 'Bob',
          department: 'Sales',
          wibHHmm: '09:30',
          minutesLate: 30,
        }),
        makeRecord({
          id: 'att-3',
          employeeId: 'emp-3',
          name: 'Alice',
          department: 'Engineering',
          wibHHmm: '09:07',
          minutesLate: 7,
        }),
      ];

      it('requests tardy records ordered by minutes late descending (Req 5.2)', async () => {
        prismaService.attendance.findMany.mockResolvedValue(multiTardy);

        await agent.generateDailyTardinessReport(WORKDAY);

        const args = prismaService.attendance.findMany.mock.calls[0][0];
        expect(args.where.is_tardy).toBe(true);
        expect(args.orderBy).toEqual({ tardiness_minutes: 'desc' });
      });

      it('lists every tardy employee with name, arrival time and minutes late, preserving order (Req 5.3, 5.5)', async () => {
        prismaService.attendance.findMany.mockResolvedValue(multiTardy);

        await agent.generateDailyTardinessReport(WORKDAY);

        const call =
          notificationService.sendPublicAnnouncement.mock.calls[0][0];
        const content: string = call.content;

        // Every employee name is present.
        expect(content).toContain('Charlie');
        expect(content).toContain('Bob');
        expect(content).toContain('Alice');

        // Actual arrival times (WIB) are present (Req 5.5).
        expect(content).toContain('09:45');
        expect(content).toContain('09:30');
        expect(content).toContain('09:07');

        // Minutes late are present (Req 5.5).
        expect(content).toContain('45 menit');
        expect(content).toContain('30 menit');
        expect(content).toContain('7 menit');

        // Ordering is preserved from the DB query (most late first).
        expect(content.indexOf('Charlie')).toBeLessThan(
          content.indexOf('Bob'),
        );
        expect(content.indexOf('Bob')).toBeLessThan(content.indexOf('Alice'));

        // Metadata mirrors the full set in the original order.
        expect(call.metadata.tardy_count).toBe(3);
        expect(
          call.metadata.tardy_employees.map((e: any) => e.employee_name),
        ).toEqual(['Charlie', 'Bob', 'Alice']);
      });

      it('includes the accumulated total minutes and per-department context in the HR recap (Req 5.4)', async () => {
        prismaService.attendance.findMany.mockResolvedValue(multiTardy);

        await agent.generateDailyTardinessReport(WORKDAY);

        const call =
          notificationService.sendHRTeamNotification.mock.calls[0][0];
        const content: string = call.content;

        expect(call.type).toBe(TaraNotificationType.WEEKLY_ATTENDANCE_RECAP);
        // Total count and accumulated minutes (45 + 30 + 7 = 82).
        expect(content).toContain('Total karyawan terlambat: 3');
        expect(content).toContain('82 menit');
        // Department context for HR follow-up.
        expect(content).toContain('Finance');
        expect(content).toContain('Sales');
        expect(content).toContain('Engineering');
      });

      it('falls back to a default name and omits department when employee relation data is missing', async () => {
        prismaService.attendance.findMany.mockResolvedValue([
          makeRecord({
            id: 'att-x',
            employeeId: 'emp-x',
            name: null, // employee relation absent
            department: null,
            wibHHmm: '09:10',
            minutesLate: 10,
          }),
        ]);

        await agent.generateDailyTardinessReport(WORKDAY);

        const publicCall =
          notificationService.sendPublicAnnouncement.mock.calls[0][0];
        // Falls back to the default label rather than crashing.
        expect(publicCall.content).toContain('Karyawan');
        expect(publicCall.content).toContain('10 menit');
        expect(publicCall.metadata.tardy_employees[0].employee_name).toBe(
          'Karyawan',
        );
        expect(publicCall.metadata.tardy_employees[0].department_name).toBeNull();
      });
    });

    // -------------------------------------------------------------------------
    // 2. Positive acknowledgment when no tardiness (Req 5.7)
    // -------------------------------------------------------------------------
    describe('positive acknowledgment when no tardiness (Req 5.7)', () => {
      it('broadcasts an encouraging public message and skips the HR recap', async () => {
        prismaService.attendance.findMany.mockResolvedValue([]);

        await agent.generateDailyTardinessReport(WORKDAY);

        expect(
          notificationService.sendPublicAnnouncement,
        ).toHaveBeenCalledTimes(1);
        const call =
          notificationService.sendPublicAnnouncement.mock.calls[0][0];
        expect(call.type).toBe(TaraNotificationType.ATTENDANCE_ANNOUNCEMENT);
        // Positive, non-empty acknowledgment content.
        expect(call.content).toContain('Tidak ada karyawan yang tercatat terlambat');
        expect(call.metadata.tardy_count).toBe(0);
        expect(call.metadata.tardy_employees).toEqual([]);
        expect(call.metadata.no_tardiness).toBe(true);

        // No HR tardiness recap when there is nothing to report.
        expect(
          notificationService.sendHRTeamNotification,
        ).not.toHaveBeenCalled();
      });

      it('emits report and announcement events with a zero tardy count', async () => {
        prismaService.attendance.findMany.mockResolvedValue([]);

        await agent.generateDailyTardinessReport(WORKDAY);

        const events = eventBusService.emit.mock.calls.map((c: any[]) => c[0]);
        const reportEvent = events.find(
          (e: any) => e.event_type === 'report.tardiness_generated',
        );
        const announceEvent = events.find(
          (e: any) => e.event_type === 'announcement.tardiness_published',
        );

        expect(reportEvent).toBeDefined();
        expect(reportEvent.payload.tardy_count).toBe(0);
        expect(reportEvent.payload.no_tardiness).toBe(true);

        expect(announceEvent).toBeDefined();
        expect(announceEvent.payload.tardy_count).toBe(0);
        expect(announceEvent.payload.no_tardiness).toBe(true);
      });
    });

    // -------------------------------------------------------------------------
    // 3. Public holiday exclusion (Req 5.6 / Req 8.7)
    // -------------------------------------------------------------------------
    describe('public holiday exclusion (Req 5.6 / Req 8.7)', () => {
      it('queries only active public holidays for the report date', async () => {
        prismaService.publicHoliday.findFirst.mockResolvedValue({
          id: 'holiday-1',
        });

        await agent.generateDailyTardinessReport(WORKDAY);

        expect(prismaService.publicHoliday.findFirst).toHaveBeenCalledTimes(1);
        const args = prismaService.publicHoliday.findFirst.mock.calls[0][0];
        expect(args.where.is_active).toBe(true);
        expect(args.where.holiday_date).toBeInstanceOf(Date);
      });

      it('does not generate, distribute, or emit anything on an active public holiday', async () => {
        prismaService.publicHoliday.findFirst.mockResolvedValue({
          id: 'holiday-1',
        });

        await agent.generateDailyTardinessReport(WORKDAY);

        expect(prismaService.attendance.findMany).not.toHaveBeenCalled();
        expect(
          notificationService.sendPublicAnnouncement,
        ).not.toHaveBeenCalled();
        expect(
          notificationService.sendHRTeamNotification,
        ).not.toHaveBeenCalled();
        expect(eventBusService.emit).not.toHaveBeenCalled();
      });

      it('proceeds normally when the day is not a public holiday', async () => {
        prismaService.publicHoliday.findFirst.mockResolvedValue(null);
        prismaService.attendance.findMany.mockResolvedValue([
          makeRecord({
            id: 'att-1',
            employeeId: 'emp-1',
            name: 'Alice',
            department: 'Engineering',
            wibHHmm: '09:15',
            minutesLate: 15,
          }),
        ]);

        await agent.generateDailyTardinessReport(WORKDAY);

        expect(prismaService.attendance.findMany).toHaveBeenCalledTimes(1);
        expect(
          notificationService.sendPublicAnnouncement,
        ).toHaveBeenCalledTimes(1);
      });
    });

    // -------------------------------------------------------------------------
    // 4. Performance with 50+ employees (Req 18.3)
    // -------------------------------------------------------------------------
    describe('performance with 50+ tardy employees (Req 18.3)', () => {
      function buildLargeTardySet(count: number) {
        // Descending minutes late, mirroring the DB orderBy contract.
        return Array.from({ length: count }, (_, i) =>
          makeRecord({
            id: `att-${i}`,
            employeeId: `emp-${i}`,
            name: `Employee ${i}`,
            department: `Dept ${i % 5}`,
            wibHHmm: '09:15',
            minutesLate: count - i,
          }),
        );
      }

      it('completes well within the 2-minute target for 55 tardy employees (Req 18.3)', async () => {
        prismaService.attendance.findMany.mockResolvedValue(
          buildLargeTardySet(55),
        );

        const start = Date.now();
        await agent.generateDailyTardinessReport(WORKDAY);
        const elapsedMs = Date.now() - start;

        // Req 18.3 ceiling is 120000ms; 5s leaves a large safety margin and
        // fails loudly on any N+1 / per-employee regression.
        expect(elapsedMs).toBeLessThan(5000);
      });

      it('reflects every one of the 55 employees in both the public and HR reports', async () => {
        prismaService.attendance.findMany.mockResolvedValue(
          buildLargeTardySet(55),
        );

        await agent.generateDailyTardinessReport(WORKDAY);

        const publicCall =
          notificationService.sendPublicAnnouncement.mock.calls[0][0];
        const hrCall =
          notificationService.sendHRTeamNotification.mock.calls[0][0];

        // Full fidelity in metadata.
        expect(publicCall.metadata.tardy_count).toBe(55);
        expect(publicCall.metadata.tardy_employees).toHaveLength(55);

        // First and last employees both appear in both report bodies.
        expect(publicCall.content).toContain('Employee 0');
        expect(publicCall.content).toContain('Employee 54');
        expect(hrCall.content).toContain('Employee 0');
        expect(hrCall.content).toContain('Employee 54');

        // Ordering from the DB is preserved end-to-end.
        expect(publicCall.content.indexOf('Employee 0')).toBeLessThan(
          publicCall.content.indexOf('Employee 54'),
        );
      });

      it('issues a constant number of agent-side queries regardless of tardy count', async () => {
        prismaService.attendance.findMany.mockResolvedValue(
          buildLargeTardySet(55),
        );

        await agent.generateDailyTardinessReport(WORKDAY);

        // Exactly one attendance query and one holiday-guard query; one bulk
        // public announcement and one bulk HR recap - no per-employee fan-out.
        expect(prismaService.attendance.findMany).toHaveBeenCalledTimes(1);
        expect(prismaService.publicHoliday.findFirst).toHaveBeenCalledTimes(1);
        expect(
          notificationService.sendPublicAnnouncement,
        ).toHaveBeenCalledTimes(1);
        expect(
          notificationService.sendHRTeamNotification,
        ).toHaveBeenCalledTimes(1);
      });
    });
  });
});
