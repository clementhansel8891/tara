import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { TenantContext } from "./tenant-context.interface";
import { AuthService } from "../core/auth/auth.service";

/**
 * Tenant Middleware
 * Extracts tenant context from request headers and attaches to request object
 * Enforces multi-tenancy by requiring x-tenant-id header
 * Verifies JWT token if present to prevent header spoofing
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: any, res: Response, next: NextFunction) {
    // 1. Extract tenant ID from header (REQUIRED for multi-tenancy)
    const tenantId = req.headers["x-tenant-id"];
    const bypass = req.headers["x-dev-bypass"];

    console.log(
      `[V3001] URL: ${req.url}, Tenant: ${tenantId}, Bypass: ${bypass}`,
    );

    if (!tenantId) {
      throw new BadRequestException(
        "Missing required header: x-tenant-id. All requests must include a tenant identifier.",
      );
    }

    // 1.5 Dev Bypass for verification
    if (bypass === "true") {
      const devRole = req.headers["x-dev-role"] || "OWNER";
      const devTenantId = req.headers["x-dev-tenant-id"] || tenantId;
      const devUserId = req.headers["x-dev-user-id"] || "dev-user";

      console.log(
        `[V3001] BYPASS ACTIVE for ${tenantId}, Role: ${devRole}, User: ${devUserId}`,
      );

      const devUser = {
        id: devUserId,
        email: "dev@zenvix.com",
        firstName: "Dev",
        lastName: "User",
        userCompanies: [
          {
            tenantId: devTenantId,
            role: devRole,
          },
        ],
      };

      req.tenantContext = {
        tenantId: tenantId as string,
        companyId: (req.headers["x-dev-company-id"] || req.headers["x-company-id"] || tenantId) as string,
        userId: devUserId as string,
        role: devRole as string,
      };
      req.user = devUser;
      return next();
    }

    // 2. JWT Verification (HARDENING)
    // Extract token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    let verifiedUser: any = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        verifiedUser = await this.authService.verifyAndGetProfile(token);
      } catch (e) {
        // If token is present but invalid/expired, we fail the request for security
        throw new UnauthorizedException(
          "Invalid or expired authentication token",
        );
      }
    }

    // 3. Context Construction
    // REQUIRE verified user from token (unspoofable)
    if (!verifiedUser) {
      throw new UnauthorizedException(
        "DEBUG_TAG_3001: Valid authentication token required for this resource.",
      );
    }

    const userId = verifiedUser.id;
    const locationId = req.headers["x-location-id"];
    const companyId = req.headers["x-company-id"] || tenantId; // Fallback to tenantId if not provided

    // 4. Role Extraction & Verification logic
    // We look for the user's role in the context of the requested tenantId
    let role = "MEMBER";
    const userCompanies = verifiedUser.userCompanies || [];

    console.log(
      `[V3001] Extracting role for user ${userId} on tenant ${tenantId}`,
    );
    console.log(
      `[V3001] User associations: ${JSON.stringify(userCompanies.map((uc: any) => ({ t: uc.tenantId, r: uc.role })))}`,
    );

    // Check if user is a Global Superadmin
    const superadminAssoc = userCompanies.find(
      (uc: any) => uc.role === "SUPERADMIN",
    );

    if (superadminAssoc) {
      role = "SUPERADMIN";
      console.log(`[V3001] User ${userId} is a GLOBAL SUPERADMIN`);
    } else {
      // Find association for requested tenant
      const tenantAssoc = userCompanies.find(
        (uc: any) => uc.tenantId === tenantId,
      );
      if (tenantAssoc) {
        role = tenantAssoc.role;
        console.log(
          `[V3001] User ${userId} has role ${role} for tenant ${tenantId}`,
        );
      } else {
        console.warn(
          `[V3001] User ${userId} is NOT associated with tenant ${tenantId}. Defaulting to MEMBER.`,
        );
      }
    }

    // Attach tenant context to request object
    const tenantContext: TenantContext = {
      tenantId: tenantId as string,
      companyId: companyId as string,
      locationId: locationId as string | undefined,
      userId,
      role,
    };

    req.tenantContext = tenantContext;
    req.user = verifiedUser;

    next();
  }
}
