import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../persistence/prisma.service';

/**
 * Follow-Up Executor for Hermes
 *
 * Handles the `set_follow_up` action: schedules a notification to be sent
 * at a future time. Uses the HermesFollowUp table.
 *
 * A scheduled cron job (in HermesFollowUpProcessor) will pick up pending
 * follow-ups and deliver them via NotificationService when their time arrives.
 */
@Injectable()
export class HermesFollowUpExecutor {
  private readonly logger = new Logger(HermesFollowUpExecutor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Schedule a follow-up notification for a future time.
   */
  async setFollowUp(agentId: string, params: {
    recipient_id: string;
    title: string;
    message: string;
    scheduled_at: string;
    context_entity_id?: string;
    context_entity_type?: string;
  }) {
    const scheduledDate = new Date(params.scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Invalid scheduled_at date format');
    }
    if (scheduledDate <= new Date()) {
      throw new BadRequestException('scheduled_at must be in the future');
    }

    // Validate recipient exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: params.recipient_id },
      select: { id: true, employment_status: true },
    });
    if (!employee || employee.employment_status !== 'active') {
      throw new BadRequestException(`Employee not found or not active: ${params.recipient_id}`);
    }

    const followUp = await this.prisma.hermesFollowUp.create({
      data: {
        agent_id: agentId,
        recipient_id: params.recipient_id,
        title: params.title,
        message: params.message,
        scheduled_at: scheduledDate,
        context_entity_id: params.context_entity_id ?? null,
        context_entity_type: params.context_entity_type ?? null,
        status: 'pending',
      },
    });

    this.logger.log(
      `[HERMES] Follow-up scheduled: ${followUp.id} for ${params.recipient_id} at ${params.scheduled_at}`,
    );

    return {
      follow_up_id: followUp.id,
      recipient_id: params.recipient_id,
      scheduled_at: scheduledDate.toISOString(),
      status: 'pending',
    };
  }

  /**
   * List pending follow-ups (for monitoring).
   */
  async listPending(agentId?: string) {
    const where: any = { status: 'pending' };
    if (agentId) where.agent_id = agentId;

    return this.prisma.hermesFollowUp.findMany({
      where,
      orderBy: { scheduled_at: 'asc' },
      take: 50,
    });
  }

  /**
   * Cancel a pending follow-up.
   */
  async cancel(followUpId: string, agentId: string) {
    const followUp = await this.prisma.hermesFollowUp.findUnique({
      where: { id: followUpId },
    });

    if (!followUp) {
      throw new BadRequestException(`Follow-up not found: ${followUpId}`);
    }
    if (followUp.agent_id !== agentId) {
      throw new BadRequestException('Cannot cancel follow-up owned by another agent');
    }
    if (followUp.status !== 'pending') {
      throw new BadRequestException(`Follow-up is already ${followUp.status}`);
    }

    await this.prisma.hermesFollowUp.update({
      where: { id: followUpId },
      data: { status: 'cancelled' },
    });

    return { follow_up_id: followUpId, status: 'cancelled' };
  }
}
