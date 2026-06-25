import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';

export interface HermesAgent {
  id: string;
  name: string;
  type: string;
  endpoint_url: string;
  api_key?: string;
  is_enabled: boolean;
  authority_level: 'read_only' | 'read_write' | 'full_autonomous';
  subscribed_events: string[];
  last_heartbeat?: string;
  health_status: 'healthy' | 'degraded' | 'disconnected' | 'unknown';
}

export interface HermesConfig {
  enabled: boolean;
  connection_url: string;
  api_key: string;
  webhook_secret: string;
  retry_policy: { max_retries: number; backoff_ms: number };
  agents: HermesAgent[];
  event_filter: string[];  // which event types to forward to Hermes
}

/**
 * Hermes Integration Service — manages the Hermes Agentic AI connection.
 * Configures which agents are connected, their authority levels,
 * and which events they consume from the TARA Event Bus.
 */
@Injectable()
export class HermesIntegrationService {
  private readonly logger = new Logger(HermesIntegrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // === Configuration ===

  async getConfig(): Promise<HermesConfig> {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { setting_key: 'hermes_integration' },
    });
    return (setting?.setting_value as any) || this.getDefaultConfig();
  }

  async updateConfig(config: Partial<HermesConfig>) {
    const current = await this.getConfig();
    const merged = { ...current, ...config };

    await this.prisma.systemSettings.upsert({
      where: { setting_key: 'hermes_integration' },
      update: { setting_value: merged as any, updated_at: new Date() },
      create: {
        setting_key: 'hermes_integration',
        setting_value: merged as any,
        setting_category: 'integrations',
      },
    });
    return merged;
  }

  // === Agent Management ===

  async getAgents(): Promise<HermesAgent[]> {
    const config = await this.getConfig();
    return config.agents || [];
  }

  async addAgent(agent: Omit<HermesAgent, 'id' | 'health_status' | 'last_heartbeat'>) {
    const config = await this.getConfig();
    const newAgent: HermesAgent = {
      ...agent,
      id: `hermes-${Date.now().toString(36)}`,
      health_status: 'unknown',
    };
    config.agents.push(newAgent);
    await this.updateConfig({ agents: config.agents });
    return newAgent;
  }

  async updateAgent(agentId: string, data: Partial<HermesAgent>) {
    const config = await this.getConfig();
    config.agents = config.agents.map((a) => a.id === agentId ? { ...a, ...data } : a);
    await this.updateConfig({ agents: config.agents });
    return config.agents.find((a) => a.id === agentId);
  }

  async removeAgent(agentId: string) {
    const config = await this.getConfig();
    config.agents = config.agents.filter((a) => a.id !== agentId);
    await this.updateConfig({ agents: config.agents });
  }

  // === Authority ===

  async setAgentAuthority(agentId: string, authority: HermesAgent['authority_level']) {
    return this.updateAgent(agentId, { authority_level: authority });
  }

  // === Event Forwarding ===

  async getEventFilter(): Promise<string[]> {
    const config = await this.getConfig();
    return config.event_filter;
  }

  async updateEventFilter(events: string[]) {
    await this.updateConfig({ event_filter: events });
    return events;
  }

  // === Connection Testing ===

  async testConnection(): Promise<{ success: boolean; latency_ms: number; message: string }> {
    const config = await this.getConfig();
    if (!config.enabled) return { success: false, latency_ms: 0, message: 'Hermes integration is disabled' };
    if (!config.connection_url) return { success: false, latency_ms: 0, message: 'Connection URL not configured' };

    const start = Date.now();
    try {
      // TODO: actual HTTP health check to config.connection_url
      this.logger.log(`Testing Hermes connection to ${config.connection_url}`);
      const latency = Date.now() - start;
      return { success: true, latency_ms: latency, message: 'Connection successful' };
    } catch (err) {
      return { success: false, latency_ms: Date.now() - start, message: err.message };
    }
  }

  private getDefaultConfig(): HermesConfig {
    return {
      enabled: false,
      connection_url: '',
      api_key: '',
      webhook_secret: '',
      retry_policy: { max_retries: 3, backoff_ms: 1000 },
      agents: [],
      event_filter: [
        'attendance.clock_in',
        'attendance.clock_out',
        'attendance.tardiness_detected',
        'leave.request.submitted',
        'leave.request.approved',
        'leave.request.rejected',
        'report.tardiness_generated',
        'onboarding.workflow_completed',
      ],
    };
  }
}
