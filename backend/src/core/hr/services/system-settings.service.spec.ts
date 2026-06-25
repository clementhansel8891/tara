import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from './event-bus.service';

describe('SystemSettingsService (Task 20.1)', () => {
  let service: SystemSettingsService;
  let prisma: any;
  let eventBus: any;

  const mockSetting = {
    id: 'setting-1',
    setting_key: 'attendance.work_start',
    setting_value: { time: '09:00' },
    setting_category: 'attendance',
    description: 'Working start time',
    last_modified_by: 'hr-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      systemSettings: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    const mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemSettingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get(SystemSettingsService);
    prisma = module.get(PrismaService);
    eventBus = module.get(EventBusService);
  });

  describe('getByCategory', () => {
    it('returns settings for a supported category', async () => {
      prisma.systemSettings.findMany.mockResolvedValue([mockSetting]);

      const result = await service.getByCategory('attendance');

      expect(result).toEqual([mockSetting]);
      expect(prisma.systemSettings.findMany).toHaveBeenCalledWith({
        where: { setting_category: 'attendance' },
        orderBy: { setting_key: 'asc' },
      });
    });

    it('rejects an unsupported category', async () => {
      await expect(service.getByCategory('finance')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getByKey', () => {
    it('throws NotFoundException when the setting does not exist', async () => {
      prisma.systemSettings.findUnique.mockResolvedValue(null);

      await expect(service.getByKey('missing.key')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('upsert', () => {
    it('creates a setting and emits a config change event', async () => {
      prisma.systemSettings.findUnique.mockResolvedValue(null);
      prisma.systemSettings.upsert.mockResolvedValue(mockSetting);

      const result = await service.upsert({
        setting_key: 'attendance.work_start',
        setting_value: { time: '09:00' },
        setting_category: 'attendance',
        last_modified_by: 'hr-1',
      });

      expect(result).toEqual(mockSetting);
      expect(eventBus.emit).toHaveBeenCalledTimes(1);
      const emitted = eventBus.emit.mock.calls[0][0];
      expect(emitted.event_type).toBe('config.attendance_policy_updated');
      expect(emitted.entity).toEqual({
        id: 'attendance.work_start',
        type: 'system_setting',
      });
      expect(emitted.payload.operation).toBe('created');
    });

    it('rejects an invalid category before applying the change', async () => {
      await expect(
        service.upsert({
          setting_key: 'bad.key',
          setting_value: { x: 1 },
          setting_category: 'invalid_category',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.systemSettings.upsert).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });

    it('rejects a missing setting value', async () => {
      await expect(
        service.upsert({
          setting_key: 'attendance.x',
          setting_value: undefined as any,
          setting_category: 'attendance',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates an existing setting and emits an event', async () => {
      prisma.systemSettings.findUnique.mockResolvedValue(mockSetting);
      prisma.systemSettings.update.mockResolvedValue({
        ...mockSetting,
        setting_value: { time: '08:30' },
      });

      const result = await service.update('attendance.work_start', {
        setting_value: { time: '08:30' },
      });

      expect(result.setting_value).toEqual({ time: '08:30' });
      expect(eventBus.emit).toHaveBeenCalledTimes(1);
      expect(eventBus.emit.mock.calls[0][0].payload.operation).toBe('updated');
    });
  });

  describe('delete', () => {
    it('deletes a setting and emits a delete event', async () => {
      prisma.systemSettings.findUnique.mockResolvedValue(mockSetting);
      prisma.systemSettings.delete.mockResolvedValue(mockSetting);

      const result = await service.delete('attendance.work_start');

      expect(result).toEqual(mockSetting);
      expect(eventBus.emit).toHaveBeenCalledTimes(1);
      const emitted = eventBus.emit.mock.calls[0][0];
      expect(emitted.payload.operation).toBe('deleted');
      expect(emitted.payload.setting_value).toBeNull();
    });
  });
});
