import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { Request } from 'express';
import { TaraJwtAuthGuard } from '../../auth/guards/tara-jwt-auth.guard';
import { TaraContextFilterInterceptor } from '../../auth/interceptors/tara-context-filter.interceptor';
import { TaraContextQueryService } from '../../auth/services/tara-context-query.service';
import { PrismaService } from '../../../persistence/prisma.service';
import { TaraAuthPayload } from '../../auth/tara-auth.service';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/i18n.service';

/**
 * TARA Employee Controller
 * 
 * Demonstrates context-based data filtering at API level.
 * 
 * Context Rules:
 * - Mobile Interface: Always filters by authenticated user ID (even for HR_Team)
 * - Web Interface with HR_Team role: Allows access to all employees (Administrative Context)
 * - Web Interface without HR_Team: Filters by authenticated user ID
 * 
 * Data filtering is enforced at the data access layer (Prisma queries), not just UI.
 * 
 * **Validates: Requirements 12.15, 12.16, 17.14, 28.30, 30.5**
 */
@Controller('api/tara/employees')
@UseGuards(TaraJwtAuthGuard)
@UseInterceptors(TaraContextFilterInterceptor)
export class TaraEmployeeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextQueryService: TaraContextQueryService,
  ) {}

  /**
   * Get employee list with context-based filtering
   * 
   * - Personal_Employee Context: Returns only authenticated user's data
   * - Administrative Context: Returns all employees in tenant
   * 
   * The filtering happens at Prisma query level using TaraContextQueryService
   */
  @Get()
  async getEmployees(
    @Req() req: Request & { user: TaraAuthPayload },
    @Query('department_id') department_id?: string,
    @Query('status') status?: string,
  ) {
    const user = req.user;

    // Build base WHERE clause from query parameters
    const baseWhere: any = {};
    if (department_id) {
      baseWhere.department_id = department_id;
    }
    if (status) {
      baseWhere.employment_status = status;
    }

    // Apply context-based filtering using TaraContextQueryService
    // This automatically adds employee_id filter for Personal_Employee context
    // and allows all employees for Administrative context
    const contextWhere = this.contextQueryService.buildContextWhere(
      user,
      baseWhere,
    );

    // Execute query with context filters
    const employees = await this.prisma.employee.findMany({
      where: contextWhere,
      select: {
        id: true,
        employee_code: true,
        full_name: true,
        email: true,
        phone: true,
        department_id: true,
        employment_status: true,
        hire_date: true,
        created_at: true,
        updated_at: true,
        // Exclude sensitive fields
        password_hash: false,
        biometric_token_hash: false,
      },
      orderBy: {
        full_name: 'asc',
      },
    });

    // Sanitize data based on context
    const sanitizedEmployees = employees.map((emp) =>
      this.contextQueryService.sanitizeEmployeeData(user, emp),
    );

    return {
      data: sanitizedEmployees,
      count: sanitizedEmployees.length,
      context: user.context,
      interface: user.interface,
    };
  }

  /**
   * Get single employee by ID with context validation
   * 
   * Validates that the requested employee ID matches context rules:
   * - Personal_Employee Context: Can only access own ID
   * - Administrative Context: Can access any employee ID
   */
  @Get(':id')
  async getEmployeeById(
    @Req() req: Request & { user: TaraAuthPayload },
    @Param('id') id: string,
  ) {
    const user = req.user;

    // Validate context access before querying
    // This throws ForbiddenException if trying to access another employee in Personal context
    this.contextQueryService.validateContextAccess(user, id);

    // Build context-aware WHERE clause
    const contextWhere = this.contextQueryService.buildContextWhere(user, {
      id,
    });

    // Execute query with context filters
    const employee = await this.prisma.employee.findFirst({
      where: contextWhere,
      select: {
        id: true,
        employee_code: true,
        full_name: true,
        email: true,
        phone: true,
        department_id: true,
        employment_status: true,
        hire_date: true,
        language_preference: true,
        biometric_device_id: true,
        created_at: true,
        updated_at: true,
        // Include relations
        department: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!employee) {
      throw new ForbiddenException(
        `Employee ${id} not found or access denied based on your context.`,
      );
    }

    // Sanitize data based on context
    return this.contextQueryService.sanitizeEmployeeData(user, employee);
  }

  /**
   * Get employee's attendance records with context filtering
   * 
   * Demonstrates context-based filtering on related data.
   * Mobile users (including HR_Team) can only see their own attendance.
   */
  @Get(':id/attendance')
  async getEmployeeAttendance(
    @Req() req: Request & { user: TaraAuthPayload },
    @Param('id') id: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    const user = req.user;

    // Validate context access
    this.contextQueryService.validateContextAccess(user, id);

    // Build context-aware WHERE clause for attendance
    const dateFilter: any = {};
    if (start_date) {
      dateFilter.gte = new Date(start_date);
    }
    if (end_date) {
      dateFilter.lte = new Date(end_date);
    }

    const baseWhere: any = {
      employee_id: id,
    };
    if (start_date || end_date) {
      baseWhere.attendance_date = dateFilter;
    }

    // Apply context filtering
    const contextWhere = this.contextQueryService.buildContextWhere(
      user,
      baseWhere,
    );

    // Execute query
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: contextWhere,
      orderBy: {
        attendance_date: 'desc',
      },
      take: 100, // Limit results
    });

    return {
      data: attendanceRecords,
      count: attendanceRecords.length,
      employee_id: id,
      context: user.context,
    };
  }

  /**
   * Get employee's leave requests with context filtering
   * 
   * Mobile users can only see their own leave requests.
   * HR_Team on Web can see all leave requests.
   */
  @Get(':id/leave-requests')
  async getEmployeeLeaveRequests(
    @Req() req: Request & { user: TaraAuthPayload },
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    const user = req.user;

    // Validate context access
    this.contextQueryService.validateContextAccess(user, id);

    // Build WHERE clause
    const baseWhere: any = {
      employee_id: id,
    };
    if (status) {
      baseWhere.status = status;
    }

    // Apply context filtering
    const contextWhere = this.contextQueryService.buildContextWhere(
      user,
      baseWhere,
    );

    // Execute query
    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where: contextWhere,
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return {
      data: leaveRequests,
      count: leaveRequests.length,
      employee_id: id,
      context: user.context,
    };
  }

  /**
   * Get employee's leave balance with context filtering
   * 
   * Employees can only see their own balance.
   * HR_Team on Web can see any employee's balance.
   */
  @Get(':id/leave-balance')
  async getEmployeeLeaveBalance(
    @Req() req: Request & { user: TaraAuthPayload },
    @Param('id') id: string,
  ) {
    const user = req.user;

    // Validate context access
    this.contextQueryService.validateContextAccess(user, id);

    // Build context-aware WHERE clause
    const contextWhere = this.contextQueryService.buildContextWhere(user, {
      employee_id: id,
      year: new Date().getFullYear(),
    });

    // Execute query
    const balance = await this.prisma.leaveBalance.findFirst({
      where: contextWhere,
    });

    if (!balance) {
      throw new ForbiddenException(
        `Leave balance for employee ${id} not found or access denied.`,
      );
    }

    return balance;
  }

  /**
   * Update employee's language preference
   *
   * Allows employees to change their notification language preference anytime.
   * Validates that only supported languages ('id', 'en') are accepted.
   * The preference is applied to all subsequent notifications.
   *
   * Context rules:
   * - Personal_Employee Context: Can only update own preference
   * - Administrative Context: Can update any employee's preference
   *
   * **Validates: Requirement 16.6**
   */
  @Patch(':id/language-preference')
  async updateLanguagePreference(
    @Req() req: Request & { user: TaraAuthPayload },
    @Param('id') id: string,
    @Body() body: { language: string },
  ) {
    const user = req.user;

    // Validate context access — employees can only update their own preference
    this.contextQueryService.validateContextAccess(user, id);

    // Validate the language value
    const { language } = body;
    if (!language || !SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
      throw new BadRequestException(
        `Invalid language. Supported values: ${SUPPORTED_LANGUAGES.join(', ')}`,
      );
    }

    // Verify employee exists and is accessible within context
    const contextWhere = this.contextQueryService.buildContextWhere(user, { id });
    const employee = await this.prisma.employee.findFirst({
      where: contextWhere,
      select: { id: true, language_preference: true },
    });

    if (!employee) {
      throw new ForbiddenException(
        `Employee ${id} not found or access denied based on your context.`,
      );
    }

    // Update the language preference
    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        language_preference: language,
        updated_at: new Date(),
      },
      select: {
        id: true,
        language_preference: true,
        updated_at: true,
      },
    });

    return {
      message: 'Language preference updated successfully',
      data: updated,
    };
  }
}
