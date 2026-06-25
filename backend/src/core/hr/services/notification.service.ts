import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventStreamGateway } from '../events/event-stream.gateway';
import { I18nService } from '../i18n/i18n.service';

/**
 * TARA HR Notification Types
 * These types are used to enforce privacy rules automatically
 * Task 13.2: Notification Privacy Rules
 */
export enum TaraNotificationType {
  // Public announcements (visible to all employees) - Requirement 9.1
  TARDINESS_REPORT = 'tardiness_report',
  TARDINESS_ANNOUNCEMENT = 'tardiness_announcement',
  ATTENDANCE_ANNOUNCEMENT = 'attendance_announcement',
  
  // Private notifications (visible only to recipient) - Requirements 9.2, 9.3
  CLOCK_IN_CONFIRMATION = 'clock_in_confirmation',
  CLOCK_OUT_CONFIRMATION = 'clock_out_confirmation',
  WARNING_LETTER = 'warning_letter',
  LEAVE_REQUEST_CONFIRMATION = 'leave_request_confirmation',
  LEAVE_APPROVAL = 'leave_approval',
  LEAVE_REJECTION = 'leave_rejection',
  LEAVE_BALANCE_RECAP = 'leave_balance_recap',
  WEEKLY_CHECKIN_FORM = 'weekly_checkin_form',
  WEEKLY_CHECKIN_REMINDER = 'weekly_checkin_reminder',
  ONBOARDING_NOTIFICATION = 'onboarding_notification',
  GENERAL_NOTIFICATION = 'general_notification',
  
  // HR Team only notifications - Requirements 9.4, 9.5, 9.6
  WEEKLY_ATTENDANCE_RECAP = 'weekly_attendance_recap',
  WEEKLY_CHECKIN_REPORT = 'weekly_checkin_report',
  ONBOARDING_COMPLETION_SUMMARY = 'onboarding_completion_summary',
  SUPERVISOR_LEAVE_REQUEST = 'supervisor_leave_request',

  // System alert notifications - Requirement 19.5
  BACKUP_FAILURE = 'backup_failure',
}

/**
 * Notification visibility levels
 * Task 13.2: Privacy Rule Enforcement
 */
export enum NotificationVisibility {
  PUBLIC = 'public',           // Visible to all employees
  PRIVATE = 'private',          // Visible only to recipient
  HR_TEAM_ONLY = 'hr_team_only', // Visible only to HR_Team members
}

/**
 * Privacy rule mapping based on notification type
 * Task 13.2: Automatic privacy enforcement
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 * 
 * Rules:
 * - Tardiness notifications: Public_Announcements (Req 9.1)
 * - Warning letters: Private_Notifications (Req 9.2)
 * - Clock confirmations: Private_Notifications (Req 9.3)
 * - Weekly attendance recaps: HR_Team only (Req 9.4)
 * - Weekly productivity reports: HR_Team and Supervisors only (Req 9.5)
 * - Warning letters never broadcast: Private only (Req 9.6)
 */
export const NOTIFICATION_PRIVACY_RULES: Record<TaraNotificationType, NotificationVisibility> = {
  // Public announcements - visible to all employees (Req 9.1)
  [TaraNotificationType.TARDINESS_REPORT]: NotificationVisibility.PUBLIC,
  [TaraNotificationType.TARDINESS_ANNOUNCEMENT]: NotificationVisibility.PUBLIC,
  [TaraNotificationType.ATTENDANCE_ANNOUNCEMENT]: NotificationVisibility.PUBLIC,
  
  // Private notifications - recipient only (Req 9.2, 9.3)
  [TaraNotificationType.CLOCK_IN_CONFIRMATION]: NotificationVisibility.PRIVATE,
  [TaraNotificationType.CLOCK_OUT_CONFIRMATION]: NotificationVisibility.PRIVATE,
  [TaraNotificationType.WARNING_LETTER]: NotificationVisibility.PRIVATE,
  [TaraNotificationType.LEAVE_REQUEST_CONFIRMATION]: NotificationVisibility.PRIVATE,
  [TaraNotificationType.LEAVE_APPROVAL]: NotificationVisibility.PRIVATE,
  [TaraNotificationType.LEAVE_REJECTION]: NotificationVisibility.PRIVATE,
  [TaraNotificationType.LEAVE_BALANCE_RECAP]: NotificationVisibility.PRIVATE,
  [TaraNotificationType.WEEKLY_CHECKIN_FORM]: NotificationVisibility.PRIVATE,
  [TaraNotificationType.WEEKLY_CHECKIN_REMINDER]: NotificationVisibility.PRIVATE,
  [TaraNotificationType.ONBOARDING_NOTIFICATION]: NotificationVisibility.PRIVATE,
  [TaraNotificationType.GENERAL_NOTIFICATION]: NotificationVisibility.PRIVATE,
  
  // HR Team only - restricted access (Req 9.4, 9.5, 9.6)
  [TaraNotificationType.WEEKLY_ATTENDANCE_RECAP]: NotificationVisibility.HR_TEAM_ONLY,
  [TaraNotificationType.WEEKLY_CHECKIN_REPORT]: NotificationVisibility.HR_TEAM_ONLY,
  [TaraNotificationType.ONBOARDING_COMPLETION_SUMMARY]: NotificationVisibility.HR_TEAM_ONLY,
  [TaraNotificationType.SUPERVISOR_LEAVE_REQUEST]: NotificationVisibility.HR_TEAM_ONLY,

  // System alerts - HR Team only (Req 19.5)
  [TaraNotificationType.BACKUP_FAILURE]: NotificationVisibility.HR_TEAM_ONLY,
};

/**
 * NotificationService for TARA HR System
 * 
 * Implements:
 * - Task 13.1: Notification Service
 * - Task 13.2: Notification Privacy Rules
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 * 
 * Features:
 * - Automatic privacy rule enforcement based on notification type
 * - Send notifications to employees (private and public)
 * - Store in Notification table with enforced visibility
 * - Support metadata for extensibility
 * - Real-time delivery via WebSocket (EventStreamGateway)
 * - Privacy controls (private vs public visibility)
 * - HR_Team-only notifications for sensitive data
 * 
 * Privacy Rules (automatically enforced):
 * - Tardiness notifications → Public_Announcements (all employees)
 * - Warning letters → Private_Notifications (recipient only)
 * - Clock confirmations → Private_Notifications (recipient only)
 * - Weekly attendance recaps → HR_Team only
 * - Productivity reports → HR_Team and Supervisors only
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStreamGateway: EventStreamGateway,
    @Optional() private readonly i18nService?: I18nService,
  ) {}

  /**
   * Resolve notification content using the employee's language preference.
   * 
   * Requirements:
   * - 16.3: Translate forms/notifications/reports per employee preference
   * - 16.4: Translate all agent-generated messages based on employee language preference
   * - 16.5: Maintain consistent terminology across all agents in each language
   *
   * If `titleKey` or `contentKey` are provided in metadata, they will be used
   * as translation keys (with params from metadata.i18n_params). Otherwise
   * the original title/content strings are returned unchanged.
   *
   * @param recipientId - Employee ID to look up language preference
   * @param title - Default title text (used as-is if no translation key provided)
   * @param content - Default content text (used as-is if no translation key provided)
   * @param metadata - Optional metadata containing i18n_title_key, i18n_content_key, i18n_params
   * @returns Resolved title and content in the employee's preferred language
   */
  async resolveTranslatedContent(
    recipientId: string,
    title: string,
    content: string,
    metadata?: any,
  ): Promise<{ title: string; content: string }> {
    // If no I18nService or no translation keys, return original content
    if (!this.i18nService || !metadata) {
      return { title, content };
    }

    const titleKey: string | undefined = metadata.i18n_title_key;
    const contentKey: string | undefined = metadata.i18n_content_key;

    if (!titleKey && !contentKey) {
      return { title, content };
    }

    // Look up the employee's language preference
    const employee = await this.prisma.employee.findUnique({
      where: { id: recipientId },
      select: { language_preference: true },
    });

    const lang = employee?.language_preference ?? 'id';
    const params: Record<string, string | number> | undefined = metadata.i18n_params;

    const resolvedTitle = titleKey
      ? this.i18nService.translate(titleKey, lang, params)
      : title;

    const resolvedContent = contentKey
      ? this.i18nService.translate(contentKey, lang, params)
      : content;

    this.logger.debug(
      `[I18N_RESOLVED] Recipient: ${recipientId}, Lang: ${lang}, ` +
      `TitleKey: ${titleKey ?? 'none'}, ContentKey: ${contentKey ?? 'none'}`,
    );

    return { title: resolvedTitle, content: resolvedContent };
  }

  /**
   * Backward-compatible createNotification() API.
   *
   * The legacy shared comms service exposed `createNotification({ tenant_id,
   * user_id, title, message, type, priority, event_reference_id })`. This
   * adapter maps that shape onto the TARA `sendNotification()` API so existing
   * callers keep working. Privacy/visibility is derived from `type`.
   */
  async createNotification(params: {
    tenant_id?: string;
    user_id: string;
    title: string;
    message: string;
    type?: string;
    priority?: string;
    event_reference_id?: string;
    metadata?: any;
    [key: string]: any;
  }) {
    return this.sendNotification({
      recipient_id: params.user_id,
      type: params.type || TaraNotificationType.GENERAL_NOTIFICATION,
      title: params.title,
      content: params.message,
      metadata: {
        ...(params.metadata ?? {}),
        ...(params.priority ? { priority: params.priority } : {}),
        ...(params.event_reference_id
          ? { event_reference_id: params.event_reference_id }
          : {}),
      },
    });
  }

  /**
   * Determine notification visibility based on type
   * Task 13.2: Automatic privacy rule enforcement
   * 
   * Automatically enforces privacy rules per requirements 9.1-9.6:
   * - Tardiness → Public
   * - Warning letters → Private
   * - Clock confirmations → Private
   * - Weekly recaps → HR_Team only
   * 
   * @param notificationType - The type of notification
   * @returns The appropriate visibility level based on privacy rules
   */
  private determineVisibility(notificationType: string): NotificationVisibility {
    // Check if it's a TARA notification type with defined privacy rules
    if (notificationType in NOTIFICATION_PRIVACY_RULES) {
      const visibility = NOTIFICATION_PRIVACY_RULES[notificationType as TaraNotificationType];
      this.logger.debug(
        `[PRIVACY_RULE_APPLIED] Type: ${notificationType}, Visibility: ${visibility}`
      );
      return visibility;
    }
    
    // Default to private for unknown types (safest option)
    this.logger.warn(
      `[PRIVACY_RULE_DEFAULT] Unknown notification type: ${notificationType}, defaulting to PRIVATE`
    );
    return NotificationVisibility.PRIVATE;
  }

  /**
   * Validate that visibility matches privacy rules
   * Task 13.2: Privacy rule validation
   * 
   * Prevents manual override of privacy rules for sensitive notification types
   * like warning letters (must always be private)
   * 
   * @param notificationType - The notification type
   * @param requestedVisibility - The visibility being requested
   * @throws Error if visibility violates privacy rules
   */
  private validateVisibility(notificationType: string, requestedVisibility: string): void {
    const enforcedVisibility = this.determineVisibility(notificationType);
    
    if (requestedVisibility && requestedVisibility !== enforcedVisibility) {
      const message = 
        `Privacy rule violation: ${notificationType} requires ${enforcedVisibility} ` +
        `visibility but ${requestedVisibility} was requested. Privacy rules are enforced automatically.`;
      
      this.logger.error(`[PRIVACY_RULE_VIOLATION] ${message}`);
      throw new Error(message);
    }
  }

  /**
   * Send a notification to an employee with automatic privacy enforcement
   * Task 13.1: Basic notification sending
   * Task 13.2: Privacy rule enforcement
   * 
   * @param params Notification parameters
   * @param params.recipient_id Employee ID receiving the notification
   * @param params.type Notification type (TaraNotificationType enum)
   * @param params.visibility Optional visibility (will be enforced based on type)
   * @param params.title Notification title
   * @param params.content Notification content/message
   * @param params.metadata Optional additional data (JSON)
   * 
   * Requirements:
   * - 9.1: Tardiness notifications as Public_Announcements
   * - 9.2: Warning letters as Private_Notifications
   * - 9.3: Clock confirmations as Private_Notifications
   * 
   * @returns Created notification record
   */
  async sendNotification(params: {
    recipient_id: string;
    type: string;
    visibility?: 'private' | 'public' | 'hr_team_only';
    title: string;
    content: string;
    metadata?: any;
  }) {
    try {
      // Automatically determine and enforce visibility based on notification type
      const enforcedVisibility = this.determineVisibility(params.type);
      
      // If visibility was provided, validate it matches the privacy rules
      if (params.visibility) {
        this.validateVisibility(params.type, params.visibility);
      }

      // Validate recipient exists
      const recipient = await this.prisma.employee.findUnique({
        where: { id: params.recipient_id },
        select: { id: true, full_name: true, email: true },
      });

      if (!recipient) {
        throw new Error(`Recipient employee not found: ${params.recipient_id}`);
      }

      // Resolve translated content based on employee language preference
      // Requirements 16.3, 16.4, 16.5: language-aware notifications
      const { title: resolvedTitle, content: resolvedContent } =
        await this.resolveTranslatedContent(
          params.recipient_id,
          params.title,
          params.content,
          params.metadata,
        );

      // Create notification in database with enforced visibility
      const notification = await this.prisma.notification.create({
        data: {
          recipient_id: params.recipient_id,
          notification_type: params.type,
          visibility: enforcedVisibility, // Privacy rule enforced here
          title: resolvedTitle,
          content: resolvedContent,
          is_read: false,
          metadata: params.metadata || null,
        },
      });

      this.logger.log(
        `[NOTIFICATION_CREATED] ID: ${notification.id}, Type: ${params.type}, ` +
        `Visibility: ${enforcedVisibility} (enforced), Recipient: ${recipient.full_name}`,
      );

      // Deliver notification in real-time via WebSocket
      // Requirement 21.12: Deliver events within 500ms of emission
      this.deliverNotificationRealtime(notification, recipient);

      return notification;
    } catch (error) {
      this.logger.error(
        `[NOTIFICATION_SEND_FAILED] Type: ${params.type}, Recipient: ${params.recipient_id}, Error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Send notification to multiple recipients (bulk operation)
   * Task 13.2: Bulk notification with privacy enforcement
   * Task 16.3: Bounded-query bulk delivery for performance (Req 18.3)
   *
   * Useful for public announcements like tardiness reports. Privacy rules are
   * enforced once for the whole batch (a single notification type implies a
   * single enforced visibility).
   *
   * Performance (Req 18.3): this method issues a BOUNDED number of database
   * queries regardless of how many recipients are addressed:
   *   1. one `employee.findMany` to validate the recipients exist, and
   *   2. one `notification.createManyAndReturn` bulk insert.
   * This avoids the previous per-recipient N+1 pattern (one `findUnique` plus
   * one `create` for every recipient), which is what allows the daily tardiness
   * report to be generated and broadcast well within the 2-minute target even
   * with 50+ tardy employees and the full active-employee audience.
   *
   * @param params.recipient_ids Array of employee IDs
   * @param params.type Notification type
   * @param params.visibility Optional visibility (enforced by type)
   * @param params.title Notification title
   * @param params.content Notification content
   * @param params.metadata Optional metadata
   *
   * @returns Array of created notifications
   */
  async sendBulkNotification(params: {
    recipient_ids: string[];
    type: string;
    visibility?: 'private' | 'public' | 'hr_team_only';
    title: string;
    content: string;
    metadata?: any;
  }) {
    try {
      // Enforce visibility based on notification type
      const enforcedVisibility = this.determineVisibility(params.type);
      
      // Validate visibility if provided
      if (params.visibility) {
        this.validateVisibility(params.type, params.visibility);
      }

      if (params.recipient_ids.length === 0) {
        return [];
      }

      // Validate recipients in a single query instead of one lookup per
      // recipient. Invalid IDs are simply dropped so a bulk send never fails
      // wholesale because of a single stale recipient ID.
      // Also fetch language_preference for i18n resolution (Req 16.4)
      const recipients = await this.prisma.employee.findMany({
        where: { id: { in: params.recipient_ids } },
        select: { id: true, full_name: true, language_preference: true },
      });

      if (recipients.length === 0) {
        this.logger.warn(
          `[BULK_NOTIFICATION] No valid recipients found for type ${params.type}`,
        );
        return [];
      }

      const recipientNameById = new Map(
        recipients.map((recipient) => [recipient.id, recipient.full_name]),
      );

      // Resolve translated content per recipient language preference (Req 16.4)
      const titleKey: string | undefined = params.metadata?.i18n_title_key;
      const contentKey: string | undefined = params.metadata?.i18n_content_key;
      const i18nParams: Record<string, string | number> | undefined = params.metadata?.i18n_params;

      // Single bulk insert that returns the created rows (Prisma
      // createManyAndReturn) instead of N individual create calls.
      const notifications = await this.prisma.notification.createManyAndReturn({
        data: recipients.map((recipient) => {
          let title = params.title;
          let content = params.content;

          // If i18n keys are provided and I18nService is available, translate per recipient
          if (this.i18nService && (titleKey || contentKey)) {
            const lang = recipient.language_preference ?? 'id';
            if (titleKey) {
              title = this.i18nService.translate(titleKey, lang, i18nParams);
            }
            if (contentKey) {
              content = this.i18nService.translate(contentKey, lang, i18nParams);
            }
          }

          return {
            recipient_id: recipient.id,
            notification_type: params.type,
            visibility: enforcedVisibility, // Privacy rule enforced here
            title,
            content,
            is_read: false,
            metadata: params.metadata ?? null,
          };
        }),
      });

      // Real-time delivery is in-memory (WebSocket broadcast) and issues no
      // database queries, so it does not affect the bounded-query guarantee.
      for (const notification of notifications) {
        this.deliverNotificationRealtime(notification, {
          full_name: recipientNameById.get(notification.recipient_id) ?? 'Karyawan',
        });
      }

      this.logger.log(
        `[BULK_NOTIFICATION_SENT] Type: ${params.type}, Recipients: ${notifications.length}, ` +
        `Visibility: ${enforcedVisibility} (enforced)`,
      );

      return notifications;
    } catch (error) {
      this.logger.error(
        `[BULK_NOTIFICATION_FAILED] Type: ${params.type}, Error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Send public announcement to all employees
   * Task 13.2: Public announcements with privacy enforcement
   * 
   * Used for tardiness reports, company-wide announcements, etc.
   * Automatically validates that the notification type allows public visibility
   * 
   * Requirements:
   * - 9.1: Tardiness notifications as Public_Announcements
   * - 9.7: Attendance data for multiple employees as Public_Announcement
   * 
   * @param params.type Notification type (must be a public-allowed type)
   * @param params.title Notification title
   * @param params.content Notification content
   * @param params.metadata Optional metadata
   * @param params.exclude_ids Optional array of employee IDs to exclude
   * 
   * @returns Array of created notifications
   */
  async sendPublicAnnouncement(params: {
    type: string;
    title: string;
    content: string;
    metadata?: any;
    exclude_ids?: string[];
  }) {
    try {
      // Enforce privacy rules - verify this notification type can be public
      const enforcedVisibility = this.determineVisibility(params.type);
      
      if (enforcedVisibility !== NotificationVisibility.PUBLIC) {
        throw new Error(
          `Cannot send ${params.type} as public announcement. ` +
          `This notification type requires ${enforcedVisibility} visibility per privacy rules.`
        );
      }

      // Get all active employees
      const employees = await this.prisma.employee.findMany({
        where: {
          employment_status: 'active',
          ...(params.exclude_ids && params.exclude_ids.length > 0
            ? { id: { notIn: params.exclude_ids } }
            : {}),
        },
        select: { id: true },
      });

      const recipient_ids = employees.map(emp => emp.id);

      if (recipient_ids.length === 0) {
        this.logger.warn('[PUBLIC_ANNOUNCEMENT] No active employees found');
        return [];
      }

      // Send to all employees
      const notifications = await this.sendBulkNotification({
        recipient_ids,
        type: params.type,
        title: params.title,
        content: params.content,
        metadata: params.metadata,
      });

      this.logger.log(
        `[PUBLIC_ANNOUNCEMENT_SENT] Type: ${params.type}, Recipients: ${recipient_ids.length}`,
      );

      return notifications;
    } catch (error) {
      this.logger.error(
        `[PUBLIC_ANNOUNCEMENT_FAILED] Type: ${params.type}, Error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Send private notification to specific employee
   * Task 13.2: Private notifications with privacy enforcement
   * 
   * Used for clock confirmations, warning letters, personal messages
   * Automatically validates that the notification type allows private visibility
   * 
   * Requirements:
   * - 9.2: Warning letters as Private_Notifications
   * - 9.3: Clock confirmations as Private_Notifications
   * 
   * @param params.recipient_id Employee ID
   * @param params.type Notification type (must be a private-allowed type)
   * @param params.title Notification title
   * @param params.content Notification content
   * @param params.metadata Optional metadata
   * 
   * @returns Created notification record
   */
  async sendPrivateNotification(params: {
    recipient_id: string;
    type: string;
    title: string;
    content: string;
    metadata?: any;
  }) {
    try {
      // Enforce privacy rules - verify this notification type can be private
      const enforcedVisibility = this.determineVisibility(params.type);
      
      if (enforcedVisibility !== NotificationVisibility.PRIVATE) {
        throw new Error(
          `Cannot send ${params.type} as private notification. ` +
          `This notification type requires ${enforcedVisibility} visibility per privacy rules.`
        );
      }

      return await this.sendNotification({
        recipient_id: params.recipient_id,
        type: params.type,
        title: params.title,
        content: params.content,
        metadata: params.metadata,
      });
    } catch (error) {
      this.logger.error(
        `[PRIVATE_NOTIFICATION_FAILED] Type: ${params.type}, Recipient: ${params.recipient_id}, Error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Send notification to HR Team members only
   * Task 13.2: HR Team-only notifications with privacy enforcement
   * 
   * Used for weekly attendance recaps and administrative reports
   * Automatically validates that the notification type requires HR_Team visibility
   * 
   * Requirements:
   * - 9.4: Weekly attendance recaps sent only to HR_Team
   * - 9.5: Productivity check-in reports to HR_Team and Supervisors only
   * 
   * @param params.type Notification type (must be an HR_Team type)
   * @param params.title Notification title
   * @param params.content Notification content
   * @param params.metadata Optional metadata
   * @param params.include_supervisors If true, also send to Supervisors
   * 
   * @returns Array of created notification records
   */
  async sendHRTeamNotification(params: {
    type: string;
    title: string;
    content: string;
    metadata?: any;
    include_supervisors?: boolean;
  }): Promise<any[]> {
    try {
      // Enforce privacy rules - verify this notification type requires HR_Team visibility
      const enforcedVisibility = this.determineVisibility(params.type);
      
      if (enforcedVisibility !== NotificationVisibility.HR_TEAM_ONLY) {
        throw new Error(
          `Cannot send ${params.type} as HR Team notification. ` +
          `This notification type requires ${enforcedVisibility} visibility per privacy rules.`
        );
      }

      // Get all HR Team members
      const whereClause: any = {
        employment_status: 'active',
        role: {
          role_name: params.include_supervisors 
            ? { in: ['hr_team', 'supervisor'] }
            : 'hr_team',
        },
      };

      const hrMembers = await this.prisma.employee.findMany({
        where: whereClause,
        select: { id: true, full_name: true, role: true },
      });

      if (hrMembers.length === 0) {
        this.logger.warn(
          `[HR_TEAM_NOTIFICATION] No HR Team members found${params.include_supervisors ? ' or Supervisors' : ''}`
        );
        return [];
      }

      const recipient_ids = hrMembers.map(member => member.id);

      // Send to all HR Team members (and Supervisors if requested)
      const notifications = await this.sendBulkNotification({
        recipient_ids,
        type: params.type,
        title: params.title,
        content: params.content,
        metadata: params.metadata,
      });

      this.logger.log(
        `[HR_TEAM_NOTIFICATION_SENT] Type: ${params.type}, ` +
        `Recipients: ${hrMembers.length} (${hrMembers.map(m => m.role?.role_name).join(', ')})`
      );

      return notifications;
    } catch (error) {
      this.logger.error(
        `[HR_TEAM_NOTIFICATION_FAILED] Type: ${params.type}, Error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * 
   * @param notification_id Notification ID
   * @param employee_id Employee ID (for security check)
   * 
   * @returns Updated notification
   */
  async markAsRead(notification_id: string, employee_id: string) {
    try {
      // Verify notification belongs to this employee
      const notification = await this.prisma.notification.findFirst({
        where: {
          id: notification_id,
          recipient_id: employee_id,
        },
      });

      if (!notification) {
        throw new Error(
          `Notification not found or does not belong to employee: ${notification_id}`,
        );
      }

      // Update to mark as read
      const updated = await this.prisma.notification.update({
        where: { id: notification_id },
        data: {
          is_read: true,
          read_at: new Date(),
        },
      });

      this.logger.log(
        `[NOTIFICATION_READ] ID: ${notification_id}, Employee: ${employee_id}`,
      );

      return updated;
    } catch (error) {
      this.logger.error(
        `[NOTIFICATION_MARK_READ_FAILED] ID: ${notification_id}, Error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Mark all notifications as read for an employee
   * 
   * @param employee_id Employee ID
   * 
   * @returns Count of updated notifications
   */
  async markAllAsRead(employee_id: string) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          recipient_id: employee_id,
          is_read: false,
        },
        data: {
          is_read: true,
          read_at: new Date(),
        },
      });

      this.logger.log(
        `[ALL_NOTIFICATIONS_READ] Employee: ${employee_id}, Count: ${result.count}`,
      );

      return result.count;
    } catch (error) {
      this.logger.error(
        `[MARK_ALL_READ_FAILED] Employee: ${employee_id}, Error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get notifications for an employee with pagination
   * 
   * @param employee_id Employee ID
   * @param params.page Page number (default: 1)
   * @param params.limit Items per page (default: 20)
   * @param params.unread_only Filter for unread only (default: false)
   * 
   * @returns Paginated notifications
   */
  async getNotifications(
    employee_id: string,
    params?: {
      page?: number;
      limit?: number;
      unread_only?: boolean;
    },
  ) {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const skip = (page - 1) * limit;

      const where = {
        recipient_id: employee_id,
        ...(params?.unread_only ? { is_read: false } : {}),
      };

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({ where }),
      ]);

      return {
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `[GET_NOTIFICATIONS_FAILED] Employee: ${employee_id}, Error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get unread notification count for an employee
   * 
   * @param employee_id Employee ID
   * 
   * @returns Count of unread notifications
   */
  async getUnreadCount(employee_id: string): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          recipient_id: employee_id,
          is_read: false,
        },
      });

      return count;
    } catch (error) {
      this.logger.error(
        `[GET_UNREAD_COUNT_FAILED] Employee: ${employee_id}, Error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Deliver notification in real-time via WebSocket
   * Uses EventStreamGateway to broadcast to connected clients
   * 
   * Requirement 21.12: Deliver events within 500ms of emission
   * 
   * @param notification Notification record
   * @param recipient Employee record
   */
  private deliverNotificationRealtime(notification: any, recipient: any) {
    try {
      if (!this.eventStreamGateway) {
        this.logger.warn('[REALTIME_DELIVERY] EventStreamGateway not available');
        return;
      }

      // Broadcast notification event
      this.eventStreamGateway.broadcastEvent('notification.sent', {
        id: notification.id,
        event_type: 'notification.sent',
        tenant_id: 'tara', // TARA is single-tenant
        created_at: notification.created_at,
        entity_id: notification.id,
        entity_type: 'notification',
        payload: {
          notification_id: notification.id,
          recipient_id: notification.recipient_id,
          recipient_name: recipient.full_name,
          notification_type: notification.notification_type,
          visibility: notification.visibility,
          title: notification.title,
          content: notification.content,
          metadata: notification.metadata,
          is_read: notification.is_read,
          created_at: notification.created_at,
        },
      });

      this.logger.debug(
        `[REALTIME_DELIVERY_SENT] Notification: ${notification.id}, Recipient: ${recipient.full_name}`,
      );
    } catch (error) {
      // Don't fail the notification creation if WebSocket delivery fails
      this.logger.error(
        `[REALTIME_DELIVERY_FAILED] Notification: ${notification.id}, Error: ${error.message}`,
      );
    }
  }
}
