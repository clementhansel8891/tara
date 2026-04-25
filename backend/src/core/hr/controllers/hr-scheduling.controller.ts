import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Headers,
  Req 
} from "@nestjs/common";
import { SchedulingService } from "../scheduling.service";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { TenantGuard } from "../../../shared/guards/tenant.guard";
import { UserRole } from "../../../shared/roles";
import { 
  CreateWorkScheduleDto, 
  UpdateWorkScheduleDto, 
  CreateWorkShiftDto, 
  UpdateWorkShiftDto 
} from "../dto";

@Controller('hr/scheduling')
@UseGuards(RolesGuard, TenantGuard)
export class HrSchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get("schedules")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSchedules(
    @Headers("x-tenant-id") tenant_id: string,
    @Query("location_id") location_id?: string,
    @Query("status") status?: string,
  ) {
    return this.schedulingService.getWorkSchedules(tenant_id, location_id);
  }

  @Post("schedules")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createSchedule(
    @Headers("x-tenant-id") tenant_id: string,
    @Body() data: CreateWorkScheduleDto,
    @Req() req: any,
  ) {
    const user_id = req.user?.id;
    return this.schedulingService.createWorkSchedule(tenant_id, data, user_id);
  }

  @Post("schedules/:id/approve")
  @Roles(UserRole.ADMIN) // Only Admin can approve
  async approveSchedule(
    @Headers("x-tenant-id") tenant_id: string,
    @Param("id") id: string,
    @Req() req: any,
  ) {
    const user_id = req.user?.id;
    return this.schedulingService.approveSchedule(tenant_id, id, user_id);
  }

  @Get("shifts")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  async getShifts(
    @Headers("x-tenant-id") tenant_id: string,
    @Query("schedule_id") schedule_id?: string,
    @Query("employee_id") employee_id?: string,
  ) {
    return this.schedulingService.getWorkShifts(tenant_id, schedule_id, employee_id);
  }

  @Post("shifts")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createShift(
    @Headers("x-tenant-id") tenant_id: string,
    @Body() data: CreateWorkShiftDto,
    @Req() req: any,
  ) {
    const user_id = req.user?.id;
    return this.schedulingService.createWorkShift(tenant_id, data, user_id);
  }

  // --- Overrides & Swaps ---

  @Get("overrides")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getOverrides(@Headers("x-tenant-id") tenant_id: string) {
    return this.schedulingService.listOverrides(tenant_id);
  }

  @Post("overrides")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async saveOverride(
    @Headers("x-tenant-id") tenant_id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    const user_id = req.user?.id;
    return this.schedulingService.saveOverride(tenant_id, data, user_id);
  }

  @Get("swaps")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  async getSwaps(@Headers("x-tenant-id") tenant_id: string) {
    return this.schedulingService.listSwaps(tenant_id);
  }

  @Post("swaps")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  async saveSwap(
    @Headers("x-tenant-id") tenant_id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    const user_id = req.user?.id;
    return this.schedulingService.saveSwapRequest(tenant_id, data, user_id);
  }

  @Get("master-shifts")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  async getMasterShifts(@Headers("x-tenant-id") tenant_id: string) {
    return this.schedulingService.listAllShifts(tenant_id);
  }

  @Get("assignments")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  async getAssignments(
    @Headers("x-tenant-id") tenant_id: string,
    @Query("employeeId") employee_id?: string,
  ) {
    return this.schedulingService.listAllAssignments(tenant_id, employee_id);
  }
}
