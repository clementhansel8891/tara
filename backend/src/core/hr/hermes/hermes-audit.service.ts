import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { HermesAuthorityLevel } from './hermes.interfaces';

/**
 * Hermes Audit Service
 *
 * Logs every action (safe or suggestion) performed by Hermes agents
 * into the HermesActionLog table for compliance and monitoring.
 */
@Injectable()
export class HermesAuditService {
  private readonly logger = new Logger(HermesAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a Hermes action execution.
   */
  async logAction(params: {
    agent_id: string;
    action_type: string;
    parameters: Record<string, any>;
    authority_level: HermesAuthorityLevel;
    status: 'success' | 'failed' | 'rate_limited' | 'authority_denied' | 'safety_blocked';
    result?: any;
    error_message?: string;
    execution_ms?: number;
  }): Promise<string> {
    const log = await this.prisma.hermesActionLog.create({
      data: {
        agent_id: params.agent_id,
        action_type: params.action_type,
        parameters: params.parameters as any,
        authority_level: params.authority_level,
        status: params.status,
        result: params.result as any ?? undefined,
        error_message: params.error_message ?? null,
        execution_ms: params.execution_ms ?? null,
      },
    });

    this.logger.log(
      `[HERMES_AUDIT] ${params.status.toUpperCase()} | agent=${params.agent_id} | action=${params.action_type} | ${params.execution_ms ?? 0}ms`,
    );

    return log.id;
  }

  /**
   * Get action logs for a specific agent within a time range.
   */
  async getAgentLogs(
    agentId: string,
    options?: { since?: Date; limit?: number; status?: string },
  ) {
    const where: any = { agent_id: agentId };
    if (options?.since) where.created_at = { gte: options.since };
    if (options?.status) where.status = options.status;

    return this.prisma.hermesActionLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: options?.limit ?? 50,
    });
  }

  /**
   * Get summary stats for dashboard display.
   */
  async getDailyStats(agentId?: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const where: any = { created_at: { gte: todayStart } };
    if (agentId) where.agent_id = agentId;

    const [total, success, failed, blocked] = await Promise.all([
      this.prisma.hermesActionLog.count({ where }),
      this.prisma.hermesActionLog.count({ where: { ...where, status: 'success' } }),
      this.prisma.hermesActionLog.count({ where: { ...where, status: 'failed' } }),
      this.prisma.hermesActionLog.count({ where: { ...where, status: 'safety_blocked' } }),
    ]);

    return { date: todayStart.toISOString().slice(0, 10), total, success, failed, blocked };
  }
}
