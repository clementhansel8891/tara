import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService, TaraEvent } from '../services/event-bus.service';

/**
 * Individual agent health status.
 */
export interface AgentHealthEntry {
  agent_name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  last_heartbeat: string | null;
  error_message: string | null;
}

/**
 * System-wide health report.
 */
export interface SystemHealthReport {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  database: { status: 'connected' | 'disconnected'; latency_ms: number };
  event_bus: { status: 'operational' | 'degraded' | 'down'; pending_events: number; failed_events: number };
  agents: AgentHealthEntry[];
  system_metrics: {
    total_employees: number;
    active_notifications_today: number;
    events_emitted_today: number;
    offline_actions_pending: number;
  };
}

/**
 * Health Check Agent
 *
 * Autonomous monitoring service for the TARA HR System that provides:
 * - Periodic system-wide health checks (database, event bus, agents)
 * - Agent heartbeat monitoring and alerting
 * - Performance metrics collection
 * - Degradation detection and event emission for external consumers (Hermes)
 * - Service readiness probes for orchestration
 *
 * This agent is the central point for Hermes and any external system to query
 * the real-time operational status of the entire TARA platform.
 *
 * Scheduled tasks:
 * - Every 2 minutes: run a lightweight heartbeat check
 * - Every 15 minutes: run a full system health audit
 * - Daily at 07:00 WIB: generate a daily health summary report
 */
@Injectable()
export class HealthCheckAgent {
  private readonly logger = new Logger(HealthCheckAgent.name);
  private lastFullReport: SystemHealthReport | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBusService: EventBusService,
  ) {
    this.logger.log('Health Check Agent initialized');
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Get the latest cached full health report, or generate one on-demand.
   */
  async getSystemHealth(): Promise<SystemHealthReport> {
    if (this.lastFullReport) {
      return this.lastFullReport;
    }
    return this.runFullHealthAudit();
  }

  /**
   * Lightweight liveness check for external probes.
   */
  async getLiveness(): Promise<{ status: 'alive'; uptime_seconds: number; timestamp: string }> {
    return {
      status: 'alive',
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deep readiness check including database and event bus.
   */
  async getReadiness(): Promise<{ status: 'ready' | 'not_ready'; details: Record<string, any> }> {
    const dbCheck = await this.checkDatabase();
    const eventBusCheck = await this.checkEventBus();

    const isReady = dbCheck.status === 'connected' && eventBusCheck.status === 'operational';

    return {
      status: isReady ? 'ready' : 'not_ready',
      details: { database: dbCheck, event_bus: eventBusCheck },
    };
  }

  // ─── Scheduled Tasks ──────────────────────────────────────────────────────

  /**
   * Lightweight heartbeat — every 2 minutes during working hours.
   * Updates agent heartbeat timestamps and detects stale agents.
   */
  @Cron('*/2 7-20 * * 1-5') // Every 2 min, 7 AM to 8 PM, Mon-Fri
  async heartbeatCheck(): Promise<void> {
    this.logger.debug('Running heartbeat check');

    try {
      // Update our own heartbeat
      await this.updateAgentHeartbeat('health_check', 'healthy');

      // Check other agents for stale heartbeats (no heartbeat in 10 min)
      const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
      const staleAgents = await this.prisma.agentConfig.findMany({
        where: {
          is_enabled: true,
          agent_name: { not: 'health_check' },
          OR: [
            { last_heartbeat_at: null },
            { last_heartbeat_at: { lt: staleThreshold } },
          ],
        },
      });

      if (staleAgents.length > 0) {
        this.logger.warn(
          `Detected ${staleAgents.length} stale agent(s): ${staleAgents.map((a) => a.agent_name).join(', ')}`,
        );

        // Emit degradation event
        await this.emitHealthEvent('system.agent_heartbeat_stale', {
          stale_agents: staleAgents.map((a) => ({
            agent_name: a.agent_name,
            last_heartbeat: a.last_heartbeat_at?.toISOString() ?? null,
          })),
        });
      }
    } catch (error) {
      this.logger.error(`Heartbeat check failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Full system health audit — every 15 minutes.
   */
  @Cron('*/15 * * * *') // Every 15 minutes, 24/7
  async runFullHealthAudit(): Promise<SystemHealthReport> {
    this.logger.log('Running full system health audit');

    try {
      const [dbCheck, eventBusCheck, agentStatuses, metrics] = await Promise.all([
        this.checkDatabase(),
        this.checkEventBus(),
        this.checkAllAgents(),
        this.collectSystemMetrics(),
      ]);

      // Determine overall status
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (dbCheck.status === 'disconnected') {
        overallStatus = 'unhealthy';
      } else if (
        eventBusCheck.status !== 'operational' ||
        agentStatuses.some((a) => a.status === 'unhealthy')
      ) {
        overallStatus = 'degraded';
      }

      const report: SystemHealthReport = {
        overall_status: overallStatus,
        timestamp: new Date().toISOString(),
        database: dbCheck,
        event_bus: eventBusCheck,
        agents: agentStatuses,
        system_metrics: metrics,
      };

      this.lastFullReport = report;

      // Emit health report event for Hermes
      await this.emitHealthEvent('system.health_report', {
        overall_status: overallStatus,
        database_status: dbCheck.status,
        event_bus_status: eventBusCheck.status,
        unhealthy_agents: agentStatuses.filter((a) => a.status === 'unhealthy').map((a) => a.agent_name),
        degraded_agents: agentStatuses.filter((a) => a.status === 'degraded').map((a) => a.agent_name),
      });

      // Update our own health status
      await this.updateAgentHeartbeat('health_check', 'healthy');

      return report;
    } catch (error) {
      this.logger.error(`Full health audit failed: ${error.message}`, error.stack);
      await this.updateAgentHeartbeat('health_check', 'unhealthy', error.message);

      const failedReport: SystemHealthReport = {
        overall_status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: { status: 'disconnected', latency_ms: -1 },
        event_bus: { status: 'down', pending_events: 0, failed_events: 0 },
        agents: [],
        system_metrics: { total_employees: 0, active_notifications_today: 0, events_emitted_today: 0, offline_actions_pending: 0 },
      };
      this.lastFullReport = failedReport;
      return failedReport;
    }
  }

  /**
   * Daily health summary — 07:00 WIB (00:00 UTC).
   * Generates a comprehensive summary for the previous 24 hours.
   */
  @Cron('0 0 * * *') // Daily at 00:00 UTC (07:00 WIB)
  async generateDailyHealthSummary(): Promise<void> {
    this.logger.log('Generating daily health summary');

    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Count events in last 24h
      const eventsLast24h = await this.prisma.eventBusLog.count({
        where: { event_timestamp: { gte: yesterday } },
      });

      // Count failed events
      const failedEventsLast24h = await this.prisma.eventBusLog.count({
        where: { event_timestamp: { gte: yesterday }, delivery_status: 'failed' },
      });

      // Get all agent configs
      const agents = await this.prisma.agentConfig.findMany({
        where: { is_enabled: true },
      });

      const summary = {
        period: { start: yesterday.toISOString(), end: new Date().toISOString() },
        total_events_processed: eventsLast24h,
        failed_events: failedEventsLast24h,
        event_success_rate: eventsLast24h > 0
          ? Math.round(((eventsLast24h - failedEventsLast24h) / eventsLast24h) * 100 * 100) / 100
          : 100,
        agents_summary: agents.map((a) => ({
          name: a.agent_name,
          status: a.health_status,
          last_heartbeat: a.last_heartbeat_at?.toISOString() ?? null,
        })),
      };

      await this.emitHealthEvent('system.daily_health_summary', summary);

      this.logger.log(
        `Daily summary: ${eventsLast24h} events, ${failedEventsLast24h} failures, ` +
          `${summary.event_success_rate}% success rate`,
      );
    } catch (error) {
      this.logger.error(`Failed to generate daily health summary: ${error.message}`, error.stack);
    }
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  private async checkDatabase(): Promise<{ status: 'connected' | 'disconnected'; latency_ms: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'connected', latency_ms: Date.now() - start };
    } catch {
      return { status: 'disconnected', latency_ms: Date.now() - start };
    }
  }

  private async checkEventBus(): Promise<{ status: 'operational' | 'degraded' | 'down'; pending_events: number; failed_events: number }> {
    try {
      const [pending, failed] = await Promise.all([
        this.prisma.eventBusLog.count({ where: { delivery_status: 'pending' } }),
        this.prisma.eventBusLog.count({ where: { delivery_status: 'failed' } }),
      ]);

      let status: 'operational' | 'degraded' | 'down' = 'operational';
      if (failed > 50) status = 'degraded';
      if (pending > 1000) status = 'down';

      return { status, pending_events: pending, failed_events: failed };
    } catch {
      return { status: 'down', pending_events: 0, failed_events: 0 };
    }
  }

  private async checkAllAgents(): Promise<AgentHealthEntry[]> {
    const agentConfigs = await this.prisma.agentConfig.findMany({
      where: { is_enabled: true },
    });

    return agentConfigs.map((config) => ({
      agent_name: config.agent_name,
      status: (config.health_status as AgentHealthEntry['status']) || 'unknown',
      last_heartbeat: config.last_heartbeat_at?.toISOString() ?? null,
      error_message: config.error_message,
    }));
  }

  private async collectSystemMetrics(): Promise<SystemHealthReport['system_metrics']> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEmployees, notificationsToday, eventsToday, offlinePending] = await Promise.all([
      this.prisma.employee.count({ where: { employment_status: 'active' } }),
      this.prisma.notification.count({ where: { created_at: { gte: today } } }),
      this.prisma.eventBusLog.count({ where: { event_timestamp: { gte: today } } }),
      this.prisma.offlineActionQueue.count({ where: { sync_status: 'pending' } }),
    ]);

    return {
      total_employees: totalEmployees,
      active_notifications_today: notificationsToday,
      events_emitted_today: eventsToday,
      offline_actions_pending: offlinePending,
    };
  }

  private async updateAgentHeartbeat(
    agentName: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.agentConfig.upsert({
        where: { agent_name: agentName },
        update: {
          last_heartbeat_at: new Date(),
          health_status: status,
          error_message: errorMessage ?? null,
        },
        create: {
          agent_name: agentName,
          is_enabled: true,
          configuration: {},
          last_heartbeat_at: new Date(),
          health_status: status,
          error_message: errorMessage ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update heartbeat for ${agentName}: ${error.message}`);
    }
  }

  private async emitHealthEvent(eventType: string, payload: any): Promise<void> {
    try {
      const event: Partial<TaraEvent> = {
        event_type: eventType,
        event_version: '1.0',
        event_timestamp: new Date(),
        actor: { id: 'health_check_agent', type: 'agent' },
        entity: { id: 'system', type: 'health' },
        payload,
      };
      await this.eventBusService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to emit health event ${eventType}: ${error.message}`);
    }
  }

  /**
   * Get agent health status (self-report for the agent registry).
   */
  async getHealthStatus(): Promise<{
    agent_name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    last_check: string;
    metrics: {
      last_full_audit: string | null;
      overall_system_status: string | null;
      uptime_seconds: number;
    };
  }> {
    return {
      agent_name: 'Health_Check_Agent',
      status: 'healthy',
      last_check: new Date().toISOString(),
      metrics: {
        last_full_audit: this.lastFullReport?.timestamp ?? null,
        overall_system_status: this.lastFullReport?.overall_status ?? null,
        uptime_seconds: Math.floor(process.uptime()),
      },
    };
  }
}
