import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'reflect-metadata';
import { SaldoCutiAgent } from './saldo-cuti.agent';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from '../services/event-bus.service';

/**
 * Unit tests for SaldoCutiAgent (Saldo Cuti / Leave Balance Agent).
 *
 * Task 18.4 consolidates and expands the incremental coverage from tasks
 * 18.1-18.3 into one thorough unit suite. The four areas under test map to the
 * task bullets:
 *
 *  1. Balance calculation accuracy   - Req 7.2, 7.6
 *  2. Carryover rules application     - Req 7.7 (+ Settings 16.12 expiration)
 *  3. Monthly recap generation        - Req 7.4, 7.5
 *  4. Private balance access          - Req 7.8 (privacy / single-employee scope)
 *
 * Supporting requirements exercised along the way:
 *  - 7.1 real-time / non-blocking reads (event emission never fails a query)
 *  - 7.3 upcoming approved leave dates
 *
 * The agent is constructed directly with mocked dependencies (the established
 * pattern in this package) because the vitest transform does not emit the
 * decorator metadata Nest's DI relies on.
 */
describe('SaldoCutiAgent', () => {
  let agent: SaldoCutiAgent;
  let prismaService: any;
  let eventBusService: any;
  let notificationService: any;

  /** A LeaveBalance row with sensible defaults; override fields per test. */
  const balanceRow = (overrides: Record<string, any> = {}) => ({
    total_entitlement: 12,
    used_days: 0,
    remaining_days: 12,
    carryover_days: 0,
    carryover_expiry_date: null,
    ...overrides,
  });

  /** Start-of-day copy of a date (mirrors the agent's internal normalisation). */
  const startOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  };

  beforeEach(() => {
    prismaService = {
      leaveBalance: { findUnique: vi.fn() },
      leaveRequest: { findMany: vi.fn() },
      employee: { findMany: vi.fn() },
    };

    eventBusService = {
      emit: vi.fn().mockResolvedValue({ id: 'event-1' }),
    };

    notificationService = {
      sendPrivateNotification: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    agent = new SaldoCutiAgent(
      prismaService as PrismaService,
      eventBusService as EventBusService,
      notificationService as any,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. BALANCE CALCULATION ACCURACY (Req 7.2, 7.6)
  // ---------------------------------------------------------------------------
  describe('balance calculation accuracy (Req 7.2, 7.6)', () => {
    it('returns the stored entitlement/used/remaining breakdown and upcoming leave', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({
          total_entitlement: 12,
          used_days: 4,
          remaining_days: 8,
          carryover_days: 2,
          carryover_expiry_date: new Date(2026, 2, 31), // 2026-03-31
        }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        {
          id: 'lr-1',
          leave_type: 'annual',
          start_date: new Date(2026, 0, 10),
          end_date: new Date(2026, 0, 12),
          total_days: 3,
        },
      ]);

      const result = await agent.queryLeaveBalance('emp-1', 2026);

      // Req 7.2: balance breakdown.
      expect(result.has_balance).toBe(true);
      expect(result.total_entitlement).toBe(12);
      expect(result.used_days).toBe(4);
      expect(result.remaining_days).toBe(8);
      expect(result.carryover_days).toBe(2);
      expect(result.carryover_expiry_date).toBe('2026-03-31');

      // Req 7.3: upcoming approved leave dates.
      expect(result.upcoming_leave).toEqual([
        {
          leave_request_id: 'lr-1',
          leave_type: 'annual',
          start_date: '2026-01-10',
          end_date: '2026-01-12',
          total_days: 3,
        },
      ]);
    });

    it('derives computed_used_days by summing every approved request in the year (Req 7.6)', async () => {
      const futureExpiry = new Date();
      futureExpiry.setFullYear(futureExpiry.getFullYear() + 1);

      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({ total_entitlement: 12, used_days: 5, remaining_days: 9 }),
      );
      // 3 + 2 + 4 = 9 used days across three approved requests.
      prismaService.leaveRequest.findMany.mockResolvedValue([
        { total_days: 3 },
        { total_days: 2 },
        { total_days: 4 },
      ]);

      const result = await agent.computeBalance('emp-1', 2026);

      expect(result.computed_used_days).toBe(9);
    });

    it('computes available_balance = entitlement + valid carryover - used', async () => {
      const futureExpiry = new Date();
      futureExpiry.setFullYear(futureExpiry.getFullYear() + 1);

      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({
          total_entitlement: 12,
          used_days: 5,
          remaining_days: 9,
          carryover_days: 2,
          carryover_expiry_date: futureExpiry,
        }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        { total_days: 3 },
        { total_days: 2 },
      ]);

      const result = await agent.computeBalance('emp-1', 2026);

      expect(result.computed_used_days).toBe(5);
      expect(result.carryover_valid_days).toBe(2);
      // 12 entitlement + 2 carryover - 5 used = 9.
      expect(result.available_balance).toBe(9);
    });

    it('clamps available_balance to zero and never returns a negative value', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({ total_entitlement: 12, used_days: 15, remaining_days: 0 }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        { total_days: 15 },
      ]);

      const result = await agent.computeBalance('emp-1', 2026);

      expect(result.computed_used_days).toBe(15);
      expect(result.available_balance).toBe(0);
    });

    it('reports a reconciled balance when stored used_days matches the live total', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({ total_entitlement: 12, used_days: 5, remaining_days: 7 }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        { total_days: 3 },
        { total_days: 2 },
      ]);

      const result = await agent.computeBalance('emp-1', 2026);

      expect(result.stored_used_days).toBe(5);
      expect(result.computed_used_days).toBe(5);
      expect(result.reconciled).toBe(true);
    });

    it('flags reconciliation drift when stored used_days differs from approved leave', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({ total_entitlement: 12, used_days: 2, remaining_days: 10 }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        { total_days: 3 },
        { total_days: 2 },
      ]);

      const result = await agent.computeBalance('emp-1', 2026);

      expect(result.computed_used_days).toBe(5);
      expect(result.stored_used_days).toBe(2);
      expect(result.reconciled).toBe(false);
    });

    it('handles an employee with no approved leave (zero used, full balance)', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({ total_entitlement: 12, used_days: 0, remaining_days: 12 }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      const result = await agent.computeBalance('emp-1', 2026);

      expect(result.computed_used_days).toBe(0);
      expect(result.available_balance).toBe(12);
      expect(result.reconciled).toBe(true);
    });

    it('returns a zeroed balance when no record exists (edge case, Req 7.2)', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(null);
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      const result = await agent.queryLeaveBalance('emp-unknown', 2026);

      expect(result.has_balance).toBe(false);
      expect(result.total_entitlement).toBe(0);
      expect(result.used_days).toBe(0);
      expect(result.remaining_days).toBe(0);
      expect(result.carryover_days).toBe(0);
      expect(result.carryover_expiry_date).toBeNull();
      expect(result.available_balance).toBe(0);
      expect(result.upcoming_leave).toEqual([]);
    });

    it('defaults to the current calendar year when none is provided', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(null);
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      const result = await agent.queryLeaveBalance('emp-1');

      expect(result.year).toBe(new Date().getFullYear());
    });

    it('sums used days over the target calendar year window [Jan 1, next Jan 1)', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(balanceRow());
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      await agent.computeBalance('emp-1', 2026);

      // The year-sum read must be bounded to the requested year only (Req 7.6).
      const yearArgs = prismaService.leaveRequest.findMany.mock.calls[0][0];
      expect(yearArgs.where.status).toBe('approved');
      expect(yearArgs.where.start_date.gte).toEqual(new Date(2026, 0, 1));
      expect(yearArgs.where.start_date.lt).toEqual(new Date(2027, 0, 1));
    });

    it('queryLeaveBalance surfaces the carryover-aware derived fields additively', async () => {
      const futureExpiry = new Date();
      futureExpiry.setFullYear(futureExpiry.getFullYear() + 1);

      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({
          total_entitlement: 12,
          used_days: 3,
          remaining_days: 9,
          carryover_days: 2,
          carryover_expiry_date: futureExpiry,
        }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        {
          id: 'lr-1',
          leave_type: 'annual',
          start_date: new Date(2026, 5, 1),
          end_date: new Date(2026, 5, 3),
          total_days: 3,
        },
      ]);

      const result = await agent.queryLeaveBalance('emp-1', 2026);

      // Stored 18.1 fields remain intact.
      expect(result.total_entitlement).toBe(12);
      expect(result.used_days).toBe(3);
      expect(result.remaining_days).toBe(9);
      // Derived 18.3 fields present and correct.
      expect(result.computed_used_days).toBe(3);
      expect(result.carryover_valid_days).toBe(2);
      expect(result.available_balance).toBe(11); // 12 + 2 - 3
      expect(result.reconciled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. CARRYOVER RULES APPLICATION (Req 7.7)
  // ---------------------------------------------------------------------------
  describe('carryover rules application (Req 7.7)', () => {
    it('counts carryover that expires in the future toward the balance', async () => {
      const futureExpiry = new Date();
      futureExpiry.setFullYear(futureExpiry.getFullYear() + 1);

      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({
          total_entitlement: 12,
          used_days: 4,
          carryover_days: 3,
          carryover_expiry_date: futureExpiry,
        }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        { total_days: 4 },
      ]);

      const result = await agent.computeBalance('emp-1', 2026);

      expect(result.carryover_expired).toBe(false);
      expect(result.carryover_valid_days).toBe(3);
      // 12 + 3 - 4 = 11.
      expect(result.available_balance).toBe(11);
    });

    it('excludes carryover that has already expired (Req 7.7)', async () => {
      const pastExpiry = new Date();
      pastExpiry.setDate(pastExpiry.getDate() - 1); // expired yesterday

      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({
          total_entitlement: 12,
          used_days: 4,
          carryover_days: 3,
          carryover_expiry_date: pastExpiry,
        }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        { total_days: 4 },
      ]);

      const result = await agent.computeBalance('emp-1', 2026);

      expect(result.carryover_expired).toBe(true);
      expect(result.carryover_valid_days).toBe(0);
      // 12 + 0 - 4 = 8 (expired carryover does not count).
      expect(result.available_balance).toBe(8);
      // The raw stored carryover figure is still surfaced for transparency.
      expect(result.carryover_days).toBe(3);
    });

    it('treats a null expiry date as carryover that never expires', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({
          total_entitlement: 12,
          used_days: 2,
          carryover_days: 5,
          carryover_expiry_date: null,
        }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        { total_days: 2 },
      ]);

      const result = await agent.computeBalance('emp-1', 2026);

      expect(result.carryover_expired).toBe(false);
      expect(result.carryover_valid_days).toBe(5);
      expect(result.carryover_expiry_date).toBeNull();
      // 12 + 5 - 2 = 15.
      expect(result.available_balance).toBe(15);
    });

    it('keeps carryover valid on the boundary when expiry == today', async () => {
      // Expiry set to the start of the current day: the agent compares
      // date-only, so carryover is still valid on its expiry date itself.
      const today = startOfDay(new Date());

      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({
          total_entitlement: 10,
          used_days: 1,
          carryover_days: 4,
          carryover_expiry_date: today,
        }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        { total_days: 1 },
      ]);

      const result = await agent.computeBalance('emp-1', 2026);

      expect(result.carryover_expired).toBe(false);
      expect(result.carryover_valid_days).toBe(4);
      // 10 + 4 - 1 = 13.
      expect(result.available_balance).toBe(13);
    });

    it('ignores expiry date when there is no carryover (carryover_days = 0)', async () => {
      const pastExpiry = new Date();
      pastExpiry.setDate(pastExpiry.getDate() - 10);

      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({
          total_entitlement: 12,
          used_days: 0,
          carryover_days: 0,
          carryover_expiry_date: pastExpiry,
        }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      const result = await agent.computeBalance('emp-1', 2026);

      // No carryover means nothing to expire.
      expect(result.carryover_expired).toBe(false);
      expect(result.carryover_valid_days).toBe(0);
      expect(result.available_balance).toBe(12);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. MONTHLY RECAP GENERATION (Req 7.4, 7.5)
  // ---------------------------------------------------------------------------
  describe('monthly recap generation (Req 7.4, 7.5)', () => {
    it('is scheduled at 08:00 WIB on the 1st of every month (Asia/Jakarta)', () => {
      // The @Cron decorator stores its options as method metadata. Verify the
      // schedule expression and timezone without invoking the scheduler.
      const cronOptions = Reflect.getMetadata(
        'SCHEDULE_CRON_OPTIONS',
        agent.sendMonthlyRecap,
      );

      expect(cronOptions).toBeDefined();
      expect(cronOptions.cronTime).toBe('0 8 1 * *');
      expect(cronOptions.timeZone).toBe('Asia/Jakarta');
    });

    it('sends one private LEAVE_BALANCE_RECAP per active employee (Req 7.4, 7.5)', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Budi' },
        { id: 'emp-2', full_name: 'Sari' },
      ]);
      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({ used_days: 4, remaining_days: 8 }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      await agent.sendMonthlyRecap(2026);

      expect(notificationService.sendPrivateNotification).toHaveBeenCalledTimes(
        2,
      );
      const recipients =
        notificationService.sendPrivateNotification.mock.calls.map(
          (c: any[]) => c[0].recipient_id,
        );
      expect(recipients).toEqual(['emp-1', 'emp-2']);
      // Each recap is the private leave_balance_recap type.
      for (const call of notificationService.sendPrivateNotification.mock
        .calls) {
        expect(call[0].type).toBe('leave_balance_recap');
      }
    });

    it('only targets active employees', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Budi' },
      ]);
      prismaService.leaveBalance.findUnique.mockResolvedValue(balanceRow());
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      await agent.sendMonthlyRecap(2026);

      const empArgs = prismaService.employee.findMany.mock.calls[0][0];
      expect(empArgs.where.employment_status).toBe('active');
    });

    it('builds recap content and metadata that reflect the balance snapshot', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Budi' },
      ]);
      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({
          total_entitlement: 12,
          used_days: 4,
          remaining_days: 8,
          carryover_days: 2,
          carryover_expiry_date: new Date(2026, 2, 31),
        }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([
        {
          id: 'lr-1',
          leave_type: 'annual',
          start_date: new Date(2026, 6, 1),
          end_date: new Date(2026, 6, 3),
          total_days: 3,
        },
      ]);

      await agent.sendMonthlyRecap(2026);

      const payload =
        notificationService.sendPrivateNotification.mock.calls[0][0];

      expect(payload.title).toBe('Rekap Saldo Cuti 2026');
      // Content summarises the figures and lists the upcoming leave.
      expect(payload.content).toContain('Budi');
      expect(payload.content).toContain('Total hak cuti: 12 hari');
      expect(payload.content).toContain('Cuti terpakai: 4 hari');
      expect(payload.content).toContain('Sisa cuti: 8 hari');
      expect(payload.content).toContain('Cuti carryover: 2 hari');
      expect(payload.content).toContain('2026-07-01 s/d 2026-07-03');

      // Metadata mirrors the snapshot for downstream consumers.
      expect(payload.metadata).toEqual(
        expect.objectContaining({
          recap_type: 'monthly_leave_balance',
          year: 2026,
          has_balance: true,
          total_entitlement: 12,
          used_days: 4,
          remaining_days: 8,
          carryover_days: 2,
        }),
      );
      expect(payload.metadata.upcoming_leave).toHaveLength(1);
    });

    it('isolates per-employee failures so one bad send does not abort the batch', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Budi' },
        { id: 'emp-2', full_name: 'Sari' },
      ]);
      prismaService.leaveBalance.findUnique.mockResolvedValue(balanceRow());
      prismaService.leaveRequest.findMany.mockResolvedValue([]);
      notificationService.sendPrivateNotification
        .mockRejectedValueOnce(new Error('delivery failed'))
        .mockResolvedValueOnce({ id: 'notif-2' });

      await expect(agent.sendMonthlyRecap(2026)).resolves.toBeUndefined();

      // Both employees were attempted despite the first failing.
      expect(notificationService.sendPrivateNotification).toHaveBeenCalledTimes(
        2,
      );
      // Only the successful send is counted in the recap event.
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'leave_balance.monthly_recap_sent',
          payload: expect.objectContaining({
            recipients_count: 1,
            total_employees: 2,
          }),
        }),
      );
    });

    it('is a no-op when there are no active employees', async () => {
      prismaService.employee.findMany.mockResolvedValue([]);

      await expect(agent.sendMonthlyRecap(2026)).resolves.toBeUndefined();
      expect(
        notificationService.sendPrivateNotification,
      ).not.toHaveBeenCalled();
      // No recap event is emitted when there is nothing to send.
      expect(eventBusService.emit).not.toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'leave_balance.monthly_recap_sent',
        }),
      );
    });

    it('emits a leave_balance.monthly_recap_sent event after the batch', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Budi' },
        { id: 'emp-2', full_name: 'Sari' },
      ]);
      prismaService.leaveBalance.findUnique.mockResolvedValue(balanceRow());
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      await agent.sendMonthlyRecap(2026);

      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'leave_balance.monthly_recap_sent',
          actor: expect.objectContaining({ id: 'saldo_cuti_agent' }),
          payload: expect.objectContaining({
            year: 2026,
            recipients_count: 2,
            total_employees: 2,
          }),
        }),
      );
    });

    it('never throws even if the employee lookup fails (scheduled run safety)', async () => {
      prismaService.employee.findMany.mockRejectedValue(new Error('db down'));

      await expect(agent.sendMonthlyRecap(2026)).resolves.toBeUndefined();
      expect(
        notificationService.sendPrivateNotification,
      ).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. PRIVATE BALANCE ACCESS (Req 7.8)
  // ---------------------------------------------------------------------------
  describe('private balance access (Req 7.8)', () => {
    it('scopes queryLeaveBalance reads to the single requesting employee', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(balanceRow());
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      await agent.queryLeaveBalance('emp-42', 2026);

      // Balance read is keyed by the employee_id_year unique index.
      expect(prismaService.leaveBalance.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employee_id_year: { employee_id: 'emp-42', year: 2026 } },
        }),
      );
      // Every leave-request read filters by the same employee_id only.
      for (const call of prismaService.leaveRequest.findMany.mock.calls) {
        expect(call[0].where.employee_id).toBe('emp-42');
      }
    });

    it('scopes computeBalance reads to the single requesting employee', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(balanceRow());
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      await agent.computeBalance('emp-7', 2026);

      expect(prismaService.leaveBalance.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employee_id_year: { employee_id: 'emp-7', year: 2026 } },
        }),
      );
      const reqArgs = prismaService.leaveRequest.findMany.mock.calls[0][0];
      expect(reqArgs.where.employee_id).toBe('emp-7');
      expect(reqArgs.where.status).toBe('approved');
    });

    it('never issues a read that omits or crosses employee_id (no cross-employee reads)', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(balanceRow());
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      await agent.queryLeaveBalance('emp-99', 2026);
      await agent.computeBalance('emp-99', 2026);

      // No balance read may target a different employee.
      for (const call of prismaService.leaveBalance.findUnique.mock.calls) {
        expect(call[0].where.employee_id_year.employee_id).toBe('emp-99');
      }
      // No leave-request read may be unscoped or target a different employee.
      for (const call of prismaService.leaveRequest.findMany.mock.calls) {
        expect(call[0].where.employee_id).toBe('emp-99');
      }
    });

    it('the monthly recap is sent privately to each employee about their own balance only', async () => {
      prismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', full_name: 'Budi' },
        { id: 'emp-2', full_name: 'Sari' },
      ]);
      prismaService.leaveBalance.findUnique.mockResolvedValue(balanceRow());
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      await agent.sendMonthlyRecap(2026);

      // Each balance read during the recap is scoped to the employee it is for,
      // and the notification recipient matches that same employee.
      const balanceEmployeeIds =
        prismaService.leaveBalance.findUnique.mock.calls.map(
          (c: any[]) => c[0].where.employee_id_year.employee_id,
        );
      expect(balanceEmployeeIds).toEqual(['emp-1', 'emp-2']);

      const recipientIds =
        notificationService.sendPrivateNotification.mock.calls.map(
          (c: any[]) => c[0].recipient_id,
        );
      expect(recipientIds).toEqual(['emp-1', 'emp-2']);
    });
  });

  // ---------------------------------------------------------------------------
  // Supporting behaviour: real-time / non-blocking reads (Req 7.1)
  // ---------------------------------------------------------------------------
  describe('real-time query behaviour (Req 7.1)', () => {
    it('emits a leave_balance.query_executed event for monitoring', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(balanceRow());
      prismaService.leaveRequest.findMany.mockResolvedValue([]);

      await agent.queryLeaveBalance('emp-1', 2026);

      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'leave_balance.query_executed',
          entity: { id: 'emp-1', type: 'employee' },
        }),
      );
    });

    it('does not fail the query when event emission throws', async () => {
      prismaService.leaveBalance.findUnique.mockResolvedValue(
        balanceRow({ used_days: 0, remaining_days: 12 }),
      );
      prismaService.leaveRequest.findMany.mockResolvedValue([]);
      eventBusService.emit.mockRejectedValue(new Error('bus down'));

      const result = await agent.queryLeaveBalance('emp-1', 2026);

      expect(result.remaining_days).toBe(12);
      expect(eventBusService.emit).toHaveBeenCalledTimes(1);
    });
  });
});
