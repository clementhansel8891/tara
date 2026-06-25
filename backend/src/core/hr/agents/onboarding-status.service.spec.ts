import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'reflect-metadata';
import { OnboardingStatusService } from './onboarding-status.service';
import { PrismaService } from '../../../persistence/prisma.service';

/**
 * Smoke tests for OnboardingStatusService (Task 17.2)
 *
 * Verifies the full per-step lifecycle persistence and progress query:
 * - 6.10: every step is tracked (pending -> in_progress -> completed/failed)
 *         with started_at / completed_at timestamps
 * - 6.11: failure_reason is captured when a step fails
 */
describe('OnboardingStatusService', () => {
  let service: OnboardingStatusService;
  let prismaService: any;

  beforeEach(() => {
    prismaService = {
      onboardingStatus: {
        upsert: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    service = new OnboardingStatusService(prismaService as PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('seeds every provided step as pending (Req 6.10)', async () => {
    await service.initializeSteps('emp-1', [
      { step_number: 1, step_name: 'Create Email Account' },
      { step_number: 2, step_name: 'Send Welcome Kit' },
    ]);

    expect(prismaService.onboardingStatus.upsert).toHaveBeenCalledTimes(2);
    const firstCall = prismaService.onboardingStatus.upsert.mock.calls[0][0];
    expect(firstCall.create.status).toBe('pending');
    expect(firstCall.update.status).toBe('pending');
    // A re-seed clears any stale timestamps / failure reason.
    expect(firstCall.update.started_at).toBeNull();
    expect(firstCall.update.completed_at).toBeNull();
    expect(firstCall.update.failure_reason).toBeNull();
  });

  it('stamps started_at when marking a step in_progress (Req 6.10)', async () => {
    await service.markStepInProgress('emp-1', 1, 'Create Email Account');

    const call = prismaService.onboardingStatus.upsert.mock.calls[0][0];
    expect(call.update.status).toBe('in_progress');
    expect(call.update.started_at).toBeInstanceOf(Date);
    expect(call.update.completed_at).toBeNull();
  });

  it('stamps completed_at and clears failure_reason on completion (Req 6.10)', async () => {
    await service.markStepCompleted('emp-1', 1, 'Create Email Account');

    const call = prismaService.onboardingStatus.upsert.mock.calls[0][0];
    expect(call.update.status).toBe('completed');
    expect(call.update.completed_at).toBeInstanceOf(Date);
    expect(call.update.failure_reason).toBeNull();
  });

  it('captures failure_reason and completed_at on failure (Req 6.10, 6.11)', async () => {
    await service.markStepFailed('emp-1', 3, 'Schedule Orientation', 'provider down');

    const call = prismaService.onboardingStatus.upsert.mock.calls[0][0];
    expect(call.update.status).toBe('failed');
    expect(call.update.failure_reason).toBe('provider down');
    expect(call.update.completed_at).toBeInstanceOf(Date);
  });

  it('swallows persistence errors so tracking never blocks the workflow', async () => {
    prismaService.onboardingStatus.upsert.mockRejectedValue(new Error('db down'));

    await expect(
      service.markStepInProgress('emp-1', 1, 'Create Email Account'),
    ).resolves.toBeUndefined();
  });

  it('aggregates ordered progress from stored rows (Req 6.10)', async () => {
    prismaService.onboardingStatus.findMany.mockResolvedValue([
      {
        step_number: 1,
        step_name: 'Create Email Account',
        status: 'completed',
        started_at: new Date(),
        completed_at: new Date(),
        failure_reason: null,
      },
      {
        step_number: 2,
        step_name: 'Send Welcome Kit',
        status: 'failed',
        started_at: new Date(),
        completed_at: new Date(),
        failure_reason: 'smtp error',
      },
    ]);

    const progress = await service.getEmployeeProgress('emp-1');

    expect(progress.total_steps).toBe(2);
    expect(progress.completed_steps).toBe(1);
    expect(progress.failed_steps).toBe(1);
    expect(progress.is_complete).toBe(false);
    expect(prismaService.onboardingStatus.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { employee_id: 'emp-1' },
        orderBy: { step_number: 'asc' },
      }),
    );
  });

  it('reports is_complete only when all tracked steps are completed', async () => {
    prismaService.onboardingStatus.findMany.mockResolvedValue([
      {
        step_number: 1,
        step_name: 'Create Email Account',
        status: 'completed',
        started_at: new Date(),
        completed_at: new Date(),
        failure_reason: null,
      },
    ]);

    const progress = await service.getEmployeeProgress('emp-1');
    expect(progress.is_complete).toBe(true);
  });
});
