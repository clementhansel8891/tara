import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { IEcommerceHubRepository } from "./repositories/ecommerce-hub.repository.interface";
import {
  EcommerceConnector,
  ConnectorWithPlainKey,
  EcommerceChannel,
  ChannelWithPlainCredentials,
} from "./entities/ecommerce-hub.entity";
import {
  CreateEcommerceConnectorDto,
  UpdateEcommerceConnectorDto,
  CreateRetailChannelDto,
  UpdateRetailChannelDto,
} from "./dto/ecommerce-hub.dto";

import { AuditService } from "../../shared/audit/audit.service";

@Injectable()
export class EcommerceHubService {
  constructor(
    private readonly repo: IEcommerceHubRepository,
    private readonly audit: AuditService,
  ) {}

  // ── EcommerceConnectors ────────────────────────────────────

  async listConnectors(tenantId: string): Promise<EcommerceConnector[]> {
    return this.repo.listConnectors(tenantId);
  }

  async getConnector(
    tenantId: string,
    id: string,
  ): Promise<EcommerceConnector> {
    const connector = await this.repo.getConnector(tenantId, id);
    if (!connector) {
      throw new NotFoundException(`EcommerceConnector ${id} not found`);
    }
    return connector;
  }

  async createConnector(
    tenantId: string,
    dto: CreateEcommerceConnectorDto,
    userId: string = "system",
  ): Promise<ConnectorWithPlainKey> {
    if (!dto.name || !dto.platform || !dto.domain) {
      throw new BadRequestException("name, platform, and domain are required");
    }
    const result = await this.repo.createConnector(tenantId, dto);

    await this.audit.log({
      tenantId,
      userId,
      module: "retail",
      action: "CREATE_CONNECTOR",
      entityType: "EcommerceConnector",
      entityId: result.connector.id,
      metadata: { platform: dto.platform, domain: dto.domain },
    });

    return result;
  }

  async updateConnector(
    tenantId: string,
    id: string,
    dto: UpdateEcommerceConnectorDto,
    userId: string = "system",
  ): Promise<EcommerceConnector> {
    await this.getConnector(tenantId, id); // ensure exists
    const result = await this.repo.updateConnector(tenantId, id, dto);

    await this.audit.log({
      tenantId,
      userId,
      module: "retail",
      action: "UPDATE_CONNECTOR",
      entityType: "EcommerceConnector",
      entityId: id,
      metadata: { updates: dto },
    });

    return result;
  }

  async rotateConnectorApiKey(
    tenantId: string,
    id: string,
    userId: string = "system",
  ): Promise<{ plainApiKey: string }> {
    await this.getConnector(tenantId, id);
    const result = await this.repo.rotateConnectorApiKey(tenantId, id);

    await this.audit.log({
      tenantId,
      userId,
      module: "retail",
      action: "ROTATE_CONNECTOR_KEY",
      entityType: "EcommerceConnector",
      entityId: id,
    });

    return result;
  }

  async deleteConnector(
    tenantId: string,
    id: string,
    userId: string = "system",
  ): Promise<{ deleted: boolean }> {
    await this.getConnector(tenantId, id);
    await this.repo.deleteConnector(tenantId, id);

    await this.audit.log({
      tenantId,
      userId,
      module: "retail",
      action: "DELETE_CONNECTOR",
      entityType: "EcommerceConnector",
      entityId: id,
    });

    return { deleted: true };
  }

  /** Lightweight domain-level ping to verify connectivity. Only for PRESET (Marketplace) channels. */
  async testConnector(
    tenantId: string,
    id: string,
  ): Promise<{ reachable: boolean; latencyMs: number; error?: string }> {
    const channel = await this.repo.getChannel(tenantId, id);
    if (!channel || channel.integrationCategory !== "PRESET") {
      return {
        reachable: false,
        latencyMs: 0,
        error: "Connectivity tests only supported for PRESET channels",
      };
    }

    const url = channel.webhookUrl ?? "";
    if (!url.startsWith("http"))
      return { reachable: false, latencyMs: 0, error: "Invalid webhook URL" };

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch(url, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeout);
      return { reachable: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return {
        reachable: false,
        latencyMs: Date.now() - start,
        error: err?.message ?? "unreachable",
      };
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
    userId: string = "system",
  ): Promise<ChannelWithPlainCredentials> {
    if (!dto.name || !dto.type) {
      throw new BadRequestException("name and type are required");
    }

    // Determine category if not explicitly provided
    if (!dto.integrationCategory) {
      dto.integrationCategory = this.determineCategory(
        dto.type,
        dto.adapterType,
      );
    }

    const result = await this.repo.createChannel(tenantId, dto);

    await this.audit.log({
      tenantId,
      userId,
      module: "retail",
      action: "CREATE_CHANNEL",
      entityType: "RetailChannel",
      entityId: result.channel.id,
      metadata: { type: dto.type, category: dto.integrationCategory },
    });

    return result;
  }

  private determineCategory(
    type: string,
    adapterType?: string,
  ): "HEADLESS" | "PREMADE" | "PRESET" {
    const t = type.toLowerCase();
    const a = adapterType?.toUpperCase();

    if (t === "headless" || a === "CUSTOM") return "HEADLESS";
    if (
      t === "marketplace" ||
      a === "SHOPEE" ||
      a === "TOKOPEDIA" ||
      a === "LAZADA" ||
      a === "TIKTOK"
    ) {
      return "PRESET";
    }
    return "PREMADE"; // Default for standard e-commerce integrations like WooCommerce/Shopify
  }

  async updateChannel(
    tenantId: string,
    id: string,
    dto: UpdateRetailChannelDto,
    userId: string = "system",
  ): Promise<EcommerceChannel> {
    await this.getChannel(tenantId, id);
    const result = await this.repo.updateChannel(tenantId, id, dto);

    await this.audit.log({
      tenantId,
      userId,
      module: "retail",
      action: "UPDATE_CHANNEL",
      entityType: "RetailChannel",
      entityId: id,
      metadata: { updates: dto },
    });

    return result;
  }

  async rotateChannelCredentials(
    tenantId: string,
    id: string,
    userId: string = "system",
  ): Promise<{ plainClientId: string; plainClientSecret: string }> {
    const channel = await this.getChannel(tenantId, id);
    const creds = channel.credentials as { revoked?: boolean } | null;
    if (creds?.revoked) {
      throw new ConflictException(
        "Channel credentials are revoked — re-create the channel instead",
      );
    }
    const result = await this.repo.rotateChannelCredentials(tenantId, id);

    await this.audit.log({
      tenantId,
      userId,
      module: "retail",
      action: "ROTATE_CHANNEL_CREDENTIALS",
      entityType: "RetailChannel",
      entityId: id,
    });

    return result;
  }

  async revokeChannelCredentials(
    tenantId: string,
    id: string,
    userId: string = "system",
  ): Promise<{ revoked: boolean }> {
    await this.getChannel(tenantId, id);
    await this.repo.revokeChannelCredentials(tenantId, id);

    await this.audit.log({
      tenantId,
      userId,
      module: "retail",
      action: "REVOKE_CHANNEL_CREDENTIALS",
      entityType: "RetailChannel",
      entityId: id,
    });

    return { revoked: true };
  }

  async deleteChannel(
    tenantId: string,
    id: string,
    userId: string = "system",
  ): Promise<{ deleted: boolean }> {
    await this.getChannel(tenantId, id);
    await this.repo.deleteChannel(tenantId, id);

    await this.audit.log({
      tenantId,
      userId,
      module: "retail",
      action: "DELETE_CHANNEL",
      entityType: "RetailChannel",
      entityId: id,
    });

    return { deleted: true };
  }
}
