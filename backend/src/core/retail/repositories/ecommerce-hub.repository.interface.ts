import {
  EcommerceConnector,
  ConnectorWithPlainKey,
  EcommerceChannel,
  ChannelWithPlainCredentials,
} from '../entities/ecommerce-hub.entity';
import { CreateEcommerceConnectorDto, UpdateEcommerceConnectorDto } from '../dto/ecommerce-hub.dto';
import { CreateRetailChannelDto, UpdateRetailChannelDto } from '../dto/ecommerce-hub.dto';

export abstract class IEcommerceHubRepository {
  // ── EcommerceConnector (API-key auth) ───────────────────────
  abstract listConnectors(tenantId: string): Promise<EcommerceConnector[]>;
  abstract getConnector(tenantId: string, id: string): Promise<EcommerceConnector | null>;
  abstract createConnector(
    tenantId: string,
    data: CreateEcommerceConnectorDto,
  ): Promise<ConnectorWithPlainKey>;
  abstract updateConnector(
    tenantId: string,
    id: string,
    data: UpdateEcommerceConnectorDto,
  ): Promise<EcommerceConnector>;
  abstract rotateConnectorApiKey(
    tenantId: string,
    id: string,
  ): Promise<{ plainApiKey: string }>;
  abstract deleteConnector(tenantId: string, id: string): Promise<void>;

  // ── RetailChannel (clientId/secret auth) ────────────────────
  abstract listChannels(tenantId: string): Promise<EcommerceChannel[]>;
  abstract getChannel(tenantId: string, id: string): Promise<EcommerceChannel | null>;
  abstract createChannel(
    tenantId: string,
    data: CreateRetailChannelDto,
  ): Promise<ChannelWithPlainCredentials>;
  abstract updateChannel(
    tenantId: string,
    id: string,
    data: UpdateRetailChannelDto,
  ): Promise<EcommerceChannel>;
  abstract rotateChannelCredentials(
    tenantId: string,
    id: string,
  ): Promise<{ plainClientId: string; plainClientSecret: string }>;
  abstract revokeChannelCredentials(tenantId: string, id: string): Promise<void>;
  abstract deleteChannel(tenantId: string, id: string): Promise<void>;
}
