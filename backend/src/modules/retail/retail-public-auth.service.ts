import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../persistence/prisma.service";
import { createHash, randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";
import { TenantContext } from "../../gateway/tenant-context.interface";
import { MultiTenancyUtil } from "../../shared/utils/multi-tenancy.util";

export interface CustomerAuthPayload {
  sub: string;
  tenant_id: string;
  connector_id: string;
  branch_id: string;
  scope: string;
}

export interface ConnectorScope {
  channel_id: string;
  branch_id: string;
}

@Injectable()
export class RetailPublicAuthService {
  private readonly jwtSecret: string;
  private readonly accessTokenTtl: string = "1h";
  private readonly refreshTokenTtlDays: number = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>("JWT_SECRET") || "retail-secret";
  }

  async registerCustomer(
    ctx: TenantContext,
    payload: { name: string; email: string; phone?: string; password?: string },
    meta: { ip?: string | null; user_agent?: string | null },
  ): Promise<{ customer: any; tokens: any }> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (!payload.password) {
      throw new BadRequestException("Password is required");
    }

    const password_hash = createHash("sha256")
      .update(payload.password)
      .digest("hex");

    const existing = await this.prisma.retail_customers.findFirst({
      where: { ...MultiTenancyUtil.getScope(ctx), email: normalizedEmail },
    });
    if (existing) {
      throw new ForbiddenException("Email already registered");
    }

    const customer = await this.prisma.retail_customers.create({
      data: {
        id: uuidv4(),
        updated_at: new Date(),
        ...MultiTenancyUtil.getScope(ctx),
        name: payload.name.trim(),
        email: normalizedEmail,
        phone: payload.phone?.trim() || null,
        status: "active",
      },
    });

    await this.prisma.retail_customer_auth.create({
      data: {
        id: uuidv4(),
        updated_at: new Date(),
        customer_id: customer.id,
        password_hash: password_hash,
        password_updated_at: new Date(),
      },
    });

    const tokens = await this.issueTokens(
      { id: customer.id, tenantContext: ctx },
      { channel_id: 'default', branch_id: 'default' }, // Internal placeholder or derive from context
      meta,
    );

    return { customer, tokens };
  }

  async loginCustomer(
    ctx: TenantContext,
    scope: ConnectorScope,
    payload: { email: string; password?: string },
    meta: { ip?: string | null; user_agent?: string | null },
  ): Promise<{ customer: any; tokens: any }> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const customer = await this.prisma.retail_customers.findFirst({
      where: { ...MultiTenancyUtil.getScope(ctx), email: normalizedEmail },
    });
    if (!customer) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const auth = await this.prisma.retail_customer_auth.findFirst({
      where: { customer_id: customer.id },
    });

    if (!auth || !payload.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const inputHash = createHash("sha256")
      .update(payload.password)
      .digest("hex");

    if (inputHash !== auth.password_hash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.issueTokens(
      { id: customer.id, tenantContext: ctx },
      scope,
      meta,
    );

    return {
      customer: { id: customer.id, name: customer.name, email: customer.email },
      tokens: tokens,
    };
  }

  async refreshTokens(
    ctx: TenantContext,
    scope: ConnectorScope,
    refreshToken: string,
    meta: { ip?: string | null; user_agent?: string | null },
  ): Promise<{ customer: any; tokens: any }> {
    const refreshHash = this.hashToken(refreshToken);
    const session = await this.prisma.retail_customer_sessions.findFirst({
      where: {
        token_hash: refreshHash,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    });
    if (!session) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const customer = await this.prisma.retail_customers.findFirst({
      where: { id: session.customer_id, ...MultiTenancyUtil.getScope(ctx) },
    });
    if (!customer) {
      throw new UnauthorizedException("Invalid session");
    }

    await this.prisma.retail_customer_sessions.update({
      where: { id: session.id },
      data: { revoked_at: new Date() },
    });

    const tokens = await this.issueTokens(
      { id: customer.id, tenantContext: ctx },
      scope,
      meta,
    );

    return { customer, tokens };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { revoked: false };
    }
    await this.revokeRefreshToken(refreshToken);
    return { revoked: true };
  }

  verifyAccessToken(token: string): CustomerAuthPayload {
    return (jwt.verify as any)(token, this.jwtSecret) as CustomerAuthPayload;
  }

  async getCustomerFromToken(payload: CustomerAuthPayload) {
    const customer = await this.prisma.retail_customers.findFirst({
      where: { id: payload.sub, tenant_id: payload.tenant_id },
    });
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    return customer;
  }

  private async issueTokens(
    customer: { id: string; tenantContext: TenantContext },
    scope: ConnectorScope,
    meta: { ip?: string | null; user_agent?: string | null },
  ) {
    const accessToken = (jwt.sign as any)(
      {
        sub: customer.id,
        tenant_id: customer.tenantContext.tenant_id,
        connector_id: scope.channel_id,
        branch_id: scope.branch_id,
        scope: "retail.public",
      },
      this.jwtSecret,
      { expiresIn: this.accessTokenTtl },
    );

    const refreshToken = randomBytes(48).toString("hex");
    const refreshHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenTtlDays);

    await this.prisma.retail_customer_sessions.create({
      data: {
        id: 'al4zz5uh',
        updated_at: new Date(),
        customer_id: customer.id,
        ...MultiTenancyUtil.getScope(customer.tenantContext),
        token_hash: refreshHash,
        expires_at: expiresAt,
        ip_address: meta.ip ?? null,
        user_agent: meta.user_agent ?? null,
      },
    });

    return {
      accessToken,
      refreshToken,
      expires_at: expiresAt.toISOString(),
    };
  }

  private async revokeRefreshToken(refreshToken: string) {
    const refreshHash = this.hashToken(refreshToken);
    await this.prisma.retail_customer_sessions.updateMany({
      where: { token_hash: refreshHash, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  async validateEcommerceConnector(
    ctx: TenantContext,
    clientId: string,
    clientSecret: string,
  ): Promise<ConnectorScope> {
    const apiHash = createHash("sha256").update(clientSecret).digest("hex");
    const connector = await this.prisma.ecommerce_connectors.findFirst({
      where: {
        ...MultiTenancyUtil.getScope(ctx),
        domain: clientId,
        api_key: apiHash,
        deleted_at: null,
      },
      include: { stores: { select: { id: true } } },
    });

    if (!connector) {
      throw new UnauthorizedException("Invalid channel credentials");
    }

    return {
      channel_id: connector.id,
      branch_id: connector.stores[0]?.id || "default",
    };
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}

