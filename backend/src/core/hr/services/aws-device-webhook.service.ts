import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from './event-bus.service';

/**
 * AWS Device Webhook Service
 *
 * Processes incoming attendance events from AWS fingerprint devices.
 * Validates the payload, looks up employee mapping, and stores the
 * raw webhook event for downstream processing (conflict resolution,
 * attendance recording, etc.).
 *
 * Requirements: 24.1, 24.3, 24.5
 * Task: 24.1
 */
@Injectable()
export class AwsDeviceWebhookService {
  private readonly logger = new Logger(AwsDeviceWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBusService: EventBusService,
  ) {}

  /**
   * Process a single webhook event from an AWS fingerprint device.
   *
   * Steps:
   * 1. Validate the aws_employee_id exists in the mapping table
   * 2. Validate the mapping is active
   * 3. Parse and validate timestamp
   * 4. Emit an event to the Event Bus for downstream agents
   * 5. Return the processed result
   *
   * @param payload - Validated webhook DTO fields
   * @returns Processing result with mapped employee and status
   * @throws BadRequestException for unmapped or inactive employee IDs
   */
  async processWebhookEvent(payload: {
    aws_employee_id: string;
    aws_device_id: string;
    timestamp: string;
    device_location?: string;
  }): Promise<{
    success: boolean;
    tara_employee_id: string;
    aws_employee_id: string;
    timestamp: Date;
    message: string;
  }> {
    this.logger.log(
      `Processing AWS webhook event for aws_employee_id=${payload.aws_employee_id}, device=${payload.aws_device_id}`,
    );

    // Step 1: Look up the employee mapping
    const mapping = await this.prisma.aWSDeviceMapping.findUnique({
      where: { aws_employee_id: payload.aws_employee_id },
    });

    if (!mapping) {
      this.logger.warn(
        `No mapping found for aws_employee_id=${payload.aws_employee_id}`,
      );
      throw new BadRequestException(
        `Unknown AWS employee ID: ${payload.aws_employee_id}. No mapping exists in the system.`,
      );
    }

    // Step 2: Check if the mapping is active
    if (!mapping.is_active) {
      this.logger.warn(
        `Mapping for aws_employee_id=${payload.aws_employee_id} is inactive`,
      );
      throw new BadRequestException(
        `Mapping for AWS employee ID ${payload.aws_employee_id} is inactive.`,
      );
    }

    // Step 3: Parse and validate timestamp
    const parsedTimestamp = new Date(payload.timestamp);
    if (isNaN(parsedTimestamp.getTime())) {
      throw new BadRequestException(
        `Invalid timestamp format: ${payload.timestamp}. Expected ISO 8601 format.`,
      );
    }

    // Step 4: Emit event to Event Bus for downstream processing
    await this.eventBusService.emit({
      event_type: 'attendance.aws_device_received',
      event_version: '1.0',
      event_timestamp: new Date(),
      actor: {
        id: mapping.tara_employee_id,
        type: 'system',
      },
      entity: {
        id: mapping.tara_employee_id,
        type: 'attendance',
      },
      payload: {
        aws_employee_id: payload.aws_employee_id,
        aws_device_id: payload.aws_device_id,
        tara_employee_id: mapping.tara_employee_id,
        timestamp: parsedTimestamp.toISOString(),
        device_location: payload.device_location ?? null,
      },
    });

    this.logger.log(
      `Successfully processed AWS webhook for aws_employee_id=${payload.aws_employee_id} → tara_employee_id=${mapping.tara_employee_id}`,
    );

    return {
      success: true,
      tara_employee_id: mapping.tara_employee_id,
      aws_employee_id: payload.aws_employee_id,
      timestamp: parsedTimestamp,
      message: 'Webhook event processed successfully',
    };
  }
}
