import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AwsDeviceBatchSyncService,
  AwsDeviceApiClient,
  AwsAttendanceRecord,
  StubAwsDeviceApiClient,
} from './aws-device-batch-sync.service';

describe('AwsDeviceBatchSyncService', () => {
  let service: AwsDeviceBatchSyncService;
  let mockPrisma: any;
  let mockEventBus: any;
  let mockSystemSettings: any;
  let mockSchedulerRegistry: any;
  let mockApiClient: AwsDeviceApiClient;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(async (fn: any) => fn(mockPrisma)),
      aWSDeviceMapping: {
        findUnique: vi.fn(),
      },
    };

    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    mockSystemSettings = {
      getByKey: vi.fn().mockRejectedValue(new Error('Not found')),
      upsert: vi.fn().mockResolvedValue(undefined),
    };

    mockSchedulerRegistry = {
      addCronJob: vi.fn(),
      deleteCronJob: vi.fn(),
    };

    mockApiClient = {
      fetchAttendanceRecords: vi.fn().mockResolvedValue([]),
    };

    service = new AwsDeviceBatchSyncService(
      mockPrisma,
      mockEventBus,
      mockSystemSettings,
      mockSchedulerRegistry,
      mockApiClient,
    );
  });

  describe('getConfiguredInterval', () => {
    it('should return the default interval (60) when setting is not found', async () => {
      mockSystemSettings.getByKey.mockRejectedValue(new Error('Not found'));

      const interval = await service.getConfiguredInterval();

      expect(interval).toBe(60);
    });

    it('should return the configured interval from settings', async () => {
      mockSystemSettings.getByKey.mockResolvedValue({ setting_value: 30 });

      const interval = await service.getConfiguredInterval();

      expect(interval).toBe(30);
    });

    it('should clamp to default when value is below minimum (15)', async () => {
      mockSystemSettings.getByKey.mockResolvedValue({ setting_value: 5 });

      const interval = await service.getConfiguredInterval();

      expect(interval).toBe(60); // Falls back to default because invalid
    });

    it('should clamp to default when value exceeds maximum (1440)', async () => {
      mockSystemSettings.getByKey.mockResolvedValue({ setting_value: 2000 });

      const interval = await service.getConfiguredInterval();

      expect(interval).toBe(60); // Falls back to default because invalid
    });
  });

  describe('executeBatchSync', () => {
    it('should return empty result when no records from API', async () => {
      (mockApiClient.fetchAttendanceRecords as any).mockResolvedValue([]);

      const result = await service.executeBatchSync();

      expect(result.total).toBe(0);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should process valid records successfully', async () => {
      const records: AwsAttendanceRecord[] = [
        {
          aws_employee_id: 'AWS-001',
          aws_device_id: 'DEV-A',
          timestamp: '2025-01-15T08:30:00.000Z',
          device_location: 'Main Entrance',
        },
      ];

      (mockApiClient.fetchAttendanceRecords as any).mockResolvedValue(records);
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue({
        aws_employee_id: 'AWS-001',
        tara_employee_id: 'tara-uuid-1',
        is_active: true,
      });

      const result = await service.executeBatchSync();

      expect(result.total).toBe(1);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should skip records with no mapping', async () => {
      const records: AwsAttendanceRecord[] = [
        {
          aws_employee_id: 'UNKNOWN-001',
          aws_device_id: 'DEV-A',
          timestamp: '2025-01-15T08:30:00.000Z',
        },
      ];

      (mockApiClient.fetchAttendanceRecords as any).mockResolvedValue(records);
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(null);

      const result = await service.executeBatchSync();

      expect(result.total).toBe(1);
      expect(result.success).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].reason).toContain('No mapping found');
    });

    it('should skip records with inactive mapping', async () => {
      const records: AwsAttendanceRecord[] = [
        {
          aws_employee_id: 'AWS-001',
          aws_device_id: 'DEV-A',
          timestamp: '2025-01-15T08:30:00.000Z',
        },
      ];

      (mockApiClient.fetchAttendanceRecords as any).mockResolvedValue(records);
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue({
        aws_employee_id: 'AWS-001',
        tara_employee_id: 'tara-uuid-1',
        is_active: false,
      });

      const result = await service.executeBatchSync();

      expect(result.total).toBe(1);
      expect(result.success).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors[0].reason).toContain('inactive');
    });

    it('should fail records with invalid timestamp', async () => {
      const records: AwsAttendanceRecord[] = [
        {
          aws_employee_id: 'AWS-001',
          aws_device_id: 'DEV-A',
          timestamp: 'not-a-valid-date',
        },
      ];

      (mockApiClient.fetchAttendanceRecords as any).mockResolvedValue(records);
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue({
        aws_employee_id: 'AWS-001',
        tara_employee_id: 'tara-uuid-1',
        is_active: true,
      });

      const result = await service.executeBatchSync();

      expect(result.total).toBe(1);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].reason).toContain('Invalid timestamp');
    });

    it('should use $transaction for batch safety', async () => {
      const records: AwsAttendanceRecord[] = [
        {
          aws_employee_id: 'AWS-001',
          aws_device_id: 'DEV-A',
          timestamp: '2025-01-15T08:30:00.000Z',
        },
      ];

      (mockApiClient.fetchAttendanceRecords as any).mockResolvedValue(records);
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue({
        aws_employee_id: 'AWS-001',
        tara_employee_id: 'tara-uuid-1',
        is_active: true,
      });

      await service.executeBatchSync();

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should emit event to EventBus for each successful record', async () => {
      const records: AwsAttendanceRecord[] = [
        {
          aws_employee_id: 'AWS-001',
          aws_device_id: 'DEV-A',
          timestamp: '2025-01-15T08:30:00.000Z',
          device_location: 'Lobby',
        },
      ];

      (mockApiClient.fetchAttendanceRecords as any).mockResolvedValue(records);
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue({
        aws_employee_id: 'AWS-001',
        tara_employee_id: 'tara-uuid-1',
        is_active: true,
      });

      await service.executeBatchSync();

      // One event for the record + one for the sync result log
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'attendance.aws_device_received',
          payload: expect.objectContaining({
            aws_employee_id: 'AWS-001',
            tara_employee_id: 'tara-uuid-1',
            source: 'batch_sync',
          }),
        }),
      );
    });

    it('should log sync results to EventBus', async () => {
      (mockApiClient.fetchAttendanceRecords as any).mockResolvedValue([]);

      await service.executeBatchSync();

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'aws_device.batch_sync_completed',
          payload: expect.objectContaining({
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0,
          }),
        }),
      );
    });

    it('should process multiple records in a single batch', async () => {
      const records: AwsAttendanceRecord[] = [
        {
          aws_employee_id: 'AWS-001',
          aws_device_id: 'DEV-A',
          timestamp: '2025-01-15T08:30:00.000Z',
        },
        {
          aws_employee_id: 'AWS-002',
          aws_device_id: 'DEV-A',
          timestamp: '2025-01-15T08:45:00.000Z',
        },
        {
          aws_employee_id: 'UNKNOWN',
          aws_device_id: 'DEV-B',
          timestamp: '2025-01-15T09:00:00.000Z',
        },
      ];

      (mockApiClient.fetchAttendanceRecords as any).mockResolvedValue(records);
      mockPrisma.aWSDeviceMapping.findUnique
        .mockResolvedValueOnce({
          aws_employee_id: 'AWS-001',
          tara_employee_id: 'tara-uuid-1',
          is_active: true,
        })
        .mockResolvedValueOnce({
          aws_employee_id: 'AWS-002',
          tara_employee_id: 'tara-uuid-2',
          is_active: true,
        })
        .mockResolvedValueOnce(null); // UNKNOWN

      const result = await service.executeBatchSync();

      expect(result.total).toBe(3);
      expect(result.success).toBe(2);
      expect(result.skipped).toBe(1);
    });

    it('should save last sync timestamp after completion', async () => {
      (mockApiClient.fetchAttendanceRecords as any).mockResolvedValue([]);

      await service.executeBatchSync();

      expect(mockSystemSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          setting_key: 'aws_batch_sync_last_run',
          setting_category: 'aws_integration',
        }),
      );
    });
  });

  describe('updateSyncInterval', () => {
    it('should register a new cron job with the given interval', async () => {
      await service.updateSyncInterval(30);

      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalled();
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'aws-batch-sync',
        expect.anything(),
      );
    });

    it('should clamp interval to minimum (15 minutes)', async () => {
      await service.updateSyncInterval(5);

      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalled();
    });

    it('should clamp interval to maximum (1440 minutes)', async () => {
      await service.updateSyncInterval(3000);

      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalled();
    });
  });

  describe('StubAwsDeviceApiClient', () => {
    it('should return empty array', async () => {
      const stub = new StubAwsDeviceApiClient();
      const result = await stub.fetchAttendanceRecords('2025-01-01T00:00:00Z');
      expect(result).toEqual([]);
    });
  });
});
