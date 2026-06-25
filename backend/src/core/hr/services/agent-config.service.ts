import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from './event-bus.service';

/**
 * AgentConfigService for TARA HR System
 *
 * Manages the AgentConfig table for all 7 autonomous agents:
 *   - leave_request, absensi, clock_confirmation, weekly_checkin,
 *     late_report, onboarding, saldo_cuti
 *
 * Responsibilities:
 *   - Enable/disable agents individually
 *   - Store per-agent configuration as JSONB (validated)
 *   - Track heartbeat and health status, surface agent health
 *   - Emit a configuration-change event to the Event Bus on every write
 *
 * Requirements: 25.3, 25.4, 25.5 (agent connection management, enable/disable,
 * real-time status with last heartbeat), 15 (agent configuration / health)
 * Task: 20.2
 */
@Injectable()
export class AgentConfigService {
  private readonly logger = new Logger(AgentConfigService.name);

  /** Canonical list of the 7 autonomous agents managed by TARA. */
  static readonly KNOWN_AGENTS = [
    'leave_request',
    'absensi',
    'clock_confirmation',
    'weekly_checkin',
    'late_report',
    'onboarding',
    'saldo_cuti',
  ] as const;

  /** Allowed health status values (see AgentConfig.health_status). */
  static readonly VALID_HEALTH_STATUSES = [
    'healthy',
    'degraded',
    'down',
    'unknown',
  ] as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBusService: EventBusService,
  ) {}

  /**
   * List every agent configuration ordered by agent name.
   * Requirement 25.3: display Agent_Connection_Status for all 7 agents.
   */
  async listAgentConfigs(): Promise<any[]> {
    return this.prisma.agentConfig.findMany({
      orderBy: { agent_name: 'asc' },
    });
  }

  /**
   * Fetch a single agent configuration by name.
   * @throws NotFoundException if the agent has no configuration record.
   */
  async getAgentConfig(agentName: string): Promise<any> {
    const name = this.normalizeAgentName(agentName);
    const config = await this.prisma.agentConfig.findUnique({
      where: { agent_name: name },
    });

    if (!config) {
      throw new NotFoundException(
        `No configuration found for agent '${name}'`,
      );
    }

    return config;
  }

  /**
   * Enable or disable an agent. Creates the record if it does not yet exist.
   * Requirement 25.4: allow HR_Team to enable or disable each agent individually.
   *
   * @param agentName - one of the known agent names
   * @param isEnabled - desired enabled state
   * @param actorId - id of the HR_Team member performing the change (audit/event actor)
   */
  async setAgentEnabled(
    agentName: string,
    isEnabled: boolean,
    actorId = 'system',
  ): Promise<any> {
    const name = this.normalizeAgentName(agentName);

    if (typeof isEnabled !== 'boolean') {
      throw new BadRequestException('isEnabled must be a boolean value');
    }

    const config = await this.prisma.agentConfig.upsert({
      where: { agent_name: name },
      update: { is_enabled: isEnabled, updated_at: new Date() },
      create: {
        agent_name: name,
        is_enabled: isEnabled,
        configuration: {},
        health_status: 'unknown',
      },
    });

    this.logger.log(
      `Agent '${name}' ${isEnabled ? 'enabled' : 'disabled'} by ${actorId}`,
    );

    await this.emitConfigChange(config, actorId, {
      change: isEnabled ? 'enabled' : 'disabled',
      is_enabled: isEnabled,
    });

    return config;
  }

  /**
   * Replace the per-agent configuration JSON after validation.
   * Requirement 25 / 15: store agent-specific configuration as JSONB and
   * validate configuration changes before applying.
   *
   * @param agentName - one of the known agent names
   * @param configuration - plain JSON object to persist
   * @param actorId - id of the actor performing the change
   */
  async updateAgentConfiguration(
    agentName: string,
    configuration: Record<string, any>,
    actorId = 'system',
  ): Promise<any> {
    const name = this.normalizeAgentName(agentName);
    this.validateConfiguration(configuration);

    const config = await this.prisma.agentConfig.upsert({
      where: { agent_name: name },
      update: { configuration: configuration as any, updated_at: new Date() },
      create: {
        agent_name: name,
        is_enabled: true,
        configuration: configuration as any,
        health_status: 'unknown',
      },
    });

    this.logger.log(`Configuration updated for agent '${name}' by ${actorId}`);

    await this.emitConfigChange(config, actorId, {
      change: 'configuration_updated',
      configuration,
    });

    return config;
  }

  /**
   * Record a heartbeat from an agent and optionally update its health status.
   * Requirement 25.5: display real-time status with last heartbeat timestamp.
   *
   * @param agentName - one of the known agent names
   * @param healthStatus - optional health status to set (defaults to 'healthy')
   * @param errorMessage - optional error message (cleared when not provided and healthy)
   */
  async recordHeartbeat(
    agentName: string,
    healthStatus: string = 'healthy',
    errorMessage?: string,
  ): Promise<any> {
    const name = this.normalizeAgentName(agentName);
    this.validateHealthStatus(healthStatus);

    const now = new Date();
    const config = await this.prisma.agentConfig.upsert({
      where: { agent_name: name },
      update: {
        last_heartbeat_at: now,
        health_status: healthStatus,
        error_message: errorMessage ?? null,
        updated_at: now,
      },
      create: {
        agent_name: name,
        is_enabled: true,
        configuration: {},
        last_heartbeat_at: now,
        health_status: healthStatus,
        error_message: errorMessage ?? null,
      },
    });

    await this.emitConfigChange(config, name, {
      change: 'heartbeat',
      health_status: healthStatus,
      last_heartbeat_at: now,
    });

    return config;
  }

  /**
   * Explicitly set an agent's health status and optional error message.
   * Requirement 25.5: surface enabled, disabled, or error states.
   */
  async setHealthStatus(
    agentName: string,
    healthStatus: string,
    errorMessage?: string,
    actorId = 'system',
  ): Promise<any> {
    const name = this.normalizeAgentName(agentName);
    this.validateHealthStatus(healthStatus);

    const config = await this.prisma.agentConfig.upsert({
      where: { agent_name: name },
      update: {
        health_status: healthStatus,
        error_message: errorMessage ?? null,
        updated_at: new Date(),
      },
      create: {
        agent_name: name,
        is_enabled: true,
        configuration: {},
        health_status: healthStatus,
        error_message: errorMessage ?? null,
      },
    });

    this.logger.log(
      `Health status for agent '${name}' set to '${healthStatus}' by ${actorId}`,
    );

    await this.emitConfigChange(config, actorId, {
      change: 'health_status_updated',
      health_status: healthStatus,
      error_message: errorMessage ?? null,
    });

    return config;
  }

  /**
   * Return a compact health view for a single agent.
   */
  async getAgentHealth(agentName: string): Promise<{
    agent_name: string;
    is_enabled: boolean;
    health_status: string;
    last_heartbeat_at: Date | null;
    error_message: string | null;
  }> {
    const config = await this.getAgentConfig(agentName);
    return {
      agent_name: config.agent_name,
      is_enabled: config.is_enabled,
      health_status: config.health_status,
      last_heartbeat_at: config.last_heartbeat_at,
      error_message: config.error_message,
    };
  }

  /**
   * Return the health view for every configured agent.
   */
  async getAllAgentHealth(): Promise<
    Array<{
      agent_name: string;
      is_enabled: boolean;
      health_status: string;
      last_heartbeat_at: Date | null;
      error_message: string | null;
    }>
  > {
    const configs = await this.listAgentConfigs();
    return configs.map((config) => ({
      agent_name: config.agent_name,
      is_enabled: config.is_enabled,
      health_status: config.health_status,
      last_heartbeat_at: config.last_heartbeat_at,
      error_message: config.error_message,
    }));
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Validate and normalize an agent name against the known agent list.
   * @throws BadRequestException for unknown agents.
   */
  private normalizeAgentName(agentName: string): string {
    if (!agentName || typeof agentName !== 'string') {
      throw new BadRequestException('agentName is required');
    }

    const name = agentName.trim().toLowerCase();
    if (!(AgentConfigService.KNOWN_AGENTS as readonly string[]).includes(name)) {
      throw new BadRequestException(
        `Unknown agent '${agentName}'. Valid agents: ${AgentConfigService.KNOWN_AGENTS.join(', ')}`,
      );
    }

    return name;
  }

  /**
   * Validate that a configuration payload is a plain JSON object.
   */
  private validateConfiguration(configuration: Record<string, any>): void {
    if (
      configuration === null ||
      typeof configuration !== 'object' ||
      Array.isArray(configuration)
    ) {
      throw new BadRequestException(
        'Agent configuration must be a JSON object',
      );
    }
  }

  /**
   * Validate a health status value.
   */
  private validateHealthStatus(healthStatus: string): void {
    if (
      !(AgentConfigService.VALID_HEALTH_STATUSES as readonly string[]).includes(
        healthStatus,
      )
    ) {
      throw new BadRequestException(
        `Invalid health status '${healthStatus}'. Valid statuses: ${AgentConfigService.VALID_HEALTH_STATUSES.join(', ')}`,
      );
    }
  }

  /**
   * Emit a configuration-change event to the Event Bus.
   * Requirement 25.18 / 15: emit a configuration change event on changes.
   * Failures are logged but do not roll back the persisted change.
   */
  private async emitConfigChange(
    config: any,
    actorId: string,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      await this.eventBusService.emit({
        event_type: 'agent.config.changed',
        event_version: '1.0',
        actor: {
          id: actorId,
          type: actorId === config.agent_name ? 'agent' : 'system',
        },
        entity: {
          id: config.id,
          type: 'agent_config',
        },
        payload: {
          agent_name: config.agent_name,
          ...payload,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit agent.config.changed event for '${config.agent_name}': ${
          (error as Error).message
        }`,
      );
    }
  }
}
