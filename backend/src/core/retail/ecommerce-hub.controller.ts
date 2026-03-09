import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Request } from "express";
import { EcommerceHubService } from "./ecommerce-hub.service";
import {
  CreateEcommerceConnectorDto,
  UpdateEcommerceConnectorDto,
  CreateRetailChannelDto,
  UpdateRetailChannelDto,
} from "./dto/ecommerce-hub.dto";
import { TenantInterceptor } from "../../gateway/tenant.interceptor";
import { TenantContext } from "../../gateway/tenant-context.interface";

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller("retail/ecommerce-hub")
@UseInterceptors(TenantInterceptor)
export class EcommerceHubController {
  constructor(private readonly hubService: EcommerceHubService) {}

  private ok<T>(tenantId: string, data: T) {
    return { success: true, tenantId, data };
  }

  // ════════════════════════════════════════════════
  // EcommerceConnector endpoints (API-key based)
  // ════════════════════════════════════════════════

  @Get("connectors")
  async listConnectors(@Req() req: RequestWithTenant) {
    const { tenantId } = req.tenantContext;
    const data = await this.hubService.listConnectors(tenantId);
    return this.ok(tenantId, data);
  }

  @Post("connectors")
  async createConnector(
    @Req() req: RequestWithTenant,
    @Body() dto: CreateEcommerceConnectorDto,
  ) {
    const { tenantId, userId } = req.tenantContext;
    const result = await this.hubService.createConnector(tenantId, dto, userId);
    return this.ok(tenantId, {
      connector: result.connector,
      plainApiKey: result.plainApiKey,
      warning: "Store the plainApiKey securely — it will NOT be shown again.",
    });
  }

  @Get("connectors/:id")
  async getConnector(@Req() req: RequestWithTenant, @Param("id") id: string) {
    const { tenantId } = req.tenantContext;
    const data = await this.hubService.getConnector(tenantId, id);
    return this.ok(tenantId, data);
  }

  @Put("connectors/:id")
  async updateConnector(
    @Req() req: RequestWithTenant,
    @Param("id") id: string,
    @Body() dto: UpdateEcommerceConnectorDto,
  ) {
    const { tenantId, userId } = req.tenantContext;
    const data = await this.hubService.updateConnector(
      tenantId,
      id,
      dto,
      userId,
    );
    return this.ok(tenantId, data);
  }

  @Delete("connectors/:id")
  async deleteConnector(
    @Req() req: RequestWithTenant,
    @Param("id") id: string,
  ) {
    const { tenantId, userId } = req.tenantContext;
    const data = await this.hubService.deleteConnector(tenantId, id, userId);
    return this.ok(tenantId, data);
  }

  @Post("connectors/:id/rotate-key")
  @HttpCode(HttpStatus.OK)
  async rotateConnectorKey(
    @Req() req: RequestWithTenant,
    @Param("id") id: string,
  ) {
    const { tenantId, userId } = req.tenantContext;
    const result = await this.hubService.rotateConnectorApiKey(
      tenantId,
      id,
      userId,
    );
    return this.ok(tenantId, {
      ...result,
      warning:
        "Store the new plainApiKey securely — it will NOT be shown again.",
    });
  }

  @Post("connectors/:id/test")
  @HttpCode(HttpStatus.OK)
  async testConnector(@Req() req: RequestWithTenant, @Param("id") id: string) {
    const { tenantId } = req.tenantContext;
    const result = await this.hubService.testConnector(tenantId, id);
    return this.ok(tenantId, result);
  }

  // ════════════════════════════════════════════════
  // RetailChannel endpoints (clientId/secret based)
  // ════════════════════════════════════════════════

  @Get("channels")
  async listChannels(@Req() req: RequestWithTenant) {
    const { tenantId } = req.tenantContext;
    const data = await this.hubService.listChannels(tenantId);
    // Strip clientSecretHash from response
    return this.ok(tenantId, data.map(safeChannel));
  }

  @Post("channels")
  async createChannel(
    @Req() req: RequestWithTenant,
    @Body() dto: CreateRetailChannelDto,
  ) {
    const { tenantId, userId } = req.tenantContext;
    const result = await this.hubService.createChannel(tenantId, dto, userId);
    return this.ok(tenantId, {
      channel: safeChannel(result.channel),
      plainClientId: result.plainClientId,
      plainClientSecret: result.plainClientSecret,
      warning:
        "Store clientId and clientSecret securely — they will NOT be shown again.",
    });
  }

  @Get("channels/:id")
  async getChannel(@Req() req: RequestWithTenant, @Param("id") id: string) {
    const { tenantId } = req.tenantContext;
    const data = await this.hubService.getChannel(tenantId, id);
    return this.ok(tenantId, safeChannel(data));
  }

  @Put("channels/:id")
  async updateChannel(
    @Req() req: RequestWithTenant,
    @Param("id") id: string,
    @Body() dto: UpdateRetailChannelDto,
  ) {
    const { tenantId, userId } = req.tenantContext;
    const data = await this.hubService.updateChannel(tenantId, id, dto, userId);
    return this.ok(tenantId, safeChannel(data));
  }

  @Delete("channels/:id")
  async deleteChannel(@Req() req: RequestWithTenant, @Param("id") id: string) {
    const { tenantId, userId } = req.tenantContext;
    const data = await this.hubService.deleteChannel(tenantId, id, userId);
    return this.ok(tenantId, data);
  }

  @Post("channels/:id/rotate-credentials")
  @HttpCode(HttpStatus.OK)
  async rotateChannelCredentials(
    @Req() req: RequestWithTenant,
    @Param("id") id: string,
  ) {
    const { tenantId, userId } = req.tenantContext;
    const result = await this.hubService.rotateChannelCredentials(
      tenantId,
      id,
      userId,
    );
    return this.ok(tenantId, {
      ...result,
      warning:
        "Store clientId and clientSecret securely — they will NOT be shown again.",
    });
  }

  @Post("channels/:id/revoke-credentials")
  @HttpCode(HttpStatus.OK)
  async revokeChannelCredentials(
    @Req() req: RequestWithTenant,
    @Param("id") id: string,
  ) {
    const { tenantId, userId } = req.tenantContext;
    const data = await this.hubService.revokeChannelCredentials(
      tenantId,
      id,
      userId,
    );
    return this.ok(tenantId, data);
  }
}

/** Strip the raw clientSecretHash from credential JSON before sending to client. */
function safeChannel(channel: any) {
  const { credentials, ...rest } = channel;
  const safeCreds = credentials
    ? (() => {
        const { clientSecretHash: _stripped, ...safeRest } = credentials as any;
        return safeRest;
      })()
    : null;
  return { ...rest, credentials: safeCreds };
}
