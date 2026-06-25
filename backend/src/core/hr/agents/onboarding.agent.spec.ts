import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'reflect-metadata';
import {
  OnboardingAgent,
  OnboardingStep,
  ONBOARDING_STEP_NAMES,
  ONBOARDING_COMPLETION_TARGET_MS,
} from './onboarding.agent';
import { PrismaService } from '../../../persistence/prisma.service';
import {
  NotificationService,
  TaraNotificationType,
} from '../services/notification.service';
import { EventBusService } from '../services/event-bus.service';
import {
  OnboardingIntegrations,
  StubOnboardingIntegrations,
} from './onboarding-integrations';
import { OnboardingStatusService } from './onboarding-status.service';

/**
 * Unit tests for OnboardingAgent (Task 17.4 - Write unit tests for onboarding workflow)
 *
 * This suite consolidates and expands the incremental smoke coverage added in
 * tasks 17.1 - 17.3 into a thorough unit suite organized around the four areas
 * of the onboarding workflow:
 *
 *   1. Workflow initiation on new employee creation  (Req 6.1)
 *   2. Step completion tracking                       (Req 6.2 - 6.8, 6.10)
 *   3. Failure handling and HR notification           (Req 6.11)
 *   4. 2-hour completion timeframe                    (Req 6.9, 6.12)
 *
 * The agent is constructed directly with mocked dependencies (the established
 * pattern in this package) because the vitest transform does not emit the
 * decorator metadata Nest's DI relies on. The real, side-effect-free
 * StubOnboardingIntegrations drives the happy path deterministically; failures
 * and timing edge cases are simulated by spying on individual integrations.
 */
describe('OnboardingAgent', () => {
  let agent: OnboardingAgent;
  let prismaService: any;
  let notificationService: any;
  let eventBusService: any;
  let integrations: OnboardingIntegrations;
  let statusService: OnboardingStatusService;

  const employee = {
    id: 'emp-1',
    full_name: 'Dewi Lestari',
    email: 'dewi@maju.co.id',
    employee_code: 'EMP-001',
    department_id: 'dept-1',
    supervisor_id: 'sup-1',
    department: { name: 'Engineering' },
  };

  // ---- helpers ------------------------------------------------------------

  /** All events emitted to the Event Bus matching the given event_type. */
  const emittedEvents = (eventType: string) =>
    eventBusService.emit.mock.calls
      .map((c: any[]) => c[0])
      .filter((e: any) => e.event_type === eventType);

  /** All OnboardingStatus upsert calls whose update branch set the given status. */
  const upsertUpdatesWithStatus = (status: string) =>
    prismaService.onboardingStatus.upsert.mock.calls
      .map((c: any[]) => c[0])
      .filter((arg: any) => arg.update?.status === status);

  /** All OnboardingStatus upsert calls whose create branch set the given status. */
  const upsertCreatesWithStatus = (status: string) =>
    prismaService.onboardingStatus.upsert.mock.calls
      .map((c: any[]) => c[0])
      .filter((arg: any) => arg.create?.status === status);

  /** All HR_Team notifications for the given onboarding_event metadata value. */
  const hrNotificationsForEvent = (onboardingEvent: string) =>
    notificationService.sendHRTeamNotification.mock.calls
      .map((c: any[]) => c[0])
      .filter((n: any) => n.metadata?.onboarding_event === onboardingEvent);

  beforeEach(() => {
    prismaService = {
      employee: {
        findUnique: vi.fn().mockResolvedValue(employee),
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: 'team-1' }, { id: 'team-2' }]),
      },
      onboardingStatus: {
        upsert: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    notificationService = {
      sendPrivateNotification: vi.fn().mockResolvedValue({ id: 'notif-1' }),
      sendHRTeamNotification: vi.fn().mockResolvedValue([{ id: 'hr-1' }]),
    };

    eventBusService = {
      emit: vi.fn().mockResolvedValue({ id: 'event-1' }),
    };

    // Use the real stub integrations - they are side-effect free and exercise
    // the full happy path deterministically.
    integrations = new StubOnboardingIntegrations();

    statusService = new OnboardingStatusService(prismaService as PrismaService);

    agent = new OnboardingAgent(
      prismaService as PrismaService,
      notificationService as NotificationService,
      eventBusService as EventBusService,
      integrations,
      statusService,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Workflow initiation on new employee creation (Req 6.1)
  // =========================================================================
  describe('workflow initiation on new employee creation (Req 6.1)', () => {
    it('auto-initiates and runs the full workflow when an employee-created event is received', async () => {
      await agent.handleEmployeeCreated({
        event_type: 'hr.employee.created',
        entity: { id: 'emp-1', type: 'employee' },
        payload: { employee_id: 'emp-1' },
      });

      expect(prismaService.employee.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'emp-1' } }),
      );
      // The workflow ran end-to-end off the back of the event.
      expect(emittedEvents('onboarding.workflow_completed')).toHaveLength(1);
    });

    it('emits a workflow_started event with the employee entity when the workflow begins', async () => {
      await agent.executeWorkflow('emp-1');

      const started = emittedEvents('onboarding.workflow_started');
      expect(started).toHaveLength(1);
      expect(started[0].entity).toEqual({ id: 'emp-1', type: 'employee' });
      expect(started[0].payload.employee_id).toBe('emp-1');
      expect(started[0].payload.started_at).toBeInstanceOf(Date);
    });

    it('extracts the employee id from entity.id (preferred shape)', async () => {
      await agent.handleEmployeeCreated({
        entity: { id: 'emp-1', type: 'employee' },
      });
      expect(prismaService.employee.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'emp-1' } }),
      );
    });

    it('falls back to payload.employee_id when entity is absent', async () => {
      await agent.handleEmployeeCreated({
        event_type: 'employee.created',
        payload: { employee_id: 'emp-1' },
      });
      expect(prismaService.employee.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'emp-1' } }),
      );
    });

    it('falls back to entity_id when entity and payload.employee_id are absent', async () => {
      await agent.handleEmployeeCreated({ entity_id: 'emp-1' });
      expect(prismaService.employee.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'emp-1' } }),
      );
    });

    it('falls back to payload.id as the last resort', async () => {
      await agent.handleEmployeeCreated({ payload: { id: 'emp-1' } });
      expect(prismaService.employee.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'emp-1' } }),
      );
    });

    it('prefers entity.id over the other id sources', async () => {
      await agent.handleEmployeeCreated({
        entity: { id: 'emp-1' },
        payload: { employee_id: 'other', id: 'other-2' },
        entity_id: 'other-3',
      });
      expect(prismaService.employee.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'emp-1' } }),
      );
    });

    it('ignores an employee-created event with no resolvable employee id', async () => {
      await agent.handleEmployeeCreated({
        event_type: 'employee.created',
        payload: {},
      });
      expect(prismaService.employee.findUnique).not.toHaveBeenCalled();
    });

    it('ignores a null / empty event without throwing', async () => {
      await expect(agent.handleEmployeeCreated(null)).resolves.toBeUndefined();
      await expect(agent.handleEmployeeCreated({})).resolves.toBeUndefined();
      expect(prismaService.employee.findUnique).not.toHaveBeenCalled();
    });

    it('swallows workflow errors during auto-initiation so the event bus is never affected', async () => {
      prismaService.employee.findUnique.mockResolvedValue(null);

      // Must not throw even though executeWorkflow rejects for a missing employee.
      await expect(
        agent.handleEmployeeCreated({ entity: { id: 'missing' } }),
      ).resolves.toBeUndefined();
    });

    it('does not block the caller: handleEmployeeCreated resolves to undefined on success', async () => {
      await expect(
        agent.handleEmployeeCreated({ entity: { id: 'emp-1' } }),
      ).resolves.toBeUndefined();
    });

    it('throws when executeWorkflow is called for an employee that does not exist', async () => {
      prismaService.employee.findUnique.mockResolvedValue(null);
      await expect(agent.executeWorkflow('missing')).rejects.toThrow(
        /Employee not found/,
      );
    });
  });

  // =========================================================================
  // 2. Step completion tracking (Req 6.2 - 6.8, 6.10)
  // =========================================================================
  describe('step completion tracking (Req 6.2 - 6.8, 6.10)', () => {
    it('executes all 7 steps in canonical order and reports completion', async () => {
      const result = await agent.executeWorkflow('emp-1');

      expect(result.completed).toBe(true);
      expect(result.steps).toHaveLength(7);
      expect(result.steps.map((s) => s.step_number)).toEqual([
        1, 2, 3, 4, 5, 6, 7,
      ]);
      expect(result.steps.every((s) => s.status === 'completed')).toBe(true);
      expect(result.steps.map((s) => s.step_name)).toEqual([
        ONBOARDING_STEP_NAMES[OnboardingStep.EMAIL_ACCOUNT],
        ONBOARDING_STEP_NAMES[OnboardingStep.WELCOME_KIT],
        ONBOARDING_STEP_NAMES[OnboardingStep.ORIENTATION],
        ONBOARDING_STEP_NAMES[OnboardingStep.TEAM_INTRODUCTION],
        ONBOARDING_STEP_NAMES[OnboardingStep.SYSTEM_ACCESS],
        ONBOARDING_STEP_NAMES[OnboardingStep.SOP_DOCUMENTATION],
        ONBOARDING_STEP_NAMES[OnboardingStep.EMPLOYMENT_CONTRACT],
      ]);
    });

    it('seeds all 7 steps as pending before running any step', async () => {
      await agent.executeWorkflow('emp-1');

      const pendingSeeds = upsertCreatesWithStatus('pending');
      expect(pendingSeeds).toHaveLength(7);
      expect(
        pendingSeeds.map((c: any) => c.create.step_number).sort((a, b) => a - b),
      ).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('tracks every step through the pending -> in_progress -> completed lifecycle', async () => {
      await agent.executeWorkflow('emp-1');

      // 7 pending seeds + 7 in_progress transitions + 7 completed transitions.
      expect(prismaService.onboardingStatus.upsert).toHaveBeenCalledTimes(21);
      expect(upsertCreatesWithStatus('pending')).toHaveLength(7);
      expect(upsertUpdatesWithStatus('in_progress')).toHaveLength(7);
      expect(upsertUpdatesWithStatus('completed')).toHaveLength(7);
      expect(upsertUpdatesWithStatus('failed')).toHaveLength(0);
    });

    it('stamps started_at on in_progress and completed_at on completed for each step', async () => {
      await agent.executeWorkflow('emp-1');

      for (const call of upsertUpdatesWithStatus('in_progress')) {
        expect(call.update.started_at).toBeInstanceOf(Date);
      }
      for (const call of upsertUpdatesWithStatus('completed')) {
        expect(call.update.completed_at).toBeInstanceOf(Date);
        expect(call.update.failure_reason).toBeNull();
      }
    });

    it('seeds every step as pending before marking the first step in_progress', async () => {
      await agent.executeWorkflow('emp-1');

      const calls = prismaService.onboardingStatus.upsert.mock.calls;
      const firstInProgressIdx = calls.findIndex(
        (c: any[]) => c[0].update?.status === 'in_progress',
      );
      const pendingSeedsBeforeFirstInProgress = calls
        .slice(0, firstInProgressIdx)
        .filter((c: any[]) => c[0].create?.status === 'pending');
      expect(pendingSeedsBeforeFirstInProgress).toHaveLength(7);
    });

    it('emits an onboarding.step_completed event for each completed step', async () => {
      await agent.executeWorkflow('emp-1');

      const completed = emittedEvents('onboarding.step_completed');
      expect(completed).toHaveLength(7);
      expect(
        completed.map((e: any) => e.payload.step_number).sort((a, b) => a - b),
      ).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(completed[0].entity).toEqual({ id: 'emp-1', type: 'employee' });
    });

    it('notifies each active team member during the team introduction step (Req 6.5)', async () => {
      await agent.executeWorkflow('emp-1');

      const teamIntroCalls =
        notificationService.sendPrivateNotification.mock.calls.filter(
          (c: any[]) =>
            c[0].metadata?.onboarding_step === OnboardingStep.TEAM_INTRODUCTION,
        );
      expect(teamIntroCalls).toHaveLength(2);
      expect(teamIntroCalls[0][0].type).toBe(
        TaraNotificationType.ONBOARDING_NOTIFICATION,
      );
      // Excludes the new joiner and only active members are queried.
      expect(prismaService.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            department_id: 'dept-1',
            employment_status: 'active',
            id: { not: 'emp-1' },
          }),
        }),
      );
    });

    it('does not query team members when the employee has no department', async () => {
      prismaService.employee.findUnique.mockResolvedValue({
        ...employee,
        department_id: null,
        department: null,
      });

      const result = await agent.executeWorkflow('emp-1');

      expect(result.completed).toBe(true);
      expect(prismaService.employee.findMany).not.toHaveBeenCalled();
      const teamStep = result.steps.find(
        (s) => s.step_number === OnboardingStep.TEAM_INTRODUCTION,
      );
      expect(teamStep?.details?.team_members_notified).toBe(0);
    });

    it('exposes aggregated onboarding progress via getOnboardingProgress (Req 6.10)', async () => {
      prismaService.onboardingStatus.findMany.mockResolvedValue([
        {
          step_number: 1,
          step_name: ONBOARDING_STEP_NAMES[OnboardingStep.EMAIL_ACCOUNT],
          status: 'completed',
          started_at: new Date(),
          completed_at: new Date(),
          failure_reason: null,
        },
        {
          step_number: 2,
          step_name: ONBOARDING_STEP_NAMES[OnboardingStep.WELCOME_KIT],
          status: 'in_progress',
          started_at: new Date(),
          completed_at: null,
          failure_reason: null,
        },
        {
          step_number: 3,
          step_name: ONBOARDING_STEP_NAMES[OnboardingStep.ORIENTATION],
          status: 'pending',
          started_at: null,
          completed_at: null,
          failure_reason: null,
        },
      ]);

      const progress = await agent.getOnboardingProgress('emp-1');

      expect(progress.employee_id).toBe('emp-1');
      expect(progress.total_steps).toBe(3);
      expect(progress.completed_steps).toBe(1);
      expect(progress.in_progress_steps).toBe(1);
      expect(progress.pending_steps).toBe(1);
      expect(progress.failed_steps).toBe(0);
      expect(progress.is_complete).toBe(false);
      expect(progress.steps.map((s) => s.step_number)).toEqual([1, 2, 3]);
    });

    it('reports is_complete when every tracked step is completed', async () => {
      prismaService.onboardingStatus.findMany.mockResolvedValue(
        [1, 2, 3, 4, 5, 6, 7].map((n) => ({
          step_number: n,
          step_name: ONBOARDING_STEP_NAMES[n as OnboardingStep],
          status: 'completed',
          started_at: new Date(),
          completed_at: new Date(),
          failure_reason: null,
        })),
      );

      const progress = await agent.getOnboardingProgress('emp-1');
      expect(progress.total_steps).toBe(7);
      expect(progress.completed_steps).toBe(7);
      expect(progress.is_complete).toBe(true);
    });
  });

  // =========================================================================
  // 3. Failure handling and HR notification (Req 6.11)
  // =========================================================================
  describe('failure handling and HR notification (Req 6.11)', () => {
    it('halts the workflow at the failing step and records the failure reason', async () => {
      vi.spyOn(integrations, 'scheduleOrientation').mockRejectedValue(
        new Error('calendar provider unavailable'),
      );

      const result = await agent.executeWorkflow('emp-1');

      expect(result.completed).toBe(false);
      expect(result.failed_step?.step_number).toBe(OnboardingStep.ORIENTATION);
      expect(result.failed_step?.status).toBe('failed');
      expect(result.failed_step?.failure_reason).toContain(
        'calendar provider unavailable',
      );
      // Steps 1, 2 completed, 3 failed -> only 3 step results recorded.
      expect(result.steps).toHaveLength(3);
      expect(result.steps[2].status).toBe('failed');
    });

    it('does not run any steps after the failed step', async () => {
      const provisionSpy = vi.spyOn(integrations, 'provisionSystemAccess');
      const sopSpy = vi.spyOn(integrations, 'deliverSopDocumentation');
      const contractSpy = vi.spyOn(integrations, 'sendContractForSignature');
      vi.spyOn(integrations, 'scheduleOrientation').mockRejectedValue(
        new Error('calendar provider unavailable'),
      );

      await agent.executeWorkflow('emp-1');

      // Step 5, 6, 7 integrations must never be invoked once step 3 fails.
      expect(provisionSpy).not.toHaveBeenCalled();
      expect(sopSpy).not.toHaveBeenCalled();
      expect(contractSpy).not.toHaveBeenCalled();
    });

    it('leaves steps after the failure as pending (never transitions them to in_progress)', async () => {
      vi.spyOn(integrations, 'scheduleOrientation').mockRejectedValue(
        new Error('calendar provider unavailable'),
      );

      await agent.executeWorkflow('emp-1');

      // Only steps 1, 2, 3 ever moved to in_progress; 4-7 stay at their pending seed.
      const inProgressSteps = upsertUpdatesWithStatus('in_progress').map(
        (c: any) => c.where.employee_id_step_number.step_number,
      );
      expect(inProgressSteps.sort((a: number, b: number) => a - b)).toEqual([
        1, 2, 3,
      ]);
    });

    it('persists the failure with reason and completed_at on the failed step', async () => {
      vi.spyOn(integrations, 'scheduleOrientation').mockRejectedValue(
        new Error('calendar provider unavailable'),
      );

      await agent.executeWorkflow('emp-1');

      const failedWrites = upsertUpdatesWithStatus('failed');
      expect(failedWrites).toHaveLength(1);
      const failed = failedWrites[0];
      expect(failed.where.employee_id_step_number.step_number).toBe(
        OnboardingStep.ORIENTATION,
      );
      expect(failed.update.failure_reason).toContain(
        'calendar provider unavailable',
      );
      expect(failed.update.completed_at).toBeInstanceOf(Date);
    });

    it('emits a single onboarding.step_failed event with the failure reason', async () => {
      vi.spyOn(integrations, 'scheduleOrientation').mockRejectedValue(
        new Error('calendar provider unavailable'),
      );

      await agent.executeWorkflow('emp-1');

      const failedEvents = emittedEvents('onboarding.step_failed');
      expect(failedEvents).toHaveLength(1);
      expect(failedEvents[0].payload.step_number).toBe(
        OnboardingStep.ORIENTATION,
      );
      expect(failedEvents[0].payload.failure_reason).toContain(
        'calendar provider unavailable',
      );
    });

    it('notifies HR_Team exactly once with the specific failure reason', async () => {
      vi.spyOn(integrations, 'scheduleOrientation').mockRejectedValue(
        new Error('calendar provider unavailable'),
      );

      await agent.executeWorkflow('emp-1');

      expect(notificationService.sendHRTeamNotification).toHaveBeenCalledTimes(
        1,
      );
      const hrCall = notificationService.sendHRTeamNotification.mock.calls[0][0];
      expect(hrCall.type).toBe(
        TaraNotificationType.ONBOARDING_COMPLETION_SUMMARY,
      );
      expect(hrCall.metadata.onboarding_event).toBe('step_failed');
      expect(hrCall.metadata.step_number).toBe(OnboardingStep.ORIENTATION);
      expect(hrCall.metadata.failure_reason).toContain(
        'calendar provider unavailable',
      );
      expect(hrCall.content).toContain('calendar provider unavailable');
    });

    it('does NOT send a completion summary or workflow_completed event when a step fails (Req 6.9)', async () => {
      vi.spyOn(integrations, 'scheduleOrientation').mockRejectedValue(
        new Error('calendar provider unavailable'),
      );

      await agent.executeWorkflow('emp-1');

      expect(hrNotificationsForEvent('workflow_completed')).toHaveLength(0);
      expect(emittedEvents('onboarding.workflow_completed')).toHaveLength(0);
    });

    it('handles a failure on the very first step (no completed steps before it)', async () => {
      vi.spyOn(integrations, 'createEmailAccount').mockRejectedValue(
        new Error('email provider down'),
      );

      const result = await agent.executeWorkflow('emp-1');

      expect(result.completed).toBe(false);
      expect(result.steps).toHaveLength(1);
      expect(result.failed_step?.step_number).toBe(
        OnboardingStep.EMAIL_ACCOUNT,
      );
      expect(upsertUpdatesWithStatus('completed')).toHaveLength(0);
    });

    it('handles a failure on the final step (steps 1-6 completed)', async () => {
      vi.spyOn(integrations, 'sendContractForSignature').mockRejectedValue(
        new Error('e-signature provider down'),
      );

      const result = await agent.executeWorkflow('emp-1');

      expect(result.completed).toBe(false);
      expect(result.steps).toHaveLength(7);
      expect(result.failed_step?.step_number).toBe(
        OnboardingStep.EMPLOYMENT_CONTRACT,
      );
      expect(upsertUpdatesWithStatus('completed')).toHaveLength(6);
      expect(emittedEvents('onboarding.workflow_completed')).toHaveLength(0);
    });

    it('records "Unknown error" when a step rejects without a message', async () => {
      // Reject with a non-Error value (no .message property).
      vi.spyOn(integrations, 'scheduleOrientation').mockRejectedValue(
        'boom' as any,
      );

      const result = await agent.executeWorkflow('emp-1');

      expect(result.failed_step?.failure_reason).toBe('Unknown error');
      const failed = upsertUpdatesWithStatus('failed')[0];
      expect(failed.update.failure_reason).toBe('Unknown error');
    });

    it('still returns the failed result when the HR failure notification itself fails', async () => {
      vi.spyOn(integrations, 'scheduleOrientation').mockRejectedValue(
        new Error('calendar provider unavailable'),
      );
      notificationService.sendHRTeamNotification.mockRejectedValue(
        new Error('notification service down'),
      );

      const result = await agent.executeWorkflow('emp-1');

      // The notification failure is swallowed; the workflow result is intact.
      expect(result.completed).toBe(false);
      expect(result.failed_step?.step_number).toBe(OnboardingStep.ORIENTATION);
    });
  });

  // =========================================================================
  // 4. 2-hour completion timeframe (Req 6.9, 6.12)
  // =========================================================================
  describe('2-hour completion timeframe (Req 6.9, 6.12)', () => {
    it('tracks duration and flags completion within the 2-hour target on the happy path', async () => {
      const result = await agent.executeWorkflow('emp-1');

      expect(result.completed).toBe(true);
      expect(result.started_at).toBeInstanceOf(Date);
      expect(result.completed_at).toBeInstanceOf(Date);
      expect(typeof result.duration_ms).toBe('number');
      expect(result.duration_ms).toBeGreaterThanOrEqual(0);
      // Stub integrations run near-instantly, well within the 2-hour target.
      expect(result.completed_within_target).toBe(true);
      expect(result.duration_ms!).toBeLessThanOrEqual(
        ONBOARDING_COMPLETION_TARGET_MS,
      );
    });

    it('notifies HR with a completion summary marked within-target on success (Req 6.9)', async () => {
      await agent.executeWorkflow('emp-1');

      const summaries = hrNotificationsForEvent('workflow_completed');
      expect(summaries).toHaveLength(1);
      const summary = summaries[0];
      expect(summary.type).toBe(
        TaraNotificationType.ONBOARDING_COMPLETION_SUMMARY,
      );
      expect(summary.metadata.completed_within_target).toBe(true);
      expect(summary.metadata.target_ms).toBe(ONBOARDING_COMPLETION_TARGET_MS);
      expect(summary.metadata.steps).toHaveLength(7);
      expect(summary.content).toContain('dalam target 2 jam');
    });

    it('emits a single onboarding.workflow_completed event with duration metadata', async () => {
      await agent.executeWorkflow('emp-1');

      const completed = emittedEvents('onboarding.workflow_completed');
      expect(completed).toHaveLength(1);
      expect(completed[0].entity).toEqual({ id: 'emp-1', type: 'employee' });
      expect(completed[0].payload.duration_ms).toBeGreaterThanOrEqual(0);
      expect(completed[0].payload.completed_within_target).toBe(true);
      expect(completed[0].payload.target_ms).toBe(
        ONBOARDING_COMPLETION_TARGET_MS,
      );
      expect(completed[0].payload.steps).toHaveLength(7);
      expect(completed[0].payload.started_at).toBeInstanceOf(Date);
      expect(completed[0].payload.completed_at).toBeInstanceOf(Date);
    });

    it('flags completion as outside the target when the workflow exceeds 2 hours (Req 6.12)', async () => {
      // Use fake timers so we can advance the clock past the 2-hour target
      // between the workflow start and finish without real waiting.
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

      // Advance the clock by just over the target during the first step.
      const realCreate = integrations.createEmailAccount.bind(integrations);
      vi.spyOn(integrations, 'createEmailAccount').mockImplementation(
        async (emp) => {
          vi.setSystemTime(
            new Date(
              new Date('2026-01-01T00:00:00.000Z').getTime() +
                ONBOARDING_COMPLETION_TARGET_MS +
                60_000,
            ),
          );
          return realCreate(emp);
        },
      );

      const result = await agent.executeWorkflow('emp-1');

      expect(result.completed).toBe(true);
      expect(result.completed_within_target).toBe(false);
      expect(result.duration_ms!).toBeGreaterThan(
        ONBOARDING_COMPLETION_TARGET_MS,
      );

      // HR completion summary reflects the SLA breach.
      const summary = hrNotificationsForEvent('workflow_completed')[0];
      expect(summary.metadata.completed_within_target).toBe(false);
      expect(summary.content).toContain('MELEBIHI target 2 jam');

      // The workflow_completed event carries the breach flag too.
      const completedEvent = emittedEvents('onboarding.workflow_completed')[0];
      expect(completedEvent.payload.completed_within_target).toBe(false);
    });

    it('logs a warning when the 2-hour target is exceeded', async () => {
      const warnSpy = vi.spyOn((agent as any).logger, 'warn');

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const realCreate = integrations.createEmailAccount.bind(integrations);
      vi.spyOn(integrations, 'createEmailAccount').mockImplementation(
        async (emp) => {
          vi.setSystemTime(
            new Date(
              new Date('2026-01-01T00:00:00.000Z').getTime() +
                ONBOARDING_COMPLETION_TARGET_MS +
                60_000,
            ),
          );
          return realCreate(emp);
        },
      );

      await agent.executeWorkflow('emp-1');

      const exceededWarn = warnSpy.mock.calls.find((c) =>
        String(c[0]).includes('exceeding'),
      );
      expect(exceededWarn).toBeDefined();
    });

    it('still completes successfully when the HR completion summary notification fails', async () => {
      notificationService.sendHRTeamNotification.mockRejectedValue(
        new Error('notification service down'),
      );

      const result = await agent.executeWorkflow('emp-1');

      // Completion summary failure is swallowed; the workflow still completes.
      expect(result.completed).toBe(true);
      expect(emittedEvents('onboarding.workflow_completed')).toHaveLength(1);
    });
  });
});
