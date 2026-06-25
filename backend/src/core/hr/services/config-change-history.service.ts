import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../persistence/prisma.service';
import { AuditService } from '../../../shared/audit/audit.service';
import { TaraEvent } from './event-bus.service';

/**
 * Audit `action_type` used to mark a configuration-change audit record. Allows
 * the change history to be retrieved independently of other audit activity.
 */
export const CONFIG_CHANGE_ACTION_TYPE = 'config_change';

/** target_entity_type values used for configuration-change audit records. */
export const CONFIG_ENTITY_SYSTEM_SETTING = 'system_setting';
export const CONFIG_ENTITY_AGENT_CONFIG = 'agent_config';

/** Synthetic category bucket used for agent configuration changes. */
export const AGENT_CONFIG_CATEGORY = 'agent';

/**
 * Event types emitted by SystemSettingsService for the supported configuration
 * categories, plus the generic fallback. Each is observed so that the change is
 * recorded in the configuration change history.
 */
const SYSTEM_SETTING_EVENT_TYPES = [
  'config.attendance_policy_updated',
  'config.geofence_updated',
  'config.leave_policy_updated',
  'config.public_holidays_updated',
  'config.notifications_updated',
  'config.aws_integration_updated',
  'config.updated',
] as const;

/** Input for recording a system-setting configuration change. */
export interface RecordSettingChangeInput {
  setting_key: string;
  setting_category?: string | null;
  operation: 'created' | 'updated' | 'deleted' | string;
  old_value?: any;
  new_value?: any;
  changed_by?: string | null;
  event_type?: string;
}

/** Input for recording an agent configuration change. */
export interface RecordAgentConfigChangeInput {
  agent_name: string;
  operation: string;
  old_value?: any;
  new_value?: any;
  changed_by?: string | null;
  event_type?: string;
}

/**
 * A single, normalized configuration change history entry describing what was
 * changed, who changed it, and when (Requirement 25.21).
 */
export interface ConfigChangeHistoryEntry {
  id: string;
  entity_type: string; // 'system_setting' | 'agent_config'
  entity_id: string; // setting_key or agent_name
  category: string | null;
  operation: string; // created / updated / deleted / enabled / ...
  old_value: any;
  new_value: any;
  changed_by: string | null; // actor id (HR_Team member or 'system')
  changed_at: Date; // when the change occurred
  details: any; // full recorded change payload
}

export interface ConfigChangeHistoryQuery {
  entity_type?: string;
  entity_id?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * ConfigChangeHistoryService for TARA HR System
 *
 * Records an audit trail of every configuration change (system settings and
 * agent configuration) and exposes query methods to retrieve that history.
 *
 * Recording is decoupled from the configuration services: it listens to the
 * `config.*` and `agent.config.changed` events emitted onto the Event Bus by
 * SystemSettingsService (Task 20.1) and AgentConfigService (Task 20.2). Each
 * observed change is persisted to the `AuditLog` table through the shared
 * {@link AuditService}, capturing the old value, the new value and the actor
 * who made the change.
 *
 * Retrieval is performed directly against the `AuditLog` table so that the
 * history can be filtered by setting key, agent name or configuration category
 * and returned as normalized {@link ConfigChangeHistoryEntry} records.
 *
 * Requirements:
 * - 14.4: Log every system configuration change with the administrator who made it
 * - 25.21: Display configuration change history (what changed, who, and when)
 * Task: 20.4
 */
@Injectable()
export class ConfigChangeHistoryService {
  private readonly logger = new Logger(ConfigChangeHistoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Event listeners (decoupled recording)
  // ---------------------------------------------------------------------------

  /**
   * Record a system-setting configuration change in response to a
   * `config.*` event emitted by SystemSettingsService.
   */
  @OnEvent('config.attendance_policy_updated')
  @OnEvent('config.geofence_updated')
  @OnEvent('config.leave_policy_updated')
  @OnEvent('config.public_holidays_updated')
  @OnEvent('config.notifications_updated')
  @OnEvent('config.aws_integration_updated')
  @OnEvent('config.updated')
  async handleSystemSettingChanged(event: TaraEvent | any): Promise<void> {
    try {
      const payload = event?.payload ?? {};
      await this.recordSettingChange({
        setting_key: payload.setting_key ?? event?.entity?.id ?? 'unknown',
        setting_category: payload.setting_category ?? null,
        operation: payload.operation ?? 'updated',
        old_value: payload.previous_value ?? null,
        new_value: payload.setting_value ?? null,
        changed_by: event?.actor?.id ?? null,
        event_type: event?.event_type,
      });
    } catch (error) {
      this.logger.error(
        `Failed to record system setting change from event: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Record an agent configuration change in response to an
   * `agent.config.changed` event emitted by AgentConfigService.
   */
  @OnEvent('agent.config.changed')
  async handleAgentConfigChanged(event: TaraEvent | any): Promise<void> {
    try {
      const payload = event?.payload ?? {};
      const { agent_name, change, ...rest } = payload;
      await this.recordAgentConfigChange({
        agent_name: agent_name ?? event?.entity?.id ?? 'unknown',
        operation: change ?? 'updated',
        old_value: payload.old_value ?? null,
        new_value: Object.keys(rest).length > 0 ? rest : null,
        changed_by: event?.actor?.id ?? null,
        event_type: event?.event_type,
      });
    } catch (error) {
      this.logger.error(
        `Failed to record agent config change from event: ${(error as Error).message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Recording
  // ---------------------------------------------------------------------------

  /**
   * Persist a system-setting configuration change to the audit trail.
   * Requirement 14.4 / 25.21.
   */
  async recordSettingChange(input: RecordSettingChangeInput): Promise<any> {
    return this.auditService.log({
      user_id: input.changed_by ?? 'system',
      action: CONFIG_CHANGE_ACTION_TYPE,
      entity_type: CONFIG_ENTITY_SYSTEM_SETTING,
      entity_id: input.setting_key,
      changes: {
        entity_type: CONFIG_ENTITY_SYSTEM_SETTING,
        entity_id: input.setting_key,
        category: input.setting_category ?? null,
        operation: input.operation,
        old_value: input.old_value ?? null,
        new_value: input.new_value ?? null,
        event_type: input.event_type ?? null,
      },
    });
  }

  /**
   * Persist an agent configuration change to the audit trail.
   * Requirement 14.4 / 25.21.
   */
  async recordAgentConfigChange(
    input: RecordAgentConfigChangeInput,
  ): Promise<any> {
    return this.auditService.log({
      user_id: input.changed_by ?? 'system',
      action: CONFIG_CHANGE_ACTION_TYPE,
      entity_type: CONFIG_ENTITY_AGENT_CONFIG,
      entity_id: input.agent_name,
      changes: {
        entity_type: CONFIG_ENTITY_AGENT_CONFIG,
        entity_id: input.agent_name,
        category: AGENT_CONFIG_CATEGORY,
        operation: input.operation,
        old_value: input.old_value ?? null,
        new_value: input.new_value ?? null,
        event_type: input.event_type ?? null,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Retrieval
  // ---------------------------------------------------------------------------

  /**
   * Retrieve the configuration change history, most recent first.
   *
   * Supports filtering by entity type, by a specific setting key / agent name,
   * and by configuration category.
   */
  async getHistory(
    query: ConfigChangeHistoryQuery = {},
  ): Promise<ConfigChangeHistoryEntry[]> {
    const where: any = { action_type: CONFIG_CHANGE_ACTION_TYPE };

    if (query.entity_type) {
      where.target_entity_type = query.entity_type;
    }

    if (query.entity_id) {
      where.target_entity_id = query.entity_id;
    }

    if (query.category) {
      // Category is stored inside the JSON `changes` payload.
      where.changes = { path: ['category'], equals: query.category };
    }

    const records = await this.prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: query.limit ?? 100,
      skip: query.offset ?? 0,
    });

    return records.map((record) => this.toHistoryEntry(record));
  }

  /**
   * Retrieve the change history for a single system setting key.
   */
  async getHistoryForSettingKey(
    settingKey: string,
    options?: { limit?: number; offset?: number },
  ): Promise<ConfigChangeHistoryEntry[]> {
    return this.getHistory({
      entity_type: CONFIG_ENTITY_SYSTEM_SETTING,
      entity_id: settingKey,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Retrieve the change history for a single agent.
   */
  async getHistoryForAgent(
    agentName: string,
    options?: { limit?: number; offset?: number },
  ): Promise<ConfigChangeHistoryEntry[]> {
    return this.getHistory({
      entity_type: CONFIG_ENTITY_AGENT_CONFIG,
      entity_id: agentName,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Retrieve the change history for a configuration category (e.g. 'attendance',
   * 'geo-fence', 'leave_policy', or 'agent' for agent configuration).
   */
  async getHistoryForCategory(
    category: string,
    options?: { limit?: number; offset?: number },
  ): Promise<ConfigChangeHistoryEntry[]> {
    return this.getHistory({
      category,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Map a raw `AuditLog` record onto a normalized history entry.
   */
  private toHistoryEntry(record: any): ConfigChangeHistoryEntry {
    const changes = (record?.changes ?? {}) as Record<string, any>;

    return {
      id: record.id,
      entity_type: record.target_entity_type,
      entity_id: record.target_entity_id ?? changes.entity_id ?? null,
      category: changes.category ?? null,
      operation: changes.operation ?? record.action_type,
      old_value: changes.old_value ?? null,
      new_value: changes.new_value ?? null,
      changed_by: record.actor_id ?? null,
      changed_at: record.created_at,
      details: changes,
    };
  }
}
