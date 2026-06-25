// @ts-nocheck
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from './event-bus.service';

/**
 * AWS Device Mapping Service
 *
 * Manages CRUD operations for the AWSDeviceMapping table which links
 * AWS fingerprint device employee IDs to TARA employee IDs.
 *
 * Key behaviors:
 * - Validates that tara_employee_id references a real employee
 * - Rejects records with invalid employee IDs
 * - Provides full CRUD for HR_Team management via the Settings Page
 * - Emits events to Event Bus on changes
 *
 * Requirements: 20.11, 24.4, 24.5
 * Task: 24.2
 */
@Injectable()
export class AwsDeviceMappingService {
  private readonly logger = new Logger(AwsDeviceMappingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBusService: EventBusService,
  ) {}

  /**
   * Create a new AWS device mapping.
   *
   * Validates:
   * - tara_employee_id references an existing employee
   * - aws_employee_id is not already mapped (unique constraint)
   *
   * @throws BadRequestException if tara_employee_id is invalid
   * @throws ConflictException if aws_employee_id already exists
   */
  async createMapping(data: {
    aws_employee_id: string;
    tara_employee_id: string;
    aws_device_id?: string;
    is_active?: boolean;
  }, actor_id?: string) {
    this.logger.log(
      `Creating mapping: aws_employee_id=${data.aws_employee_id} → tara_employee_id=${data.tara_employee_id}`,
    );

    // Validate that the tara_employee_id references a real employee
    const employee = await this.prisma.employee.findUnique({
      where: { id: data.tara_employee_id },
    });

    if (!employee) {
      throw new BadRequestException(
        `Invalid tara_employee_id: ${data.tara_employee_id}. Employee does not exist.`,
      );
    }

    // Check for existing mapping with same aws_employee_id
    const existing = await this.prisma.aWSDeviceMapping.findUnique({
      where: { aws_employee_id: data.aws_employee_id },
    });

    if (existing) {
      throw new ConflictException(
        `A mapping already exists for aws_employee_id: ${data.aws_employee_id}`,
      );
    }

    // Check for existing mapping with same tara_employee_id
    const existingTara = await this.prisma.aWSDeviceMapping.findUnique({
      where: { tara_employee_id: data.tara_employee_id },
    });

    if (existingTara) {
      throw new ConflictException(
        `A mapping already exists for tara_employee_id: ${data.tara_employee_id}. ` +
        `It is currently mapped to aws_employee_id: ${existingTara.aws_employee_id}`,
      );
    }

    const mapping = await this.prisma.aWSDeviceMapping.create({
      data: {
        aws_employee_id: data.aws_employee_id,
        tara_employee_id: data.tara_employee_id,
        aws_device_id: data.aws_device_id ?? null,
        is_active: data.is_active ?? true,
      },
    });

    // Emit event for audit
    await this.eventBusService.emit({
      event_type: 'aws_device_mapping.created',
      event_version: '1.0',
      event_timestamp: new Date(),
      actor: { id: actor_id ?? 'system', type: 'hr_team' },
      entity: { id: mapping.id, type: 'aws_device_mapping' },
      payload: {
        aws_employee_id: mapping.aws_employee_id,
        tara_employee_id: mapping.tara_employee_id,
        aws_device_id: mapping.aws_device_id,
        is_active: mapping.is_active,
      },
    });

    this.logger.log(`Mapping created: id=${mapping.id}`);
    return mapping;
  }

  /**
   * Get all AWS device mappings with optional filtering.
   */
  async listMappings(filters?: { is_active?: boolean }) {
    const where: any = {};
    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    const mappings = await this.prisma.aWSDeviceMapping.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            employee_code: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return mappings;
  }

  /**
   * Get a single mapping by ID.
   *
   * @throws NotFoundException if mapping doesn't exist
   */
  async getMappingById(id: string) {
    const mapping = await this.prisma.aWSDeviceMapping.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            employee_code: true,
            email: true,
          },
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException(`AWS device mapping with id '${id}' not found`);
    }

    return mapping;
  }

  /**
   * Get a mapping by AWS employee ID.
   *
   * @throws NotFoundException if mapping doesn't exist
   */
  async getMappingByAwsEmployeeId(aws_employee_id: string) {
    const mapping = await this.prisma.aWSDeviceMapping.findUnique({
      where: { aws_employee_id },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            employee_code: true,
            email: true,
          },
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        `No mapping found for aws_employee_id '${aws_employee_id}'`,
      );
    }

    return mapping;
  }

  /**
   * Update an existing mapping.
   *
   * If tara_employee_id is being updated, validates it references a real employee.
   *
   * @throws NotFoundException if mapping doesn't exist
   * @throws BadRequestException if new tara_employee_id is invalid
   * @throws ConflictException if new aws_employee_id conflicts with another mapping
   */
  async updateMapping(
    id: string,
    data: {
      aws_employee_id?: string;
      tara_employee_id?: string;
      aws_device_id?: string;
      is_active?: boolean;
    },
    actor_id?: string,
  ) {
    // Verify mapping exists
    const existing = await this.prisma.aWSDeviceMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`AWS device mapping with id '${id}' not found`);
    }

    // If updating tara_employee_id, validate the new employee exists
    if (data.tara_employee_id && data.tara_employee_id !== existing.tara_employee_id) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: data.tara_employee_id },
      });

      if (!employee) {
        throw new BadRequestException(
          `Invalid tara_employee_id: ${data.tara_employee_id}. Employee does not exist.`,
        );
      }

      // Check for duplicate tara_employee_id mapping
      const duplicateTara = await this.prisma.aWSDeviceMapping.findUnique({
        where: { tara_employee_id: data.tara_employee_id },
      });

      if (duplicateTara && duplicateTara.id !== id) {
        throw new ConflictException(
          `A mapping already exists for tara_employee_id: ${data.tara_employee_id}`,
        );
      }
    }

    // If updating aws_employee_id, check for conflicts
    if (data.aws_employee_id && data.aws_employee_id !== existing.aws_employee_id) {
      const duplicate = await this.prisma.aWSDeviceMapping.findUnique({
        where: { aws_employee_id: data.aws_employee_id },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `A mapping already exists for aws_employee_id: ${data.aws_employee_id}`,
        );
      }
    }

    const updateData: any = { updated_at: new Date() };
    if (data.aws_employee_id !== undefined) updateData.aws_employee_id = data.aws_employee_id;
    if (data.tara_employee_id !== undefined) updateData.tara_employee_id = data.tara_employee_id;
    if (data.aws_device_id !== undefined) updateData.aws_device_id = data.aws_device_id;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const updated = await this.prisma.aWSDeviceMapping.update({
      where: { id },
      data: updateData,
    });

    // Emit event for audit
    await this.eventBusService.emit({
      event_type: 'aws_device_mapping.updated',
      event_version: '1.0',
      event_timestamp: new Date(),
      actor: { id: actor_id ?? 'system', type: 'hr_team' },
      entity: { id: updated.id, type: 'aws_device_mapping' },
      payload: {
        changes: data,
        previous: {
          aws_employee_id: existing.aws_employee_id,
          tara_employee_id: existing.tara_employee_id,
          aws_device_id: existing.aws_device_id,
          is_active: existing.is_active,
        },
      },
    });

    this.logger.log(`Mapping updated: id=${id}`);
    return updated;
  }

  /**
   * Delete (hard delete) an AWS device mapping.
   *
   * @throws NotFoundException if mapping doesn't exist
   */
  async deleteMapping(id: string, actor_id?: string) {
    const existing = await this.prisma.aWSDeviceMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`AWS device mapping with id '${id}' not found`);
    }

    await this.prisma.aWSDeviceMapping.delete({ where: { id } });

    // Emit event for audit
    await this.eventBusService.emit({
      event_type: 'aws_device_mapping.deleted',
      event_version: '1.0',
      event_timestamp: new Date(),
      actor: { id: actor_id ?? 'system', type: 'hr_team' },
      entity: { id, type: 'aws_device_mapping' },
      payload: {
        aws_employee_id: existing.aws_employee_id,
        tara_employee_id: existing.tara_employee_id,
      },
    });

    this.logger.log(`Mapping deleted: id=${id}`);
    return { success: true, message: `Mapping ${id} deleted successfully` };
  }
}
