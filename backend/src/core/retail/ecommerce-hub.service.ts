import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { IEcommerceHubRepository } from './repositories/ecommerce-hub.repository.interface';
import {
  EcommerceConnector,
  ConnectorWithPlainKey,
  EcommerceChannel,
  ChannelWithPlainCredentials,
} from './entities/ecommerce-hub.entity';
import {
  CreateEcommerceConnectorDto,
  UpdateEcommerceConnectorDto,
  CreateRetailChannelDto,
  UpdateRetailChannelDto,
} from './dto/ecommerce-hub.dto';

@Injectable()
export class EcommerceHubService {
  constructor(private readonly repo: IEcommerceHubRepository) {}

  // ── EcommerceConnectors ────────────────────────────────────

  async listConnectors(tenantId: string): Promise<EcommerceConnector[]> {
    return this.repo.listConnectors(tenantId);
  }

  async getConnector(tenantId: string, id: string): Promise<EcommerceConnector> {
    const connector = await this.repo.getConnector(tenantId, id);
    if (!connector) {
      throw new NotFoundException(`EcommerceConnector ${id} not found`);
    }
    return connector;
  }

  async createConnector(
    tenantId: string,
    dto: CreateEcommerceConnectorDto,
  ): Promise<ConnectorWithPlainKey> {
    if (!dto.name || !dto.platform || !dto.domain) {
      throw new BadRequestException('name, platform, and domain are required');
    }
    return this.repo.createConnector(tenantId, dto);
  }

  async updateConnector(
    tenantId: string,
    id: string,
    dto: UpdateEcommerceConnectorDto,
  ): Promise<EcommerceConnector> {
    await this.getConnector(tenantId, id); // ensure exists
    return this.repo.updateConnector(tenantId, id, dto);
  }

  async rotateConnectorApiKey(
    tenantId: string,
    id: string,
  ): Promise<{ plainApiKey: string }> {
    await this.getConnector(tenantId, id);
    return this.repo.rotateConnectorApiKey(tenantId, id);
  }

  async deleteConnector(tenantId: string, id: string): Promise<{ deleted: boolean }> {
    await this.getConnector(tenantId, id);
    await this.repo.deleteConnector(tenantId, id);
    return { deleted: true };
  }

  /** Lightweight domain-level ping to verify connectivity. Only for PRESET (Marketplace) channels. */
  async testConnector(tenantId: string, id: string): Promise<{ reachable: boolean; latencyMs: number; error?: string }> {
    const channel = await this.repo.getChannel(tenantId, id);
    if (!channel || channel.integrationCategory !== 'PRESET') {
      return { reachable: false, latencyMs: 0, error: 'Connectivity tests only supported for PRESET channels' };
    }

    const url = channel.webhookUrl ?? '';
    if (!url.startsWith('http')) return { reachable: false, latencyMs: 0, error: 'Invalid webhook URL' };

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      return { reachable: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { reachable: false, latencyMs: Date.now() - start, error: err?.message ?? 'unreachable' };
    }
  }

  // ── RetailChannels ─────────────────────────────────────────

  async listChannels(tenantId: string): Promise<EcommerceChannel[]> {
    return this.repo.listChannels(tenantId);
  }

  async getChannel(tenantId: string, id: string): Promise<EcommerceChannel> {
    const channel = await this.repo.getChannel(tenantId, id);
    if (!channel) {
      throw new NotFoundException(`RetailChannel ${id} not found`);
    }
    return channel;
  }

  async createChannel(
    tenantId: string,
    dto: CreateRetailChannelDto,
  ): Promise<ChannelWithPlainCredentials> {
    if (!dto.name || !dto.type) {
      throw new BadRequestException('name and type are required');
    }

    // Determine category if not explicitly provided
    if (!dto.integrationCategory) {
      dto.integrationCategory = this.determineCategory(dto.type, dto.adapterType);
    }

    return this.repo.createChannel(tenantId, dto);
  }

  private determineCategory(type: string, adapterType?: string): 'HEADLESS' | 'PREMADE' | 'PRESET' {
    const t = type.toLowerCase();
    const a = adapterType?.toUpperCase();

    if (t === 'headless' || a === 'CUSTOM') return 'HEADLESS';
    if (t === 'marketplace' || a === 'SHOPEE' || a === 'TOKOPEDIA' || a === 'LAZADA' || a === 'TIKTOK') {
      return 'PRESET';
    }
    return 'PREMADE'; // Default for standard e-commerce integrations like WooCommerce/Shopify
  }

  async updateChannel(
    tenantId: string,
    id: string,
    dto: UpdateRetailChannelDto,
  ): Promise<EcommerceChannel> {
    await this.getChannel(tenantId, id);
    return this.repo.updateChannel(tenantId, id, dto);
  }

  async rotateChannelCredentials(
    tenantId: string,
    id: string,
  ): Promise<{ plainClientId: string; plainClientSecret: string }> {
    const channel = await this.getChannel(tenantId, id);
    const creds = channel.credentials as { revoked?: boolean } | null;
    if (creds?.revoked) {
      throw new ConflictException('Channel credentials are revoked — re-create the channel instead');
    }
    return this.repo.rotateChannelCredentials(tenantId, id);
  }

  async revokeChannelCredentials(tenantId: string, id: string): Promise<{ revoked: boolean }> {
    await this.getChannel(tenantId, id);
    await this.repo.revokeChannelCredentials(tenantId, id);
    return { revoked: true };
  }

  async deleteChannel(tenantId: string, id: string): Promise<{ deleted: boolean }> {
    await this.getChannel(tenantId, id);
    await this.repo.deleteChannel(tenantId, id);
    return { deleted: true };
  }
}
