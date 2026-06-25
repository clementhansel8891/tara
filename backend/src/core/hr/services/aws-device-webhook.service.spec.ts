import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AwsDeviceWebhookService } from './aws-device-webhook.service';

describe('AwsDeviceWebhookService', () => {
  let service: AwsDeviceWebhookService;
  let mockPrisma: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockPrisma = {
      aWSDeviceMapping: {
        findUnique: vi.fn(),
      },
    };

    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    service = new AwsDeviceWebhookService(mockPrisma, mockEventBus);
  });

  describe('processWebhookEvent', () => {
    const validPayload = {
      aws_employee_id: 'AWS-EMP-001',
      aws_device_id: 'DEVICE-A1',
      timestamp: '2025-01-15T08:30:00.000Z',
      device_location: 'Main Entrance',
    };

    const activeMapping = {
      id: 'mapping-uuid-1',
      aws_employee_id: 'AWS-EMP-001',
      tara_employee_id: 'tara-uuid-1',
      aws_device_id: 'DEVICE-A1',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should process a valid webhook event successfully', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(activeMapping);

      const result = await service.processWebhookEvent(validPayload);

      expect(result.success).toBe(true);
      expect(result.tara_employee_id).toBe('tara-uuid-1');
      expect(result.aws_employee_id).toBe('AWS-EMP-001');
      expect(result.timestamp).toEqual(new Date('2025-01-15T08:30:00.000Z'));
      expect(result.message).toBe('Webhook event processed successfully');
    });

    it('should call prisma with the correct aws_employee_id', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(activeMapping);

      await service.processWebhookEvent(validPayload);

      expect(mockPrisma.aWSDeviceMapping.findUnique).toHaveBeenCalledWith({
        where: { aws_employee_id: 'AWS-EMP-001' },
      });
    });

    it('should emit an event to EventBus on success', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(activeMapping);

      await service.processWebhookEvent(validPayload);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.aws_device_received',
          entity: { id: 'tara-uuid-1', type: 'attendance' },
          payload: expect.objectContaining({
            aws_employee_id: 'AWS-EMP-001',
            aws_device_id: 'DEVICE-A1',
            tara_employee_id: 'tara-uuid-1',
            timestamp: '2025-01-15T08:30:00.000Z',
            device_location: 'Main Entrance',
          }),
        }),
      );
    });

    it('should throw BadRequestException when no mapping exists', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(null);

      await expect(service.processWebhookEvent(validPayload)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processWebhookEvent(validPayload)).rejects.toThrow(
        /Unknown AWS employee ID/,
      );
    });

    it('should throw BadRequestException when mapping is inactive', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue({
        ...activeMapping,
        is_active: false,
      });

      await expect(service.processWebhookEvent(validPayload)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processWebhookEvent(validPayload)).rejects.toThrow(
        /inactive/,
      );
    });

    it('should throw BadRequestException for invalid timestamp format', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(activeMapping);

      const invalidPayload = {
        ...validPayload,
        timestamp: 'not-a-valid-date',
      };

      await expect(
        service.processWebhookEvent(invalidPayload),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processWebhookEvent(invalidPayload),
      ).rejects.toThrow(/Invalid timestamp format/);
    });

    it('should handle payload without device_location', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(activeMapping);

      const payloadWithoutLocation = {
        aws_employee_id: 'AWS-EMP-001',
        aws_device_id: 'DEVICE-A1',
        timestamp: '2025-01-15T08:30:00.000Z',
      };

      const result = await service.processWebhookEvent(payloadWithoutLocation);

      expect(result.success).toBe(true);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            device_location: null,
          }),
        }),
      );
    });

    it('should not emit event when mapping lookup fails', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(null);

      await expect(service.processWebhookEvent(validPayload)).rejects.toThrow();

      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });
});
