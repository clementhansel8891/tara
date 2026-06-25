import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../persistence/prisma.service';
import {
  NotificationService,
  TaraNotificationType,
} from '../services/notification.service';
import { EventBusService, TaraEvent } from '../services/event-bus.service';
import {
  ONBOARDING_INTEGRATIONS,
  OnboardingEmployeeContext,
  OnboardingIntegrations,
} from './onboarding-integrations';
import {
  OnboardingProgress,
  OnboardingStatusService,
} from './onboarding-status.service';

/**
 * Canonical definition of the 7 ordered onboarding steps.
 *
 * The step number/name pair is persisted to the OnboardingStatus table and the
 * order here defines the execution order of {@link OnboardingAgent.executeWorkflow}.
 *
 * Requirements: 6.2 - 6.8 (one acceptance criterion per step).
 */
export enum OnboardingStep {
  EMAIL_ACCOUNT = 1,
  WELCOME_KIT = 2,
  ORIENTATION = 3,
  TEAM_INTRODUCTION = 4,
  SYSTEM_ACCESS = 5,
  SOP_DOCUMENTATION = 6,
  EMPLOYMENT_CONTRACT = 7,
}

/** Human-readable step names, persisted to OnboardingStatus.step_name. */
export const ONBOARDING_STEP_NAMES: Record<OnboardingStep, string> = {
  [OnboardingStep.EMAIL_ACCOUNT]: 'Create Email Account',
  [OnboardingStep.WELCOME_KIT]: 'Send Welcome Kit',
  [OnboardingStep.ORIENTATION]: 'Schedule Orientation Session',
  [OnboardingStep.TEAM_INTRODUCTION]: 'Introduce to Team',
  [OnboardingStep.SYSTEM_ACCESS]: 'Provision Tools and System Access',
  [OnboardingStep.SOP_DOCUMENTATION]: 'Provide SOP Documentation',
  [OnboardingStep.EMPLOYMENT_CONTRACT]: 'Send Employment Contract for Signature',
};

/** Outcome of a single executed step. */
export interface OnboardingStepResult {
  step_number: number;
  step_name: string;
  status: 'completed' | 'failed';
  details?: Record<string, any>;
  failure_reason?: string;
}

/** Aggregate result of an onboarding workflow run. */
export interface OnboardingWorkflowResult {
  employee_id: string;
  completed: boolean;
  steps: OnboardingStepResult[];
  failed_step?: OnboardingStepResult;
  /** When the workflow started (set for every run). */
  started_at?: Date;
  /** When the workflow finished (set once all steps complete). */
  completed_at?: Date;
  /** Total wall-clock duration of the workflow in milliseconds. */
  duration_ms?: number;
  /** True when the workflow completed inside the 2-hour target (Req 6.12). */
  completed_within_target?: boolean;
}

/**
 * Event names this agent listens to in order to auto-initiate onboarding when a
 * new employee record is created (Req 6.1). Both the TARA-prefixed and bare
 * variants are accepted so the agent stays decoupled from whichever service /
 * naming convention emits the creation event.
 */
export const EMPLOYEE_CREATED_EVENTS = [
  'hr.employee.created',
  'employee.created',
] as const;

/**
 * Target time (in milliseconds) within which all 7 onboarding steps should
 * complete from the moment new employee data is input (Req 6.12 - within 2
 * hours). Exceeding it does not fail the workflow; it is logged/flagged so HR
 * can follow up.
 */
export const ONBOARDING_COMPLETION_TARGET_MS = 2 * 60 * 60 * 1000;

/**
 * Onboarding Agent
 *
 * Autonomous service for the TARA HR System that executes the standard 7-step
 * new-employee onboarding workflow in order:
 *
 *   1. Create email account              (Req 6.2)
 *   2. Send welcome kit                   (Req 6.3)
 *   3. Schedule orientation session       (Req 6.4)
 *   4. Introduce to team                  (Req 6.5)
 *   5. Provision tools and system access  (Req 6.6)
 *   6. Provide SOP documentation          (Req 6.7)
 *   7. Send employment contract           (Req 6.8)
 *
 * Externally-dependent actions (email, calendar, account provisioning, document
 * delivery, e-signature) are delegated to the injectable
 * {@link OnboardingIntegrations} abstraction, so the workflow is fully testable
 * and real providers can be plugged in later without changing this agent.
 *
 * Scope note: this class focuses on the step orchestration + step structure.
 * Step status-tracking (the pending -> in_progress -> completed/failed lifecycle,
 * timestamps, failure reasons and progress queries - Task 17.2) is delegated to
 * the dedicated {@link OnboardingStatusService}. Workflow initiation timing plus
 * the HR completion summary / workflow_completed event (Task 17.3) are
 * implemented separately.
 *
 * Design: Task 17.1 - Implement 7-step onboarding workflow.
 */
@Injectable()
export class OnboardingAgent {
  private readonly logger = new Logger(OnboardingAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventBusService: EventBusService,
    @Inject(ONBOARDING_INTEGRATIONS)
    private readonly integrations: OnboardingIntegrations,
    private readonly statusService: OnboardingStatusService,
  ) {
    this.logger.log('Onboarding Agent initialized');
  }

  /**
   * Execute the full 7-step onboarding workflow for a new employee.
   *
   * Steps run strictly in order. Because the steps build on one another (an
   * email account is needed before access provisioning, etc.), a failed step
   * halts the workflow: the failure is recorded, an `onboarding.step_failed`
   * event is emitted, HR_Team is notified with the specific reason (Req 6.11),
   * and the remaining steps are left pending.
   *
   * @param employeeId - UUID of the employee to onboard.
   * @returns An {@link OnboardingWorkflowResult} summarizing each step's outcome.
   *
   * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8 (the 7 steps), with
   * step-failure notification per Req 6.11.
   */
  /**
   * Auto-initiate the onboarding workflow when a new employee record is created
   * (Req 6.1 - initiate within 5 minutes of new employee data input).
   *
   * Subscribed to the employee-created domain event via Nest's EventEmitter2
   * (the {@link EventBusService} broadcasts emitted events to `@OnEvent`
   * listeners), so initiation is fully decoupled from whichever service creates
   * the employee. The workflow runs asynchronously and is NOT awaited by the
   * event emitter, so creating an employee is never blocked on the full
   * 7-step workflow; near-immediate kick-off comfortably satisfies the 5-minute
   * SLA.
   *
   * Failures are caught and logged here so a workflow error never bubbles back
   * into the event-bus dispatch (which would affect unrelated listeners).
   *
   * @param event - The employee-created event (TaraEvent shape).
   *
   * Requirements: 6.1 - initiate the 7-step workflow within 5 minutes of input.
   */
  @OnEvent(EMPLOYEE_CREATED_EVENTS as unknown as string[])
  async handleEmployeeCreated(event: TaraEvent | any): Promise<void> {
    const employeeId =
      event?.entity?.id ??
      event?.payload?.employee_id ??
      event?.entity_id ??
      event?.payload?.id;

    if (!employeeId) {
      this.logger.warn(
        '[ONBOARDING] Employee-created event received without an employee id; skipping auto-initiation',
      );
      return;
    }

    this.logger.log(
      `[ONBOARDING] Auto-initiating onboarding workflow for newly created employee ${employeeId}`,
    );

    try {
      await this.executeWorkflow(employeeId);
    } catch (error: any) {
      this.logger.error(
        `[ONBOARDING] Auto-initiated workflow for ${employeeId} failed: ${error?.message ?? error}`,
        error?.stack,
      );
    }
  }

  /**
   * Execute the full 7-step onboarding workflow for a new employee.
   *
   * Steps run strictly in order. Because the steps build on one another (an
   * email account is needed before access provisioning, etc.), a failed step
   * halts the workflow: the failure is recorded, an `onboarding.step_failed`
   * event is emitted, HR_Team is notified with the specific reason (Req 6.11),
   * and the remaining steps are left pending.
   *
   * When all 7 steps complete, HR_Team receives a completion summary
   * (Req 6.9), an `onboarding.workflow_completed` event is emitted, and the
   * total duration is measured against the 2-hour target (Req 6.12).
   *
   * @param employeeId - UUID of the employee to onboard.
   * @returns An {@link OnboardingWorkflowResult} summarizing each step's outcome.
   *
   * Requirements: 6.1, 6.2 - 6.8 (the 7 steps), 6.9 (completion summary),
   * 6.11 (step-failure notification) and 6.12 (2-hour completion target).
   */
  async executeWorkflow(employeeId: string): Promise<OnboardingWorkflowResult> {
    this.logger.log(`Starting onboarding workflow for employee ${employeeId}`);

    const startedAt = new Date();

    const employee = await this.loadEmployeeContext(employeeId);
    if (!employee) {
      const message = `Employee not found: ${employeeId}`;
      this.logger.error(`[ONBOARDING] ${message}`);
      throw new Error(message);
    }

    // Req 6.1: record that onboarding has been initiated for this employee.
    await this.emitAgentEvent('onboarding.workflow_started', employeeId, {
      employee_id: employeeId,
      employee_name: employee.full_name,
      started_at: startedAt,
    });

    const stepExecutors: Array<{
      step: OnboardingStep;
      run: () => Promise<Record<string, any>>;
    }> = [
      { step: OnboardingStep.EMAIL_ACCOUNT, run: () => this.stepCreateEmailAccount(employee) },
      { step: OnboardingStep.WELCOME_KIT, run: () => this.stepSendWelcomeKit(employee) },
      { step: OnboardingStep.ORIENTATION, run: () => this.stepScheduleOrientation(employee) },
      { step: OnboardingStep.TEAM_INTRODUCTION, run: () => this.stepIntroduceToTeam(employee) },
      { step: OnboardingStep.SYSTEM_ACCESS, run: () => this.stepProvisionSystemAccess(employee) },
      { step: OnboardingStep.SOP_DOCUMENTATION, run: () => this.stepProvideSopDocumentation(employee) },
      { step: OnboardingStep.EMPLOYMENT_CONTRACT, run: () => this.stepSendEmploymentContract(employee) },
    ];

    // Req 6.10: seed every step as 'pending' up front so onboarding progress is
    // observable before each step runs (not just once a step has started).
    await this.statusService.initializeSteps(
      employeeId,
      stepExecutors.map(({ step }) => ({
        step_number: step,
        step_name: ONBOARDING_STEP_NAMES[step],
      })),
    );

    const results: OnboardingStepResult[] = [];

    for (const { step, run } of stepExecutors) {
      const stepName = ONBOARDING_STEP_NAMES[step];
      await this.statusService.markStepInProgress(employeeId, step, stepName);

      try {
        const details = await run();
        await this.statusService.markStepCompleted(employeeId, step, stepName);

        const result: OnboardingStepResult = {
          step_number: step,
          step_name: stepName,
          status: 'completed',
          details,
        };
        results.push(result);

        await this.emitAgentEvent('onboarding.step_completed', employeeId, {
          employee_id: employeeId,
          step_number: step,
          step_name: stepName,
          details,
        });

        this.logger.log(
          `[ONBOARDING] Step ${step} (${stepName}) completed for ${employeeId}`,
        );
      } catch (error: any) {
        const failureReason = error?.message ?? 'Unknown error';
        await this.statusService.markStepFailed(
          employeeId,
          step,
          stepName,
          failureReason,
        );

        const result: OnboardingStepResult = {
          step_number: step,
          step_name: stepName,
          status: 'failed',
          failure_reason: failureReason,
        };
        results.push(result);

        this.logger.error(
          `[ONBOARDING] Step ${step} (${stepName}) failed for ${employeeId}: ${failureReason}`,
        );

        await this.emitAgentEvent('onboarding.step_failed', employeeId, {
          employee_id: employeeId,
          step_number: step,
          step_name: stepName,
          failure_reason: failureReason,
        });

        // Req 6.11: notify HR_Team of the specific failure reason.
        await this.notifyHrOfStepFailure(employee, step, stepName, failureReason);

        // Ordered/dependent steps: halt the workflow on the first failure.
        return {
          employee_id: employeeId,
          completed: false,
          steps: results,
          failed_step: result,
          started_at: startedAt,
        };
      }
    }

    this.logger.log(
      `[ONBOARDING] All 7 steps completed for employee ${employeeId}`,
    );

    // Req 6.12: measure total duration against the 2-hour completion target.
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const completedWithinTarget = durationMs <= ONBOARDING_COMPLETION_TARGET_MS;

    if (completedWithinTarget) {
      this.logger.log(
        `[ONBOARDING] Workflow for ${employeeId} completed in ${this.formatDuration(durationMs)} ` +
          `(within the ${this.formatDuration(ONBOARDING_COMPLETION_TARGET_MS)} target)`,
      );
    } else {
      this.logger.warn(
        `[ONBOARDING] Workflow for ${employeeId} took ${this.formatDuration(durationMs)}, ` +
          `exceeding the ${this.formatDuration(ONBOARDING_COMPLETION_TARGET_MS)} target (Req 6.12)`,
      );
    }

    // Req 6.9: notify HR_Team with a completion summary.
    await this.notifyHrOfCompletion(
      employee,
      results,
      durationMs,
      completedWithinTarget,
    );

    // Req 21.4 / design: emit the workflow_completed event for downstream consumers.
    await this.emitAgentEvent('onboarding.workflow_completed', employeeId, {
      employee_id: employeeId,
      employee_name: employee.full_name,
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms: durationMs,
      completed_within_target: completedWithinTarget,
      target_ms: ONBOARDING_COMPLETION_TARGET_MS,
      steps: results.map((s) => ({
        step_number: s.step_number,
        step_name: s.step_name,
        status: s.status,
      })),
    });

    return {
      employee_id: employeeId,
      completed: true,
      steps: results,
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms: durationMs,
      completed_within_target: completedWithinTarget,
    };
  }

  // ---------------------------------------------------------------------------
  // Step implementations (Req 6.2 - 6.8)
  // ---------------------------------------------------------------------------

  /** Step 1 (Req 6.2): create the new employee's email account. */
  private async stepCreateEmailAccount(
    employee: OnboardingEmployeeContext,
  ): Promise<Record<string, any>> {
    const result = await this.integrations.createEmailAccount(employee);
    return { email: result.email, account_id: result.account_id };
  }

  /** Step 2 (Req 6.3): send the welcome kit (email + onboarding documents). */
  private async stepSendWelcomeKit(
    employee: OnboardingEmployeeContext,
  ): Promise<Record<string, any>> {
    const delivery = await this.integrations.sendWelcomeKit(employee);

    await this.notificationService.sendPrivateNotification({
      recipient_id: employee.id,
      type: TaraNotificationType.ONBOARDING_NOTIFICATION,
      title: 'Selamat Datang di PT. Maju Bersama!',
      content:
        `Halo ${employee.full_name}, selamat bergabung! ` +
        'Welcome kit Anda telah dikirim, termasuk surat sambutan, buku panduan karyawan, ' +
        'dan panduan tunjangan. Silakan periksa email Anda.',
      metadata: {
        onboarding_step: OnboardingStep.WELCOME_KIT,
        delivery_id: delivery.delivery_id,
        documents: delivery.documents,
      },
    });

    return { delivery_id: delivery.delivery_id, documents: delivery.documents };
  }

  /** Step 3 (Req 6.4): schedule the orientation session via calendar. */
  private async stepScheduleOrientation(
    employee: OnboardingEmployeeContext,
  ): Promise<Record<string, any>> {
    const orientation = await this.integrations.scheduleOrientation(employee);

    await this.notificationService.sendPrivateNotification({
      recipient_id: employee.id,
      type: TaraNotificationType.ONBOARDING_NOTIFICATION,
      title: 'Jadwal Orientasi Anda',
      content:
        `Halo ${employee.full_name}, sesi orientasi Anda telah dijadwalkan pada ` +
        `${orientation.scheduled_at.toISOString()}` +
        (orientation.location ? ` di ${orientation.location}.` : '.'),
      metadata: {
        onboarding_step: OnboardingStep.ORIENTATION,
        event_id: orientation.event_id,
        scheduled_at: orientation.scheduled_at,
        location: orientation.location,
      },
    });

    return {
      event_id: orientation.event_id,
      scheduled_at: orientation.scheduled_at,
      location: orientation.location,
    };
  }

  /**
   * Step 4 (Req 6.5): introduce the new employee to their team by notifying
   * existing active team members (same department) of the new joiner.
   */
  private async stepIntroduceToTeam(
    employee: OnboardingEmployeeContext,
  ): Promise<Record<string, any>> {
    const teamMembers = employee.department_id
      ? await this.prisma.employee.findMany({
          where: {
            department_id: employee.department_id,
            employment_status: 'active',
            id: { not: employee.id },
          },
          select: { id: true },
        })
      : [];

    const departmentLabel = employee.department_name ?? 'tim';
    let notified = 0;
    for (const member of teamMembers) {
      try {
        await this.notificationService.sendPrivateNotification({
          recipient_id: member.id,
          type: TaraNotificationType.ONBOARDING_NOTIFICATION,
          title: 'Anggota Tim Baru',
          content:
            `Sambut anggota baru ${departmentLabel} kita, ${employee.full_name}! ` +
            'Mari bantu mereka merasa diterima.',
          metadata: {
            onboarding_step: OnboardingStep.TEAM_INTRODUCTION,
            new_employee_id: employee.id,
            new_employee_name: employee.full_name,
          },
        });
        notified++;
      } catch (error: any) {
        this.logger.warn(
          `[ONBOARDING] Failed to notify team member ${member.id}: ${error.message}`,
        );
      }
    }

    return {
      department_id: employee.department_id ?? null,
      team_members_notified: notified,
    };
  }

  /** Step 5 (Req 6.6): provision tools and system access. */
  private async stepProvisionSystemAccess(
    employee: OnboardingEmployeeContext,
  ): Promise<Record<string, any>> {
    const access = await this.integrations.provisionSystemAccess(employee);
    return {
      account_id: access.account_id,
      provisioned_tools: access.provisioned_tools,
    };
  }

  /** Step 6 (Req 6.7): deliver SOP documentation to the new employee. */
  private async stepProvideSopDocumentation(
    employee: OnboardingEmployeeContext,
  ): Promise<Record<string, any>> {
    const delivery = await this.integrations.deliverSopDocumentation(employee);

    await this.notificationService.sendPrivateNotification({
      recipient_id: employee.id,
      type: TaraNotificationType.ONBOARDING_NOTIFICATION,
      title: 'Dokumentasi SOP',
      content:
        `Halo ${employee.full_name}, dokumentasi Standard Operating Procedure (SOP) ` +
        'telah tersedia untuk Anda. Mohon pelajari sebelum memulai tugas Anda.',
      metadata: {
        onboarding_step: OnboardingStep.SOP_DOCUMENTATION,
        delivery_id: delivery.delivery_id,
        documents: delivery.documents,
      },
    });

    return { delivery_id: delivery.delivery_id, documents: delivery.documents };
  }

  /** Step 7 (Req 6.8): send the employment contract for e-signature. */
  private async stepSendEmploymentContract(
    employee: OnboardingEmployeeContext,
  ): Promise<Record<string, any>> {
    const signature = await this.integrations.sendContractForSignature(employee);

    await this.notificationService.sendPrivateNotification({
      recipient_id: employee.id,
      type: TaraNotificationType.ONBOARDING_NOTIFICATION,
      title: 'Kontrak Kerja untuk Ditandatangani',
      content:
        `Halo ${employee.full_name}, kontrak kerja Anda telah dikirim untuk ditandatangani secara elektronik. ` +
        'Mohon tinjau dan tanda tangani sesegera mungkin.',
      metadata: {
        onboarding_step: OnboardingStep.EMPLOYMENT_CONTRACT,
        envelope_id: signature.envelope_id,
        signing_url: signature.signing_url,
        status: signature.status,
      },
    });

    return {
      envelope_id: signature.envelope_id,
      signing_url: signature.signing_url,
      status: signature.status,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Load the minimal employee context used to drive the workflow.
   * Returns null when the employee does not exist.
   */
  private async loadEmployeeContext(
    employeeId: string,
  ): Promise<OnboardingEmployeeContext | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        full_name: true,
        email: true,
        employee_code: true,
        department_id: true,
        supervisor_id: true,
        department: { select: { name: true } },
      },
    });

    if (!employee) {
      return null;
    }

    return {
      id: employee.id,
      full_name: employee.full_name,
      email: employee.email,
      employee_code: employee.employee_code,
      department_id: employee.department_id,
      department_name: employee.department?.name ?? null,
      supervisor_id: employee.supervisor_id,
    };
  }

  /**
   * Retrieve an employee's onboarding progress (Req 6.10).
   *
   * Delegates to {@link OnboardingStatusService} so callers (e.g. HR dashboards)
   * can observe the full per-step lifecycle without depending on the table shape.
   */
  async getOnboardingProgress(employeeId: string): Promise<OnboardingProgress> {
    return this.statusService.getEmployeeProgress(employeeId);
  }

  /**
   * Notify HR_Team of a failed onboarding step with the specific reason
   * (Req 6.11). Delivery failures are swallowed so they never mask the
   * underlying step failure.
   */
  private async notifyHrOfStepFailure(
    employee: OnboardingEmployeeContext,
    step: OnboardingStep,
    stepName: string,
    failureReason: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendHRTeamNotification({
        type: TaraNotificationType.ONBOARDING_COMPLETION_SUMMARY,
        title: `Onboarding Gagal: ${employee.full_name}`,
        content:
          `Langkah onboarding "${stepName}" (langkah ${step}) gagal untuk karyawan ` +
          `${employee.full_name} (${employee.email}). Alasan: ${failureReason}.`,
        metadata: {
          onboarding_event: 'step_failed',
          employee_id: employee.id,
          employee_name: employee.full_name,
          step_number: step,
          step_name: stepName,
          failure_reason: failureReason,
        },
      });
    } catch (error: any) {
      this.logger.error(
        `[ONBOARDING] Failed to notify HR of step failure for ${employee.id}: ${error.message}`,
      );
    }
  }

  /**
   * Notify HR_Team with a completion summary once all 7 onboarding steps have
   * completed (Req 6.9). Delivery failures are swallowed so they never mask the
   * successful workflow result.
   */
  private async notifyHrOfCompletion(
    employee: OnboardingEmployeeContext,
    steps: OnboardingStepResult[],
    durationMs: number,
    completedWithinTarget: boolean,
  ): Promise<void> {
    const durationLabel = this.formatDuration(durationMs);
    const slaLabel = completedWithinTarget
      ? `dalam target 2 jam`
      : `MELEBIHI target 2 jam`;

    try {
      await this.notificationService.sendHRTeamNotification({
        type: TaraNotificationType.ONBOARDING_COMPLETION_SUMMARY,
        title: `Onboarding Selesai: ${employee.full_name}`,
        content:
          `Seluruh 7 langkah onboarding untuk ${employee.full_name} ` +
          `(${employee.email}) telah selesai dalam ${durationLabel} (${slaLabel}). ` +
          `Langkah: ${steps.map((s) => `${s.step_number}. ${s.step_name}`).join('; ')}.`,
        metadata: {
          onboarding_event: 'workflow_completed',
          employee_id: employee.id,
          employee_name: employee.full_name,
          duration_ms: durationMs,
          completed_within_target: completedWithinTarget,
          target_ms: ONBOARDING_COMPLETION_TARGET_MS,
          steps: steps.map((s) => ({
            step_number: s.step_number,
            step_name: s.step_name,
            status: s.status,
          })),
        },
      });
    } catch (error: any) {
      this.logger.error(
        `[ONBOARDING] Failed to notify HR of completion for ${employee.id}: ${error.message}`,
      );
    }
  }

  /** Format a millisecond duration as a compact `Xh Ym Zs` label for logs/notifications. */
  private formatDuration(durationMs: number): string {
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Emit an agent event to the Event Bus for monitoring / downstream consumers.
   * Failures are swallowed so event emission never blocks the workflow.
   */
  private async emitAgentEvent(
    eventType: string,
    employeeId: string,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      const event: Partial<TaraEvent> = {
        event_type: eventType,
        event_version: '1.0',
        event_timestamp: new Date(),
        actor: {
          id: 'onboarding_agent',
          type: 'agent',
        },
        entity: {
          id: employeeId,
          type: 'employee',
        },
        payload,
      };

      await this.eventBusService.emit(event as TaraEvent);
    } catch (error: any) {
      this.logger.error(
        `[ONBOARDING] Failed to emit event ${eventType}: ${error.message}`,
        error.stack,
      );
    }
  }
}
