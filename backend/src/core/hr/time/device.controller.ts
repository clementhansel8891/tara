import {
  Controller,
  Post,
  Body,
  Req,
  Logger,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { TimeAndAttendanceService } from './time.service';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { TenantGuard } from '../../../shared/guards/tenant.guard';
import { UserRole } from '../../../shared/roles';
import { TenantInterceptor } from '../../../gateway/tenant.interceptor';
import { TenantContext } from '../../../gateway/tenant-context.interface';
import { ModuleStateGuard } from '../../auth/guards/module-state.guard';
import { TenantScopeResolver } from '../scope/tenant-scope.resolver';

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller('hr/time/device')
@UseInterceptors(TenantInterceptor)
@UseGuards(ModuleStateGuard, TenantGuard, RolesGuard)
export class AttendanceDeviceController {
  private readonly logger = new Logger(AttendanceDeviceController.name);

  constructor(
    private readonly timeService: TimeAndAttendanceService,
    private readonly scopeResolver: TenantScopeResolver,
  ) {}

  /**
   * Biometric Ingest Endpoint
   * Used by external hardware/IOT devices to push attendance logs.
   *
   * Tenant identity is sourced from the verified `request.tenantContext`
   * (populated by `TenantInterceptor` after the JWT-bearing tenant middleware)
   * rather than the raw `x-tenant-id` header (Requirements 2.1, 2.2, 2.3).
   * The mutating ingest endpoint declares a `@Roles(...)` gate; privileged
   * roles (OWNER/SUPERADMIN) bypass it, preserving access for the standard
   * tenant roles a device service account authenticates as (Requirement 3.4).
   */
  @Post('ingest')
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async ingest(
    @Req() request: RequestWithTenant,
    @Body() payload: {
      employee_code: string;
      device_id: string;
      timestamp: string;
      action?: 'IN' | 'OUT';
      metadata?: any;
    },
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    this.logger.log(`Raw device log received for employee ${payload.employee_code}`);
    try {
      const result = await this.timeService.biometricIngest(scope.tenant_id, payload);
      return {
        success: true,
        message: 'Log ingested successfully',
        record_id: result.id,
        status: result.status,
      };
    } catch (error) {
      this.logger.error(`Biometric ingest failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
