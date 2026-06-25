import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { NotificationService, TaraNotificationType } from './notification.service';
import { EventBusService } from './event-bus.service';

/**
 * Warning letter levels supported by TARA
 * Requirement 11.6: Support multiple warning levels (SP1, SP2, SP3)
 */
export enum WarningLevel {
  SP1 = 'SP1',
  SP2 = 'SP2',
  SP3 = 'SP3',
}

/**
 * Warning letter status
 */
export enum WarningLetterStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

/**
 * Notification channels explicitly blocked for warning letters.
 * Requirement 11.3: Never broadcast to Public_Announcement channel
 */
export const WARNING_LETTER_BLOCKED_CHANNELS = ['public', 'public_announcement', 'broadcast'] as const;

/**
 * Input parameters for issuing a warning letter
 */
export interface IssueWarningLetterParams {
  employee_id: string;
  warning_level: WarningLevel | string;
  reason: string;
  issued_by: string;
  content: string;
}

/**
 * WarningLetterService for TARA HR System
 *
 * Implements:
 * - Requirement 11.1: Send Warning_Letter_SP as Private_Notification within 5 minutes
 * - Requirement 11.2: Ensure Warning_Letter_SP is visible only to recipient Employee
 * - Requirement 11.4: Log Warning_Letter_SP issuance in Employee's confidential record
 * - Requirement 11.5: Include date, reason, and issuing HR personnel in record
 *
 * Responsibilities:
 * - Issue warning letters to employees
 * - Store in WarningLetter table with issue_date & expiry_date
 * - Send private notification to recipient employee only
 * - Log in employee's confidential record (AuditLog)
 * - Emit warning_letter.issued event to Event Bus
 */
@Injectable()
export class WarningLetterService {
  private readonly logger = new Logger(WarningLetterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventBusService: EventBusService,
  ) {}

  /**
   * Issue a warning letter to an employee.
   *
   * Flow:
   * 1. Validate inputs (employee exists, issuer exists, valid warning level)
   * 2. Create WarningLetter record with issue_date and expiry_date
   * 3. Send Private_Notification to recipient employee only (Req 11.1, 11.2)
   * 4. Log in employee's confidential record via AuditLog (Req 11.4, 11.5)
   * 5. Emit warning_letter.issued event (Req 21.3)
   *
   * @param params - Warning letter parameters
   * @returns Created WarningLetter record
   */
  async issueWarningLetter(params: IssueWarningLetterParams) {
    const { employee_id, warning_level, reason, issued_by, content } = params;

    this.logger.log(
      `[ISSUE_WARNING_LETTER] Issuing ${warning_level} to employee ${employee_id} by ${issued_by}`,
    );

    // 1. Validate inputs
    await this.validateInputs(employee_id, issued_by, warning_level);

    // 2. Create WarningLetter record
    const issue_date = new Date();
    const expiry_date = this.calculateExpiryDate(issue_date, warning_level);

    const warningLetter = await this.prisma.warningLetter.create({
      data: {
        employee_id,
        warning_level,
        issue_date,
        reason,
        issued_by,
        expiry_date,
        status: 'active',
        content,
      },
    });

    this.logger.log(
      `[WARNING_LETTER_CREATED] ID: ${warningLetter.id}, Level: ${warning_level}, Employee: ${employee_id}`,
    );

    // 3. Send Private_Notification to recipient employee only (Req 11.1, 11.2)
    await this.sendPrivateNotification(warningLetter);

    // 4. Log in employee's confidential record (Req 11.4, 11.5)
    await this.logConfidentialRecord(warningLetter, issued_by);

    // 5. Emit warning_letter.issued event
    await this.emitWarningLetterEvent(warningLetter, issued_by);

    return warningLetter;
  }

  /**
   * Validate that employee and issuer exist, and warning level is valid.
   */
  private async validateInputs(
    employee_id: string,
    issued_by: string,
    warning_level: string,
  ): Promise<void> {
    // Validate warning level
    const validLevels = Object.values(WarningLevel);
    if (!validLevels.includes(warning_level as WarningLevel)) {
      throw new Error(
        `Invalid warning level: ${warning_level}. Must be one of: ${validLevels.join(', ')}`,
      );
    }

    // Validate employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employee_id },
      select: { id: true, full_name: true },
    });

    if (!employee) {
      throw new Error(`Employee not found: ${employee_id}`);
    }

    // Validate issuer exists
    const issuer = await this.prisma.employee.findUnique({
      where: { id: issued_by },
      select: { id: true, full_name: true },
    });

    if (!issuer) {
      throw new Error(`Issuer (HR personnel) not found: ${issued_by}`);
    }
  }

  /**
   * Calculate expiry date based on warning level.
   * Requirement 11.7: Track warning letter expiration dates per company policy
   *
   * Default policy:
   * - SP1: 6 months
   * - SP2: 9 months
   * - SP3: 12 months
   */
  private calculateExpiryDate(issue_date: Date, warning_level: string): Date {
    const expiry = new Date(issue_date);

    switch (warning_level) {
      case WarningLevel.SP1:
        expiry.setMonth(expiry.getMonth() + 6);
        break;
      case WarningLevel.SP2:
        expiry.setMonth(expiry.getMonth() + 9);
        break;
      case WarningLevel.SP3:
        expiry.setMonth(expiry.getMonth() + 12);
        break;
      default:
        expiry.setMonth(expiry.getMonth() + 6);
    }

    return expiry;
  }

  /**
   * Send private notification to the recipient employee only.
   * Requirement 11.1: Send as Private_Notification within 5 minutes
   * Requirement 11.2: Visible only to recipient Employee
   */
  private async sendPrivateNotification(warningLetter: any): Promise<void> {
    try {
      await this.notificationService.sendPrivateNotification({
        recipient_id: warningLetter.employee_id,
        type: TaraNotificationType.WARNING_LETTER,
        title: `Surat Peringatan ${warningLetter.warning_level}`,
        content: warningLetter.content,
        metadata: {
          warning_letter_id: warningLetter.id,
          warning_level: warningLetter.warning_level,
          issue_date: warningLetter.issue_date,
          reason: warningLetter.reason,
        },
      });

      this.logger.log(
        `[NOTIFICATION_SENT] Private notification sent for warning letter ${warningLetter.id}`,
      );
    } catch (error) {
      this.logger.error(
        `[NOTIFICATION_FAILED] Failed to send notification for warning letter ${warningLetter.id}: ${error.message}`,
      );
      // Don't throw - the warning letter was already created successfully
    }
  }

  /**
   * Log warning letter issuance in employee's confidential record.
   * Requirement 11.4: Log issuance in Employee's confidential record
   * Requirement 11.5: Include date, reason, and issuing HR personnel
   */
  private async logConfidentialRecord(
    warningLetter: any,
    issued_by: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action_type: 'warning_letter_issued',
          actor_id: issued_by,
          actor_role: 'hr_team',
          target_entity_type: 'warning_letter',
          target_entity_id: warningLetter.id,
          action_context: 'administrative',
          changes: {
            employee_id: warningLetter.employee_id,
            warning_level: warningLetter.warning_level,
            issue_date: warningLetter.issue_date,
            reason: warningLetter.reason,
            issued_by,
            expiry_date: warningLetter.expiry_date,
          },
        },
      });

      this.logger.log(
        `[AUDIT_LOGGED] Warning letter ${warningLetter.id} logged in confidential record`,
      );
    } catch (error) {
      this.logger.error(
        `[AUDIT_LOG_FAILED] Failed to log warning letter ${warningLetter.id}: ${error.message}`,
      );
    }
  }

  /**
   * Emit warning_letter.issued event to Event Bus.
   * Conforms to event structure from event-bus.example.ts
   */
  private async emitWarningLetterEvent(
    warningLetter: any,
    issued_by: string,
  ): Promise<void> {
    try {
      await this.eventBusService.emit({
        event_type: 'warning_letter.issued',
        actor: {
          id: issued_by,
          type: 'employee',
        },
        entity: {
          id: warningLetter.id,
          type: 'warning_letter',
        },
        payload: {
          recipient_id: warningLetter.employee_id,
          warning_level: warningLetter.warning_level,
          issue_date: warningLetter.issue_date,
          reason: warningLetter.reason,
          expiry_date: warningLetter.expiry_date,
        },
        metadata: {
          visibility: 'private',
          confidential: true,
        },
      });

      this.logger.log(
        `[EVENT_EMITTED] warning_letter.issued for ${warningLetter.id}`,
      );
    } catch (error) {
      this.logger.error(
        `[EVENT_EMISSION_FAILED] Failed to emit event for warning letter ${warningLetter.id}: ${error.message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Privacy Enforcement Methods
  // Requirement 11.3: Never broadcast to Public_Announcement channel
  // Requirement 11.2: Visible only to recipient Employee
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Enforce that a warning letter is NEVER sent via a public channel.
   * Requirement 11.3: Not broadcast to any Public_Announcement channel
   *
   * This is a guard method that should be called before any notification dispatch
   * to ensure no code path can accidentally broadcast a warning letter publicly.
   *
   * @param channel - The channel being attempted
   * @throws Error if the channel is a blocked public channel
   */
  enforcePrivacyChannel(channel: string): void {
    const normalizedChannel = channel.toLowerCase().trim();

    if (
      WARNING_LETTER_BLOCKED_CHANNELS.includes(normalizedChannel as any) ||
      normalizedChannel.includes('public') ||
      normalizedChannel.includes('broadcast') ||
      normalizedChannel.includes('announcement')
    ) {
      const message =
        `Privacy violation: Warning letters cannot be sent via channel "${channel}". ` +
        `Warning letters are strictly private and must only be delivered to the recipient employee. ` +
        `Blocked channels: ${WARNING_LETTER_BLOCKED_CHANNELS.join(', ')}`;

      this.logger.error(`[PRIVACY_ENFORCEMENT] ${message}`);
      throw new Error(message);
    }
  }

  /**
   * Get warning letters for an employee - enforces that only the recipient can access.
   * Requirement 11.2: Visible only to the recipient Employee
   *
   * Context-based access control:
   * - In Personal_Employee_Context: employee can only see their own warning letters
   * - Throws ForbiddenException if requesting_employee_id !== target employee_id
   *
   * @param employee_id - The employee whose warning letters to retrieve
   * @param requesting_employee_id - The authenticated employee making the request
   * @param options - Optional filters (status, level)
   * @returns Array of warning letters belonging to the employee
   */
  async getWarningLettersForEmployee(
    employee_id: string,
    requesting_employee_id: string,
    options?: {
      status?: string;
      warning_level?: string;
      include_expired?: boolean;
    },
  ) {
    // Privacy enforcement: only the recipient can view their own warning letters
    if (employee_id !== requesting_employee_id) {
      this.logger.warn(
        `[PRIVACY_VIOLATION_ATTEMPT] Employee ${requesting_employee_id} ` +
        `attempted to access warning letters for employee ${employee_id}`,
      );
      throw new ForbiddenException(
        'Access denied: Warning letters are only visible to the recipient employee.',
      );
    }

    const where: any = { employee_id };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.warning_level) {
      where.warning_level = options.warning_level;
    }

    if (!options?.include_expired) {
      // By default, only return active (non-expired) warning letters
      where.OR = [
        { expiry_date: null },
        { expiry_date: { gte: new Date() } },
        { status: 'active' },
      ];
    }

    const warningLetters = await this.prisma.warningLetter.findMany({
      where,
      orderBy: { issue_date: 'desc' },
      select: {
        id: true,
        employee_id: true,
        warning_level: true,
        issue_date: true,
        reason: true,
        expiry_date: true,
        status: true,
        content: true,
        created_at: true,
      },
    });

    this.logger.log(
      `[WARNING_LETTERS_RETRIEVED] Employee: ${employee_id}, Count: ${warningLetters.length}`,
    );

    return warningLetters;
  }

  /**
   * Get a single warning letter by ID - enforces recipient-only access.
   * Requirement 11.2: Visible only to the recipient Employee
   *
   * @param warning_letter_id - The warning letter ID
   * @param requesting_employee_id - The authenticated employee making the request
   * @returns The warning letter if it belongs to the requesting employee
   */
  async getWarningLetterById(
    warning_letter_id: string,
    requesting_employee_id: string,
  ) {
    const warningLetter = await this.prisma.warningLetter.findUnique({
      where: { id: warning_letter_id },
      select: {
        id: true,
        employee_id: true,
        warning_level: true,
        issue_date: true,
        reason: true,
        expiry_date: true,
        status: true,
        content: true,
        issued_by: true,
        created_at: true,
      },
    });

    if (!warningLetter) {
      return null;
    }

    // Privacy enforcement: only the recipient can view
    if (warningLetter.employee_id !== requesting_employee_id) {
      this.logger.warn(
        `[PRIVACY_VIOLATION_ATTEMPT] Employee ${requesting_employee_id} ` +
        `attempted to access warning letter ${warning_letter_id} belonging to ${warningLetter.employee_id}`,
      );
      throw new ForbiddenException(
        'Access denied: Warning letters are only visible to the recipient employee.',
      );
    }

    return warningLetter;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Warning Level Tracking Methods
  // Requirement 11.6: Support multiple warning levels (SP1, SP2, SP3)
  // Requirement 11.7: Track expiration dates per company policy
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get a summary of active warning levels for an employee.
   * Requirement 11.6: Support multiple warning levels
   * Requirement 11.7: Track expiration dates per company policy
   *
   * Returns the current active warnings with their levels and expiry status.
   * Only accessible to the recipient employee themselves.
   *
   * @param employee_id - The employee whose warning level summary to retrieve
   * @param requesting_employee_id - The authenticated employee making the request
   * @returns Warning level tracking summary
   */
  async getWarningLevelSummary(
    employee_id: string,
    requesting_employee_id: string,
  ) {
    // Privacy enforcement
    if (employee_id !== requesting_employee_id) {
      throw new ForbiddenException(
        'Access denied: Warning letter summary is only visible to the recipient employee.',
      );
    }

    const now = new Date();

    const allWarnings = await this.prisma.warningLetter.findMany({
      where: { employee_id },
      orderBy: { issue_date: 'desc' },
      select: {
        id: true,
        warning_level: true,
        issue_date: true,
        expiry_date: true,
        status: true,
      },
    });

    // Categorize active vs expired
    const active = allWarnings.filter(
      (w) => w.status === 'active' && (!w.expiry_date || new Date(w.expiry_date) > now),
    );
    const expired = allWarnings.filter(
      (w) => w.status === 'expired' || (w.expiry_date && new Date(w.expiry_date) <= now),
    );

    // Track counts per level
    const activeByLevel: Record<string, number> = {
      [WarningLevel.SP1]: 0,
      [WarningLevel.SP2]: 0,
      [WarningLevel.SP3]: 0,
    };

    for (const warning of active) {
      if (warning.warning_level in activeByLevel) {
        activeByLevel[warning.warning_level]++;
      }
    }

    // Find highest active level
    let highestActiveLevel: string | null = null;
    if (activeByLevel[WarningLevel.SP3] > 0) {
      highestActiveLevel = WarningLevel.SP3;
    } else if (activeByLevel[WarningLevel.SP2] > 0) {
      highestActiveLevel = WarningLevel.SP2;
    } else if (activeByLevel[WarningLevel.SP1] > 0) {
      highestActiveLevel = WarningLevel.SP1;
    }

    // Find nearest expiry date among active warnings
    const nearestExpiry = active
      .filter((w) => w.expiry_date != null)
      .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())[0]
      ?.expiry_date || null;

    return {
      employee_id,
      total_warnings: allWarnings.length,
      active_count: active.length,
      expired_count: expired.length,
      active_by_level: activeByLevel,
      highest_active_level: highestActiveLevel,
      nearest_expiry_date: nearestExpiry,
      warnings: active.map((w) => ({
        id: w.id,
        level: w.warning_level,
        issue_date: w.issue_date,
        expiry_date: w.expiry_date,
        days_until_expiry: w.expiry_date
          ? Math.max(0, Math.ceil((new Date(w.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : null,
      })),
    };
  }

  /**
   * Check and update expired warning letters.
   * Requirement 11.7: Track expiration dates per company policy
   *
   * Scans for warning letters past their expiry date and marks them as expired.
   * Intended to be called by a scheduler or cron job.
   *
   * @returns Count of warning letters that were marked as expired
   */
  async processExpiredWarnings(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.warningLetter.updateMany({
      where: {
        status: 'active',
        expiry_date: { lte: now },
      },
      data: {
        status: WarningLetterStatus.EXPIRED,
        updated_at: now,
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `[EXPIRED_WARNINGS_PROCESSED] Marked ${result.count} warning letter(s) as expired`,
      );
    }

    return result.count;
  }
}
