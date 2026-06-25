import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConfigChangeHistoryService,
  CONFIG_CHANGE_ACTION_TYPE,
  CONFIG_ENTITY_SYSTEM_SETTING,
  CONFIG_ENTITY_AGENT_CONFIG,
  AGENT_CONFIG_CATEGORY,
} from './config-change-history.service';

/**
 * Smoke tests for ConfigChangeHistoryService (Task 20.4).
 *
 * Verifies that configuration changes are recorded to the audit trail with the
 * old/new value and actor captured, and that the history can be retrieved and
 * filtered by setting key, agent name and category.
 */
describe('ConfigChangeHistoryService', () => {
  let service: ConfigChangeHistoryService;
  let auditService: { log: ReturnType<typeof vi.fn> };
  let prisma: { auditLog: { findMany: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    auditService = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };
    prisma = { auditLog: { findMany: vi.fn().mockResolvedValue([]) } };
    service = new ConfigChangeHistoryService(
      prisma as any,
      auditService as any,
    );
  });

  describe('recording', () => {
    it('records a system setting change with old/new value and actor', async () => {
      await service.recordSettingChange({
        setting_key: 'tardiness_threshold',
        setting_category: 'attendance',
        operation: 'updated',
        old_value: { time: '09:00' },
        new_value: { time: '08:30' },
        changed_by: 'hr-user-1',
      });

      expect(auditService.log).toHaveBeenCalledTimes(1);
      const arg = auditService.log.mock.calls[0][0];
      expect(arg.action).toBe(CONFIG_CHANGE_ACTION_TYPE);
      expect(arg.entity_type).toBe(CONFIG_ENTITY_SYSTEM_SETTING);
      expect(arg.entity_id).toBe('tardiness_threshold');
      expect(arg.user_id).toBe('hr-user-1');
      expect(arg.changes.category).toBe('attendance');
      expect(arg.changes.old_value).toEqual({ time: '09:00' });
      expect(arg.changes.new_value).toEqual({ time: '08:30' });
    });

    it('defaults the actor to "system" when not provided', async () => {
      await service.recordSettingChange({
        setting_key: 'k',
        operation: 'created',
      });

      expect(auditService.log.mock.calls[0][0].user_id).toBe('system');
    });

    it('records an agent config change under the agent category', async () => {
      await service.recordAgentConfigChange({
        agent_name: 'absensi',
        operation: 'disabled',
        new_value: { is_enabled: false },
        changed_by: 'hr-user-2',
      });

      const arg = auditService.log.mock.calls[0][0];
      expect(arg.entity_type).toBe(CONFIG_ENTITY_AGENT_CONFIG);
      expect(arg.entity_id).toBe('absensi');
      expect(arg.changes.category).toBe(AGENT_CONFIG_CATEGORY);
      expect(arg.changes.operation).toBe('disabled');
    });
  });

  describe('event listeners', () => {
    it('records a change when a system setting event is observed', async () => {
      await service.handleSystemSettingChanged({
        event_type: 'config.attendance_policy_updated',
        actor: { id: 'hr-user-1', type: 'employee' },
        entity: { id: 'tardiness_threshold', type: 'system_setting' },
        payload: {
          operation: 'updated',
          setting_key: 'tardiness_threshold',
          setting_category: 'attendance',
          setting_value: { time: '08:30' },
          previous_value: { time: '09:00' },
        },
      });

      const arg = auditService.log.mock.calls[0][0];
      expect(arg.entity_id).toBe('tardiness_threshold');
      expect(arg.changes.old_value).toEqual({ time: '09:00' });
      expect(arg.changes.new_value).toEqual({ time: '08:30' });
      expect(arg.user_id).toBe('hr-user-1');
    });

    it('records a change when an agent config event is observed', async () => {
      await service.handleAgentConfigChanged({
        event_type: 'agent.config.changed',
        actor: { id: 'hr-user-2', type: 'system' },
        entity: { id: 'agent-config-id', type: 'agent_config' },
        payload: {
          agent_name: 'late_report',
          change: 'configuration_updated',
          configuration: { threshold: 5 },
        },
      });

      const arg = auditService.log.mock.calls[0][0];
      expect(arg.entity_type).toBe(CONFIG_ENTITY_AGENT_CONFIG);
      expect(arg.entity_id).toBe('late_report');
      expect(arg.changes.operation).toBe('configuration_updated');
    });

    it('never throws if recording from an event fails', async () => {
      auditService.log.mockRejectedValueOnce(new Error('db down'));
      await expect(
        service.handleSystemSettingChanged({
          event_type: 'config.updated',
          payload: {},
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('retrieval', () => {
    it('maps audit records into normalized history entries (what/who/when)', async () => {
      const created = new Date('2026-02-01T03:00:00Z');
      prisma.auditLog.findMany.mockResolvedValueOnce([
        {
          id: 'audit-1',
          action_type: CONFIG_CHANGE_ACTION_TYPE,
          actor_id: 'hr-user-1',
          target_entity_type: CONFIG_ENTITY_SYSTEM_SETTING,
          target_entity_id: 'tardiness_threshold',
          created_at: created,
          changes: {
            category: 'attendance',
            operation: 'updated',
            old_value: { time: '09:00' },
            new_value: { time: '08:30' },
          },
        },
      ]);

      const history = await service.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        entity_id: 'tardiness_threshold',
        category: 'attendance',
        operation: 'updated',
        old_value: { time: '09:00' },
        new_value: { time: '08:30' },
        changed_by: 'hr-user-1',
        changed_at: created,
      });
    });

    it('filters history by setting key', async () => {
      await service.getHistoryForSettingKey('geofence_radius');
      const where = prisma.auditLog.findMany.mock.calls[0][0].where;
      expect(where).toMatchObject({
        action_type: CONFIG_CHANGE_ACTION_TYPE,
        target_entity_type: CONFIG_ENTITY_SYSTEM_SETTING,
        target_entity_id: 'geofence_radius',
      });
    });

    it('filters history by agent name', async () => {
      await service.getHistoryForAgent('saldo_cuti');
      const where = prisma.auditLog.findMany.mock.calls[0][0].where;
      expect(where).toMatchObject({
        target_entity_type: CONFIG_ENTITY_AGENT_CONFIG,
        target_entity_id: 'saldo_cuti',
      });
    });

    it('filters history by category using the JSON changes payload', async () => {
      await service.getHistoryForCategory('leave_policy');
      const where = prisma.auditLog.findMany.mock.calls[0][0].where;
      expect(where.changes).toEqual({
        path: ['category'],
        equals: 'leave_policy',
      });
    });
  });
});
