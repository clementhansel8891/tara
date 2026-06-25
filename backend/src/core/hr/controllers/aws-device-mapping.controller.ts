import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AwsDeviceMappingService } from '../services/aws-device-mapping.service';
import {
  CreateAwsDeviceMappingDto,
  UpdateAwsDeviceMappingDto,
} from '../dto/aws-device-mapping.dto';
import {
  TaraJwtAuthGuard,
} from '../../auth/guards/tara-jwt-auth.guard';
import { TaraRoleGuard, Roles } from '../../auth/guards/tara-role.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TaraAuthPayload } from '../../auth/tara-auth.service';

/**
 * AWS Device Mapping Controller
 *
 * Provides CRUD endpoints for managing employee ID mappings between
 * AWS fingerprint devices and the TARA system. Accessible only to HR_Team
 * through the Settings Page in the Web Interface.
 *
 * Endpoints:
 *   GET    /api/settings/aws-device-mappings            - List all mappings
 *   GET    /api/settings/aws-device-mappings/:id        - Get a single mapping
 *   POST   /api/settings/aws-device-mappings            - Create a new mapping
 *   PUT    /api/settings/aws-device-mappings/:id        - Update a mapping
 *   DELETE /api/settings/aws-device-mappings/:id        - Delete a mapping
 *
 * Requirements: 20.11, 24.4, 24.5
 * Task: 24.2
 */
@Controller('api/settings/aws-device-mappings')
@UseGuards(TaraJwtAuthGuard, TaraRoleGuard)
@Roles('HR_Team')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AwsDeviceMappingController {
  constructor(
    private readonly awsDeviceMappingService: AwsDeviceMappingService,
  ) {}

  /**
   * List all AWS device mappings.
   * Optionally filter by active status with ?is_active=true|false.
   *
   * Requirement 24.4: Provide Employee ID mapping table in Settings Page.
   */
  @Get()
  async listMappings(@Query('is_active') isActive?: string) {
    const filters: { is_active?: boolean } = {};
    if (isActive === 'true') filters.is_active = true;
    if (isActive === 'false') filters.is_active = false;

    const data = await this.awsDeviceMappingService.listMappings(filters);
    return { data, count: data.length };
  }

  /**
   * Get a single mapping by ID.
   */
  @Get(':id')
  async getMapping(@Param('id') id: string) {
    return this.awsDeviceMappingService.getMappingById(id);
  }

  /**
   * Create a new mapping between an AWS employee ID and a TARA employee.
   *
   * Validates that tara_employee_id references a real employee.
   * Rejects records with invalid employee IDs (Requirement 24.5).
   *
   * Requirement 20.11: Map AWS device Employee IDs to TARA Employee IDs
   * through configurable mapping table.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMapping(
    @Body() dto: CreateAwsDeviceMappingDto,
    @CurrentUser() user: TaraAuthPayload,
  ) {
    return this.awsDeviceMappingService.createMapping(
      {
        aws_employee_id: dto.aws_employee_id,
        tara_employee_id: dto.tara_employee_id,
        aws_device_id: dto.aws_device_id,
        is_active: dto.is_active,
      },
      user?.sub,
    );
  }

  /**
   * Update an existing mapping.
   *
   * If tara_employee_id is provided, validates it references a real employee.
   * Rejects invalid employee IDs (Requirement 24.5).
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateMapping(
    @Param('id') id: string,
    @Body() dto: UpdateAwsDeviceMappingDto,
    @CurrentUser() user: TaraAuthPayload,
  ) {
    return this.awsDeviceMappingService.updateMapping(
      id,
      {
        aws_employee_id: dto.aws_employee_id,
        tara_employee_id: dto.tara_employee_id,
        aws_device_id: dto.aws_device_id,
        is_active: dto.is_active,
      },
      user?.sub,
    );
  }

  /**
   * Delete an AWS device mapping.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteMapping(
    @Param('id') id: string,
    @CurrentUser() user: TaraAuthPayload,
  ) {
    return this.awsDeviceMappingService.deleteMapping(id, user?.sub);
  }
}
