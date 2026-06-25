import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { GeoFenceOverrideService } from '../services/geo-fence-override.service';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { UserRole } from '../../../shared/roles';
import { TenantContext } from '../../../gateway/tenant-context.interface';
import { TenantScopeResolver } from '../scope/tenant-scope.resolver';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID } from 'class-validator';

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

/**
 * DTO for geo-fence override approval request
 */
class ApproveOverrideDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Override reason must not exceed 500 characters' })
  override_reason: string;

  @IsUUID()
  @IsNotEmpty()
  hr_user_id: string;
}

/**
 * GeoFenceOverrideController
 * 
 * Controller for managing geo-fence override approvals.
 * Restricted to HR team members only.
 * 
 * Endpoints:
 * - POST /geo-fence/override/:attendanceId/approve - Approve override for attendance record
 * - GET /geo-fence/override/pending - Get pending override requests
 * - GET /geo-fence/override/history - Get override history
 * 
 * References:
 * - Requirements 23.10: Manual geo-fence override by HR team
 * - Requirements 23.11: Logging override reason and authorizing HR personnel
 * - Task 10.4: Implement geo-fence override mechanism
 */
@Controller('hr/geo-fence/override')
@UseGuards(RolesGuard)
export class GeoFenceOverrideController {
  constructor(
    private readonly overrideService: GeoFenceOverrideService,
    private readonly scopeResolver: TenantScopeResolver,
  ) {}

  /**
   * Approve a geo-fence override for an attendance record.
   * 
   * This endpoint allows HR team members to manually approve clock-in/out
   * actions that were rejected due to geo-fence validation failures.
   * 
   * @param request - Request with tenant context
   * @param attendanceId - The attendance record ID to approve
   * @param body - Override approval details (reason, HR user ID)
   * @returns Approved attendance record with override details
   * 
   * @example
   * POST /hr/geo-fence/override/att-123/approve
   * {
   *   "override_reason": "Employee on approved business travel",
   *   "hr_user_id": "hr-user-uuid"
   * }
   * 
   * Requirements validated:
   * - Requirement 23.10: HR team manual override capability
   * - Requirement 23.11: Override reason and authorizing HR personnel logged
   */
  @Post(':attendanceId/approve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER) // Only HR team (admin/manager roles)
  @HttpCode(HttpStatus.OK)
  async approveOverride(
    @Req() request: RequestWithTenant,
    @Param('attendanceId') attendanceId: string,
    @Body() body: ApproveOverrideDto,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    
    // Extract IP and user agent for audit trail
    const ipAddress = request.ip || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return this.overrideService.approveOverride(
      scope.tenant_id,
      attendanceId,
      body.hr_user_id,
      body.override_reason,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Get pending geo-fence override requests.
   * 
   * This endpoint returns a list of attendance records that failed geo-fence
   * validation and are awaiting HR approval.
   * 
   * @param request - Request with tenant context
   * @param employee_id - Optional filter by employee ID
   * @param start_date - Optional filter by start date (YYYY-MM-DD)
   * @param end_date - Optional filter by end date (YYYY-MM-DD)
   * @param limit - Optional pagination limit (default 50)
   * @param offset - Optional pagination offset (default 0)
   * @returns List of pending override requests
   * 
   * @example
   * GET /hr/geo-fence/override/pending?start_date=2024-01-01&limit=20
   */
  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getPendingOverrides(
    @Req() request: RequestWithTenant,
    @Query('employee_id') employee_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);

    return this.overrideService.getPendingOverrides(scope.tenant_id, {
      employee_id,
      start_date,
      end_date,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * Get geo-fence override history.
   * 
   * This endpoint returns audit log entries for geo-fence overrides,
   * useful for compliance review and pattern analysis.
   * 
   * @param request - Request with tenant context
   * @param employee_id - Optional filter by employee ID
   * @param attendance_id - Optional filter by attendance record ID
   * @returns List of override audit log entries
   * 
   * @example
   * GET /hr/geo-fence/override/history?employee_id=emp-123
   */
  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getOverrideHistory(
    @Req() request: RequestWithTenant,
    @Query('employee_id') employee_id?: string,
    @Query('attendance_id') attendance_id?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);

    return this.overrideService.getOverrideHistory(
      scope.tenant_id,
      employee_id,
      attendance_id,
    );
  }
}
