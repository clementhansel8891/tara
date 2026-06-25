import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OfficeLocationService } from '../services/office-location.service';
import { CreateOfficeLocationDto } from '../dto/create-office-location.dto';
import { UpdateOfficeLocationDto } from '../dto/update-office-location.dto';
import { AssignEmployeeLocationDto } from '../dto/assign-employee-location.dto';
import { TaraJwtAuthGuard } from '../../auth/guards/tara-jwt-auth.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

/**
 * Office Location Controller
 * 
 * Task 10.3: Implement OfficeLocation management in Settings
 * 
 * Provides REST API endpoints for managing office locations and geo-fence configurations.
 * All endpoints require HR_Team role authentication (Settings Page access).
 * 
 * References:
 * - Requirement 23.5: Store office coordinates and geo-fence radius
 * - Requirement 23.6: Geo-fence radius configuration (50-1000 meters)
 * - Requirement 23.7: Support multiple office locations
 * - Requirement 23.8: Assign employees to specific office locations
 */
@Controller('api/settings/office-locations')
@UseGuards(TaraJwtAuthGuard)
@Roles('hr_team') // Settings Page is accessible only to HR_Team
export class OfficeLocationController {
  constructor(private readonly officeLocationService: OfficeLocationService) {}

  /**
   * Create a new office location
   * 
   * POST /api/settings/office-locations
   * 
   * @param createDto - Office location data
   * @returns Created office location
   * 
   * Requirements:
   * - 23.5: Store office coordinates (latitude, longitude) and geo-fence radius
   * - 23.6: Geo-fence radius between 50-1000 meters
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateOfficeLocationDto) {
    return this.officeLocationService.create(createDto);
  }

  /**
   * Get all office locations
   * 
   * GET /api/settings/office-locations
   * 
   * @param includeInactive - Query param to include inactive locations
   * @returns List of office locations
   * 
   * Requirements:
   * - 23.7: Support multiple office locations for multi-site organizations
   */
  @Get()
  async findAll(@Query('include_inactive') includeInactive?: string) {
    const includeInactiveBool = includeInactive === 'true';
    return this.officeLocationService.findAll(includeInactiveBool);
  }

  /**
   * Get a single office location by ID
   * 
   * GET /api/settings/office-locations/:id
   * 
   * @param id - Office location ID
   * @returns Office location
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.officeLocationService.findOne(id);
  }

  /**
   * Update an office location
   * 
   * PUT /api/settings/office-locations/:id
   * 
   * @param id - Office location ID
   * @param updateDto - Updated office location data
   * @returns Updated office location
   * 
   * Requirements:
   * - 23.5: Store office coordinates and geo-fence radius
   * - 23.6: Geo-fence radius between 50-1000 meters
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOfficeLocationDto,
  ) {
    return this.officeLocationService.update(id, updateDto);
  }

  /**
   * Delete (soft delete by marking inactive) an office location
   * 
   * DELETE /api/settings/office-locations/:id
   * 
   * @param id - Office location ID
   * @returns Success message
   * 
   * Note: Soft delete to preserve historical attendance records
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.officeLocationService.remove(id);
  }

  /**
   * Assign an employee to an office location
   * 
   * POST /api/settings/office-locations/assign
   * 
   * @param assignDto - Employee and location IDs
   * @returns Assignment confirmation
   * 
   * Requirements:
   * - 23.8: Assign employees to specific office locations
   */
  @Post('assign')
  @HttpCode(HttpStatus.OK)
  async assignEmployee(@Body() assignDto: AssignEmployeeLocationDto) {
    return this.officeLocationService.assignEmployeeToLocation(
      assignDto.employee_id,
      assignDto.location_id,
    );
  }

  /**
   * Get employees assigned to an office location
   * 
   * GET /api/settings/office-locations/:id/employees
   * 
   * @param id - Office location ID
   * @returns List of employees assigned to this location
   * 
   * Requirements:
   * - 23.8: View employees assigned to specific office locations
   */
  @Get(':id/employees')
  async getEmployees(@Param('id') id: string) {
    return this.officeLocationService.getEmployeesByLocation(id);
  }
}
