import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AwsDeviceWebhookService } from '../services/aws-device-webhook.service';
import { AwsDeviceWebhookDto } from '../dto/aws-device-webhook.dto';

/**
 * AWS Device Webhook Controller
 *
 * Receives real-time attendance events from AWS-connected fingerprint devices.
 * This endpoint is called by the AWS device infrastructure when an employee
 * scans their fingerprint.
 *
 * Endpoint:
 *   POST /api/integrations/aws-device/webhook
 *
 * Payload:
 *   - aws_employee_id: string (required) - Employee ID in the AWS device system
 *   - aws_device_id: string (required) - Physical device identifier
 *   - timestamp: string (required) - ISO 8601 timestamp of the scan event
 *   - device_location: string (optional) - Physical location of the device
 *
 * Requirements: 24.1, 24.3, 24.5
 * Task: 24.1
 */
@Controller('api/integrations/aws-device')
export class AwsDeviceWebhookController {
  private readonly logger = new Logger(AwsDeviceWebhookController.name);

  constructor(
    private readonly awsDeviceWebhookService: AwsDeviceWebhookService,
  ) {}

  /**
   * Receive a webhook event from an AWS fingerprint device.
   *
   * Validates the incoming payload (employee ID, timestamp format) and
   * delegates processing to the service layer which handles mapping lookup,
   * event emission, and error handling.
   *
   * Requirements:
   * - 24.1: Support real-time webhook integration receiving attendance events
   * - 24.3: Include AWS device ID, Employee identifier, timestamp, and device physical location
   * - 24.5: Validate incoming data and reject records with invalid Employee IDs or malformed timestamps
   *
   * @param dto - Validated webhook payload
   * @returns Processing result with mapped employee info
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async receiveWebhook(@Body() dto: AwsDeviceWebhookDto) {
    this.logger.log(
      `Received AWS device webhook: aws_employee_id=${dto.aws_employee_id}, device=${dto.aws_device_id}`,
    );

    const result = await this.awsDeviceWebhookService.processWebhookEvent({
      aws_employee_id: dto.aws_employee_id,
      aws_device_id: dto.aws_device_id,
      timestamp: dto.timestamp,
      device_location: dto.device_location,
    });

    return result;
  }
}
