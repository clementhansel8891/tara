import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AgentConfigService } from './agent-config.service';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from './event-bus.service';

/**
 * Unit tests for AgentConfigService (Task 20.2)
 *
 * Covers Requirements:
 * - 25.3: configuration available for all 7 agents
 * - 25.4: enable/disable each agent individually
 * - 25.5: track health status and last heartbeat
 *
 * The service is constructed directly with mocked dependencies because the
 * vitest transform does not emit the decorator metadata Nest's DI relies on.
 * This is the established pattern across the HR service specs in this package.
 */
describe('AgentConfigService', () => {
  let service: AgentConfigService;
  let prismaService: any;
  let eventBusService: any;

  const buildConfig = (overrides: Partial<any> = {}) => ({
    id: 'agent-config-1',
    agent_name: 'leave_request',
    is_enabled: true,
    configuration: {},
    last_heartbeat_at: null,
    health_status: 'unknown',
    error_message: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    prismaService = {
      agentConfig: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
    };

    eventBusService = {
      emit: vi.fn().mockResolvedValue({}),
    };

    service = new AgentConfigService(
      prismaService as PrismaService,
      eventBusService as EventBusService,
    );
  });

  it('lists agent configs ordered by name', async () => {
    const configs = [buildConfig(), buildConfig({ agent_name: 'absensi' })];
    prismaService.agentConfig.findMany.mockResolvedValue(configs);

    const result = await service.listAgentConfigs();

    expect(result).toEqual(configs);
    expect(prismaService.agentConfig.findMany).toHaveBeenCalledWith({
      orderBy: { agent_name: 'asc' },
    });
  });

  it('enables an agent and emits a config-change event', async () => {
    const config = buildConfig({ is_enabled: true });
    prismaService.agentConfig.upsert.mockResolvedValue(config);

    const result = await service.setAgentEnabled('leave_request', true, 'hr-1');

    expect(result.is_enabled).toBe(true);
    expect(eventBusService.emit).toHaveBeenCalledTimes(1);
    const emitted = eventBusService.emit.mock.calls[0][0];
    expect(emitted.event_type).toBe('agent.config.changed');
    expect(emitted.payload.agent_name).toBe('leave_request');
    expect(emitted.payload.is_enabled).toBe(true);
  });

  it('rejects an unknown agent name', async () => {
    await expect(
      service.setAgentEnabled('not_an_agent', true),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-object configuration', async () => {
    await expect(
      service.updateAgentConfiguration('absensi', [] as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records a heartbeat with a valid health status', async () => {
    const config = buildConfig({
      agent_name: 'absensi',
      health_status: 'healthy',
      last_heartbeat_at: new Date(),
    });
    prismaService.agentConfig.upsert.mockResolvedValue(config);

    const result = await service.recordHeartbeat('absensi', 'healthy');

    expect(result.health_status).toBe('healthy');
    expect(prismaService.agentConfig.upsert).toHaveBeenCalledTimes(1);
    expect(eventBusService.emit).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid health status', async () => {
    await expect(
      service.setHealthStatus('absensi', 'on_fire'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns a compact health view for one agent', async () => {
    const config = buildConfig({
      health_status: 'degraded',
      error_message: 'slow responses',
    });
    prismaService.agentConfig.findUnique.mockResolvedValue(config);

    const health = await service.getAgentHealth('leave_request');

    expect(health).toEqual({
      agent_name: 'leave_request',
      is_enabled: true,
      health_status: 'degraded',
      last_heartbeat_at: null,
      error_message: 'slow responses',
    });
  });

  it('throws NotFoundException when an agent config is missing', async () => {
    prismaService.agentConfig.findUnique.mockResolvedValue(null);

    await expect(service.getAgentConfig('onboarding')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
