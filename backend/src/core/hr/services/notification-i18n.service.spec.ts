import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationService,
  TaraNotificationType,
  NotificationVisibility,
} from './notification.service';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventStreamGateway } from '../events/event-stream.gateway';
import { I18nService } from '../i18n/i18n.service';

/**
 * Smoke Tests: Language-Aware Notification System (Task 29.2)
 *
 * Validates Requirements:
 * - 16.3: Translate forms/notifications/reports per employee preference
 * - 16.4: Translate all agent-generated messages based on employee language preference
 * - 16.5: Maintain consistent terminology across all agents in each language
 */
describe('NotificationService - I18n Integration (Task 29.2)', () => {
  let service: NotificationService;
  let prisma: PrismaService;

  const mockEmployeeId = {
    id: 'emp-id-1',
    full_name: 'Budi Santoso',
    email: 'budi@example.com',
    language_preference: 'id',
  };

  const mockEmployeeEn = {
    id: 'emp-en-1',
    full_name: 'John Smith',
    email: 'john@example.com',
    language_preference: 'en',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        I18nService,
        {
          provide: PrismaService,
          useValue: {
            employee: {
              findUnique: vi.fn(),
              findMany: vi.fn(),
            },
            notification: {
              create: vi.fn(),
              createManyAndReturn: vi.fn(),
            },
          },
        },
        {
          provide: EventStreamGateway,
          useValue: {
            broadcastEvent: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendNotification with i18n keys (Req 16.4)', () => {
    it('should translate notification content to Indonesian when employee prefers id', async () => {
      // Employee prefers Indonesian
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployeeId as any);
      vi.spyOn(prisma.notification, 'create').mockImplementation(async (args: any) => ({
        id: 'notif-1',
        ...args.data,
        created_at: new Date(),
      }));

      const result = await service.sendNotification({
        recipient_id: mockEmployeeId.id,
        type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
        title: 'Clock In Confirmed',
        content: 'Fallback content',
        metadata: {
          i18n_title_key: 'notification.private_notification',
          i18n_content_key: 'attendance.clock_in_confirmation',
          i18n_params: { employeeName: 'Budi Santoso', time: '08:00' },
        },
      });

      // Should be translated to Indonesian
      expect(result.content).toBe(
        'Halo Budi Santoso, kehadiran Anda tercatat pada 08:00 WIB.',
      );
      expect(result.title).toBe('Notifikasi Pribadi');
    });

    it('should translate notification content to English when employee prefers en', async () => {
      // Employee prefers English
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployeeEn as any);
      vi.spyOn(prisma.notification, 'create').mockImplementation(async (args: any) => ({
        id: 'notif-2',
        ...args.data,
        created_at: new Date(),
      }));

      const result = await service.sendNotification({
        recipient_id: mockEmployeeEn.id,
        type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
        title: 'Clock In Confirmed',
        content: 'Fallback content',
        metadata: {
          i18n_title_key: 'notification.private_notification',
          i18n_content_key: 'attendance.clock_in_confirmation',
          i18n_params: { employeeName: 'John Smith', time: '08:00' },
        },
      });

      // Should be translated to English
      expect(result.content).toBe(
        'Hello John Smith, your attendance has been recorded at 08:00 WIB.',
      );
      expect(result.title).toBe('Private Notification');
    });

    it('should use fallback content when no i18n keys are provided', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployeeEn as any);
      vi.spyOn(prisma.notification, 'create').mockImplementation(async (args: any) => ({
        id: 'notif-3',
        ...args.data,
        created_at: new Date(),
      }));

      const result = await service.sendNotification({
        recipient_id: mockEmployeeEn.id,
        type: TaraNotificationType.GENERAL_NOTIFICATION,
        title: 'Custom Title',
        content: 'Custom content without i18n',
      });

      // Should keep original content since no i18n keys provided
      expect(result.title).toBe('Custom Title');
      expect(result.content).toBe('Custom content without i18n');
    });
  });

  describe('sendBulkNotification with i18n keys (Req 16.3, 16.5)', () => {
    it('should translate per-recipient language for bulk notifications', async () => {
      // Two employees with different language preferences
      const recipients = [
        { id: 'emp-id-1', full_name: 'Budi Santoso', language_preference: 'id' },
        { id: 'emp-en-1', full_name: 'John Smith', language_preference: 'en' },
      ];

      vi.spyOn(prisma.employee, 'findMany').mockResolvedValue(recipients as any);
      vi.spyOn(prisma.notification, 'createManyAndReturn').mockImplementation(
        async (args: any) =>
          args.data.map((d: any, i: number) => ({
            id: `notif-bulk-${i}`,
            ...d,
            created_at: new Date(),
          })),
      );

      const result = await service.sendBulkNotification({
        recipient_ids: ['emp-id-1', 'emp-en-1'],
        type: TaraNotificationType.TARDINESS_ANNOUNCEMENT,
        title: 'Tardiness Report',
        content: 'Fallback content',
        metadata: {
          i18n_title_key: 'attendance.tardiness_report_title',
          i18n_content_key: 'attendance.tardiness_report_none',
          i18n_params: { date: '2025-01-15' },
        },
      });

      expect(result).toHaveLength(2);

      // First recipient (Indonesian)
      expect(result[0].title).toBe('Laporan Keterlambatan - 2025-01-15');
      expect(result[0].content).toBe(
        'Tidak ada karyawan yang terlambat hari ini. Kerja bagus semua!',
      );

      // Second recipient (English)
      expect(result[1].title).toBe('Tardiness Report - 2025-01-15');
      expect(result[1].content).toBe(
        'No employees were late today. Great job everyone!',
      );
    });

    it('should maintain consistent terminology when same language (Req 16.5)', async () => {
      // Two employees both preferring Indonesian
      const recipients = [
        { id: 'emp-1', full_name: 'Budi', language_preference: 'id' },
        { id: 'emp-2', full_name: 'Sari', language_preference: 'id' },
      ];

      vi.spyOn(prisma.employee, 'findMany').mockResolvedValue(recipients as any);
      vi.spyOn(prisma.notification, 'createManyAndReturn').mockImplementation(
        async (args: any) =>
          args.data.map((d: any, i: number) => ({
            id: `notif-${i}`,
            ...d,
            created_at: new Date(),
          })),
      );

      const result = await service.sendBulkNotification({
        recipient_ids: ['emp-1', 'emp-2'],
        type: TaraNotificationType.TARDINESS_ANNOUNCEMENT,
        title: 'Tardiness',
        content: 'Fallback',
        metadata: {
          i18n_content_key: 'attendance.tardiness_report_none',
        },
      });

      // Both should get identical Indonesian translations (consistent terminology)
      expect(result[0].content).toBe(result[1].content);
      expect(result[0].content).toBe(
        'Tidak ada karyawan yang terlambat hari ini. Kerja bagus semua!',
      );
    });
  });

  describe('resolveTranslatedContent', () => {
    it('should return original content when no i18n keys in metadata', async () => {
      const result = await service.resolveTranslatedContent(
        'emp-1',
        'Original Title',
        'Original Content',
        { someOtherField: 'value' },
      );

      expect(result.title).toBe('Original Title');
      expect(result.content).toBe('Original Content');
    });

    it('should return original content when metadata is undefined', async () => {
      const result = await service.resolveTranslatedContent(
        'emp-1',
        'Original Title',
        'Original Content',
        undefined,
      );

      expect(result.title).toBe('Original Title');
      expect(result.content).toBe('Original Content');
    });

    it('should translate only title when only title key is provided', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployeeEn as any);

      const result = await service.resolveTranslatedContent(
        mockEmployeeEn.id,
        'Fallback Title',
        'Keep this content',
        { i18n_title_key: 'common.success' },
      );

      expect(result.title).toBe('Success');
      expect(result.content).toBe('Keep this content');
    });

    it('should translate only content when only content key is provided', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployeeId as any);

      const result = await service.resolveTranslatedContent(
        mockEmployeeId.id,
        'Keep this title',
        'Fallback Content',
        { i18n_content_key: 'common.success' },
      );

      expect(result.title).toBe('Keep this title');
      expect(result.content).toBe('Berhasil');
    });
  });
});
