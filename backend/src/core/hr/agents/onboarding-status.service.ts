import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';

/** Lifecycle status of a single onboarding step. */
export type OnboardingStepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed';

/** A (step_number, step_name) pair used to seed the status table. */
export interface OnboardingStepDefinition {
  step_number: number;
  step_name: string;
}

/** A single tracked step row as exposed to callers. */
export interface OnboardingStepStatusView {
  step_number: number;
  step_name: string;
  status: OnboardingStepStatus;
  started_at: Date | null;
  completed_at: Date | null;
  failure_reason: string | null;
}

/** Aggregate progress view for an employee's onboarding. */
export interface OnboardingProgress {
  employee_id: string;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  in_progress_steps: number;
  pending_steps: number;
  is_complete: boolean;
  steps: OnboardingStepStatusView[];
}

/**
 * Onboarding Status Service
 *
 * Owns the full lifecycle persistence of the OnboardingStatus table for the
 * {@link OnboardingAgent}. Extracting this concern keeps the agent focused on
 * step orchestration while this service guarantees that every step is observable
 * through its complete lifecycle:
 *
 *   pending (seeded at workflow start)
 *     -> in_progress (started_at set when work begins)
 *       -> completed (completed_at set) | failed (failure_reason captured)
 *
 * All writes are keyed on the (employee_id, step_number) unique constraint so
 * re-running a workflow is idempotent. Persistence failures are logged and
 * swallowed so status bookkeeping never masks or blocks the real workflow.
 *
 * Requirements: 6.10 (track completion status of each step), 6.11 (capture the
 * specific failure reason when a step fails).
 *
 * Design: Task 17.2 - Implement onboarding status tracking.
 */
@Injectable()
export class OnboardingStatusService {
  private readonly logger = new Logger(OnboardingStatusService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed every onboarding step as `pending` at the start of a workflow so
   * progress is observable before any step runs (Req 6.10).
   *
   * Idempotent: existing rows are reset to a clean `pending` baseline (clearing
   * any timestamps / failure reason from a previous run) while preserving the
   * row identity via the unique constraint.
   */
  async initializeSteps(
    employeeId: string,
    steps: OnboardingStepDefinition[],
  ): Promise<void> {
    for (const { step_number, step_name } of steps) {
      try {
        await this.prisma.onboardingStatus.upsert({
          where: {
            employee_id_step_number: {
              employee_id: employeeId,
              step_number,
            },
          },
          create: {
            employee_id: employeeId,
            step_number,
            step_name,
            status: 'pending',
          },
          update: {
            step_name,
            status: 'pending',
            started_at: null,
            completed_at: null,
            failure_reason: null,
            updated_at: new Date(),
          },
        });
      } catch (error: any) {
        this.logger.warn(
          `[ONBOARDING] Failed to initialize step ${step_number} as pending for ${employeeId}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Mark a step as `in_progress`, stamping `started_at` with the current time.
   * Uses an upsert so the call is safe even if the step was never seeded.
   */
  async markStepInProgress(
    employeeId: string,
    stepNumber: number,
    stepName: string,
  ): Promise<void> {
    const now = new Date();
    try {
      await this.prisma.onboardingStatus.upsert({
        where: {
          employee_id_step_number: {
            employee_id: employeeId,
            step_number: stepNumber,
          },
        },
        create: {
          employee_id: employeeId,
          step_number: stepNumber,
          step_name: stepName,
          status: 'in_progress',
          started_at: now,
        },
        update: {
          step_name: stepName,
          status: 'in_progress',
          started_at: now,
          completed_at: null,
          failure_reason: null,
          updated_at: now,
        },
      });
    } catch (error: any) {
      this.logger.warn(
        `[ONBOARDING] Failed to mark step ${stepNumber} in_progress for ${employeeId}: ${error.message}`,
      );
    }
  }

  /**
   * Mark a step as `completed`, stamping `completed_at` with the current time
   * and clearing any stale failure reason (Req 6.10).
   */
  async markStepCompleted(
    employeeId: string,
    stepNumber: number,
    stepName: string,
  ): Promise<void> {
    const now = new Date();
    try {
      await this.prisma.onboardingStatus.upsert({
        where: {
          employee_id_step_number: {
            employee_id: employeeId,
            step_number: stepNumber,
          },
        },
        create: {
          employee_id: employeeId,
          step_number: stepNumber,
          step_name: stepName,
          status: 'completed',
          started_at: now,
          completed_at: now,
        },
        update: {
          step_name: stepName,
          status: 'completed',
          completed_at: now,
          failure_reason: null,
          updated_at: now,
        },
      });
    } catch (error: any) {
      this.logger.warn(
        `[ONBOARDING] Failed to mark step ${stepNumber} completed for ${employeeId}: ${error.message}`,
      );
    }
  }

  /**
   * Mark a step as `failed`, capturing the specific `failure_reason` and
   * stamping `completed_at` so the terminal time of the step is recorded
   * (Req 6.10, 6.11).
   */
  async markStepFailed(
    employeeId: string,
    stepNumber: number,
    stepName: string,
    failureReason: string,
  ): Promise<void> {
    const now = new Date();
    try {
      await this.prisma.onboardingStatus.upsert({
        where: {
          employee_id_step_number: {
            employee_id: employeeId,
            step_number: stepNumber,
          },
        },
        create: {
          employee_id: employeeId,
          step_number: stepNumber,
          step_name: stepName,
          status: 'failed',
          started_at: now,
          completed_at: now,
          failure_reason: failureReason,
        },
        update: {
          step_name: stepName,
          status: 'failed',
          completed_at: now,
          failure_reason: failureReason,
          updated_at: now,
        },
      });
    } catch (error: any) {
      this.logger.warn(
        `[ONBOARDING] Failed to mark step ${stepNumber} failed for ${employeeId}: ${error.message}`,
      );
    }
  }

  /**
   * Retrieve an employee's onboarding status as an ordered, aggregated progress
   * view (Req 6.10). Steps are returned ordered by step_number.
   */
  async getEmployeeProgress(employeeId: string): Promise<OnboardingProgress> {
    const rows = await this.prisma.onboardingStatus.findMany({
      where: { employee_id: employeeId },
      orderBy: { step_number: 'asc' },
      select: {
        step_number: true,
        step_name: true,
        status: true,
        started_at: true,
        completed_at: true,
        failure_reason: true,
      },
    });

    const steps: OnboardingStepStatusView[] = rows.map((row) => ({
      step_number: row.step_number,
      step_name: row.step_name,
      status: row.status as OnboardingStepStatus,
      started_at: row.started_at,
      completed_at: row.completed_at,
      failure_reason: row.failure_reason,
    }));

    const completed = steps.filter((s) => s.status === 'completed').length;
    const failed = steps.filter((s) => s.status === 'failed').length;
    const inProgress = steps.filter((s) => s.status === 'in_progress').length;
    const pending = steps.filter((s) => s.status === 'pending').length;

    return {
      employee_id: employeeId,
      total_steps: steps.length,
      completed_steps: completed,
      failed_steps: failed,
      in_progress_steps: inProgress,
      pending_steps: pending,
      is_complete: steps.length > 0 && completed === steps.length,
      steps,
    };
  }
}
