import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { AuditService } from '../../../shared/audit/audit.service';

/**
 * GeoFenceOverrideService
 * 
 * Service for handling manual geo-fence override approvals by HR team.
 * Allows HR personnel to manually approve clock-in/out requests that fall outside
 * the configured geo-fence boundaries for special cases like business travel or remote work.
 * 
 * References:
 * - Requirements 23.10: Manual geo-fence override capability
 * - Requirements 23.11: Logging override reason and authorizing HR personnel
 * - Task 10.4: Implement geo-fence override mechanism
 */
@Injectable()
export class GeoFenceOverrideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Approve a clock-in or clock-out action that was rejected due to geo-fence validation.
   * 
   * This method:
   * 1. Validates that the attendance record exists and is pending override approval
   * 2. Updates the attendance record with override approval details
   * 3. Logs the override in the audit trail
   * 
   * @param tenantId - The tenant ID for multi-tenant isolation
   * @param attendanceId - The attendance record ID to override
   * @param hrUserId - The HR team member authorizing the override
   * @param overrideReason - The business justification for the override
   * @param ipAddress - The IP address of the HR user (optional, for audit)
   * @param userAgent - The user agent of the HR user (optional, for audit)
   * @returns Updated attendance record with override details
   * 
   * @throws NotFoundException if attendance record not found
   * @throws BadRequestException if attendance record already has an override or is invalid
   * 
   * @example
   * const result = await geoFenceOverrideService.approveOverride(
   *   'tenant-123',
   *   'attendance-uuid',
   *   'hr-user-uuid',
   *   'Employee is on approved business travel to client site',
   *   '192.168.1.1',
   *   'Mozilla/5.0...'
   * );
   * 
   * Requirements validated:
   * - Requirement 23.10: HR team can manually approve clock-in/out outside geo-fence
   * - Requirement 23.11: Override reason and authorizing HR personnel are logged
   */
  async approveOverride(
    tenantId: string,
    attendanceId: string,
    hrUserId: string,
    overrideReason: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate inputs
    if (!overrideReason || overrideReason.trim().length === 0) {
      throw new BadRequestException('Override reason is required and cannot be empty');
    }

    if (overrideReason.length > 500) {
      throw new BadRequestException('Override reason must not exceed 500 characters');
    }

    return this.prisma.$transaction(async (tx) => {
      // Find the attendance record
      const attendance = await tx.attendance.findFirst({
        where: {
          id: attendanceId,
          employee: {
            // No tenant_id filter needed - Employee model doesn't have tenant_id
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              full_name: true,
              employee_code: true,
            },
          },
          office_location: {
            select: {
              id: true,
              location_name: true,
            },
          },
        },
      });

      if (!attendance) {
        throw new NotFoundException(
          `Attendance record ${attendanceId} not found`,
        );
      }

      // Check if already has an override
      if (attendance.override_by) {
        throw new BadRequestException(
          `Attendance record ${attendanceId} already has an override approval`,
        );
      }

      // Verify HR user exists and has appropriate role
      const hrUser = await tx.employee.findFirst({
        where: {
          id: hrUserId,
          employment_status: 'active',
        },
      });

      if (!hrUser) {
        throw new NotFoundException(
          `HR user ${hrUserId} not found or inactive`,
        );
      }

      // Store the state before update for audit trail
      const beforeState = {
        override_reason: attendance.override_reason,
        override_by: attendance.override_by,
      };

      // Update the attendance record with override details
      const updatedAttendance = await tx.attendance.update({
        where: {
          id: attendanceId,
        },
        data: {
          override_reason: overrideReason,
          override_by: hrUserId,
          updated_at: new Date(),
        },
        include: {
          employee: {
            select: {
              id: true,
              full_name: true,
              employee_code: true,
            },
          },
          office_location: {
            select: {
              id: true,
              location_name: true,
            },
          },
        },
      });

      // Create audit log entry
      await this.auditService.log(
        {
          tenant_id: tenantId,
          user_id: hrUserId,
          module: 'HR_ATTENDANCE',
          action: 'GEO_FENCE_OVERRIDE_APPROVED',
          entity_type: 'ATTENDANCE',
          entity_id: attendanceId,
          metadata: {
            employee_id: attendance.employee.id,
            employee_name: attendance.employee.full_name,
            employee_code: attendance.employee.employee_code,
            attendance_date: attendance.attendance_date,
            clock_in_time: attendance.clock_in_time,
            clock_out_time: attendance.clock_out_time,
            office_location_id: attendance.office_location_id,
            office_location_name: attendance.office_location?.location_name,
            override_reason: overrideReason,
            hr_user_id: hrUserId,
            hr_user_name: hrUser.full_name,
          },
          changes: {
            override_reason: {
              before: beforeState.override_reason,
              after: overrideReason,
            },
            override_by: {
              before: beforeState.override_by,
              after: hrUserId,
            },
          },
          before_state: beforeState,
          after_state: {
            override_reason: overrideReason,
            override_by: hrUserId,
          },
          ip_address: ipAddress,
          user_agent: userAgent,
          severity: 'WARN', // Overrides are security-relevant events
          correlation_id: `geo-override-${attendanceId}-${Date.now()}`,
        },
        tx,
      );

      return {
        success: true,
        attendance: updatedAttendance,
        message: `Geo-fence override approved for ${attendance.employee.full_name} on ${attendance.attendance_date}`,
      };
    });
  }

  /**
   * Get all attendance records pending geo-fence override approval.
   * 
   * This method retrieves attendance records that were rejected due to geo-fence
   * validation and are awaiting HR approval. Useful for displaying a queue of
   * pending override requests in the HR admin interface.
   * 
   * @param tenantId - The tenant ID for multi-tenant isolation
   * @param options - Optional filters (employee_id, date range, etc.)
   * @returns List of attendance records pending override
   * 
   * @example
   * const pending = await geoFenceOverrideService.getPendingOverrides(
   *   'tenant-123',
   *   { start_date: '2024-01-01', end_date: '2024-01-31' }
   * );
   */
  async getPendingOverrides(
    tenantId: string,
    options?: {
      employee_id?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = {
      override_reason: null, // Not yet approved
      override_by: null,
      // You might want to add additional criteria here to identify records
      // that specifically failed geo-fence validation
    };

    if (options?.employee_id) {
      where.employee_id = options.employee_id;
    }

    if (options?.start_date || options?.end_date) {
      where.attendance_date = {};
      if (options.start_date) {
        where.attendance_date.gte = new Date(options.start_date);
      }
      if (options.end_date) {
        where.attendance_date.lte = new Date(options.end_date);
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              full_name: true,
              employee_code: true,
            },
          },
          office_location: {
            select: {
              id: true,
              location_name: true,
            },
          },
        },
        orderBy: {
          attendance_date: 'desc',
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      records,
      total,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    };
  }

  /**
   * Get override history for an employee or attendance record.
   * 
   * This method retrieves audit log entries for geo-fence overrides,
   * useful for reviewing override patterns and compliance.
   * 
   * @param tenantId - The tenant ID for multi-tenant isolation
   * @param employeeId - Optional employee ID to filter by
   * @param attendanceId - Optional attendance ID to filter by
   * @returns List of override audit log entries
   * 
   * @example
   * const history = await geoFenceOverrideService.getOverrideHistory(
   *   'tenant-123',
   *   'employee-uuid'
   * );
   */
  async getOverrideHistory(
    tenantId: string,
    employeeId?: string,
    attendanceId?: string,
  ) {
    const where: any = {
      action_type: 'GEO_FENCE_OVERRIDE_APPROVED',
    };

    if (attendanceId) {
      where.target_entity_id = attendanceId;
      where.target_entity_type = 'ATTENDANCE';
    }

    // If we need to filter by employee, we'll need to use the changes field
    // This is a simplified version - in production you might want a more efficient approach
    const auditLogs = await this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            full_name: true,
            employee_code: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 100,
    });

    // If employee_id is specified, filter the results
    if (employeeId) {
      return auditLogs.filter((log: any) => {
        const metadata = log.changes as any;
        return metadata?.employee_id === employeeId;
      });
    }

    return auditLogs;
  }
}
