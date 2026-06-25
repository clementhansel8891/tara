import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import {
  DEFAULT_SAFETY_CONFIG,
  HermesSafetyConfig,
  HermesSafeActionType,
} from './hermes.interfaces';

/**
 * Hermes Safety Service
 *
 * Enforces guardrails to prevent abuse or runaway automation:
 * - Max notifications per employee per day (prevent spam)
 * - No duplicate reminders within N hours for same entity
 * - Blocked notification types (warning letters, termination notices)
 * - Content length validation
 * - Max suggestions per agent per day
 */
@Injectable()
export class HermesSafetyService {
  private readonly logger = new Logger(HermesSafetyService.name);
  private config: HermesSafetyConfig = DEFAULT_SAFETY_CONFIG;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate a safe action before execution.
   * Throws BadRequestException if any safety rule is violated.
   */
  async validateAction(
    agentId: string,
    action: HermesSafeActionType,
    params: Record<string, any>,
  ): Promise<void> {
    // 1. Validate content length
    this.validateContentLength(params);

    // 2. Check blocked notification types
    this.validateNotBlockedType(params);

    // 3. Check per-employee daily notification limit
    if (params.recipient_id) {
      await this.validateDailyLimit(params.recipient_id);
    }
    if (params.recipient_ids && Array.isArray(params.recipient_ids)) {
      for (const recipientId of params.recipient_ids) {
        await this.validateDailyLimit(recipientId);
      }
    }

    // 4. Check duplicate reminder suppression
    if (
      (action === 'send_reminder' || action === 'send_deadline_notice') &&
      params.context_entity_id
    ) {
      await this.validateNoDuplicateReminder(
        params.recipient_id,
        params.context_entity_id,
        agentId,
      );
    }

    // 5. Validate scheduled_at is in the future (for follow-ups)
    if (action === 'set_follow_up' && params.scheduled_at) {
      const scheduledDate = new Date(params.scheduled_at);
      if (scheduledDate <= new Date()) {
        throw new BadRequestException('scheduled_at must be in the future');
      }
    }
  }

  /**
   * Validate a suggestion before persistence.
   */
  async validateSuggestion(agentId: string): Promise<void> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await this.prisma.hermesSuggestion.count({
      where: {
        agent_id: agentId,
        created_at: { gte: todayStart },
      },
    });

    if (count >= this.config.max_suggestions_per_agent_per_day) {
      throw new BadRequestException(
        `Daily suggestion limit reached: max ${this.config.max_suggestions_per_agent_per_day} suggestions per agent per day`,
      );
    }
  }

  // ===========================================================================
  // Private validation methods
  // ===========================================================================

  private validateContentLength(params: Record<string, any>): void {
    const message = params.message || params.content || '';
    if (message.length > this.config.max_message_length) {
      throw new BadRequestException(
        `Message too long: ${message.length} chars (max ${this.config.max_message_length})`,
      );
    }

    const title = params.title || '';
    if (title.length > 100) {
      throw new BadRequestException(
        `Title too long: ${title.length} chars (max 100)`,
      );
    }
  }

  private validateNotBlockedType(params: Record<string, any>): void {
    const notificationType = params.notification_type || '';
    if (this.config.blocked_notification_types.includes(notificationType)) {
      throw new BadRequestException(
        `Hermes cannot send notifications of type '${notificationType}' — this requires human action`,
      );
    }
  }

  private async validateDailyLimit(recipientId: string): Promise<void> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await this.prisma.hermesActionLog.count({
      where: {
        status: 'success',
        created_at: { gte: todayStart },
        parameters: {
          path: ['recipient_id'],
          equals: recipientId,
        },
      },
    });

    if (count >= this.config.max_notifications_per_employee_per_day) {
      throw new BadRequestException(
        `Daily notification limit reached for employee ${recipientId}: max ${this.config.max_notifications_per_employee_per_day}/day`,
      );
    }
  }

  private async validateNoDuplicateReminder(
    recipientId: string,
    contextEntityId: string,
    agentId: string,
  ): Promise<void> {
    const intervalMs = this.config.min_reminder_interval_hours * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - intervalMs);

    const recent = await this.prisma.hermesActionLog.findFirst({
      where: {
        agent_id: agentId,
        status: 'success',
        created_at: { gte: cutoff },
        parameters: {
          path: ['recipient_id'],
          equals: recipientId,
        },
        // Also match on context_entity_id in params
        AND: {
          parameters: {
            path: ['context_entity_id'],
            equals: contextEntityId,
          },
        },
      },
    });

    if (recent) {
      throw new BadRequestException(
        `Duplicate reminder suppressed: a reminder for entity '${contextEntityId}' was already sent to this employee within the last ${this.config.min_reminder_interval_hours} hours`,
      );
    }
  }
}
