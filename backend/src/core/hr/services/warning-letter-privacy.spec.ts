import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import {
  WarningLetterService,
  WarningLevel,
  WarningLetterStatus,
  WARNING_LETTER_BLOCKED_CHANNELS,
} from './warning-letter.service';

/**
 * Unit Tests for Warning Letter Privacy Enforcement
 * Task 21.2: Implement warning letter privacy enforcement
 *
 * Tests:
 * - Visibility restricted to recipient employee only (Req 11.2, 11.3)
 * - Never broadcast to public announcement channel (Req 11.3)
 * - Multiple warning levels with tracking (Req 11.6)
 * - Expiration date tracking per company policy (Req 11.7)
 */
describe('WarningLetterService - Privacy Enforcement (Task 21.2)', () => {
  let service: WarningLetterService;
  let mockPrisma: any;
  let mockNotificationService: any;
  let mockEventBusService: any;

  const mockEmployee = { id: 'emp-1', full_name: 'John Doe' };
  const now = new Date();
  const sixMonthsFromNow = new Date(now);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const mockWarningLetters = [
    {
      id: 'wl-1',
      employee_id: 'emp-1',
      warning_level: WarningLevel.SP1,
      issue_date: new Date('2025-01-15'),
      reason: 'Repeated tardiness',
      expiry_date: sixMonthsFromNow,
      status: 'active',
      content: 'First warning for tardiness',
      issued_by: 'hr-1',
      created_at: new Date('2025-01-15'),
    },
    {
      id: 'wl-2',
      employee_id: 'emp-1',
      warning_level: WarningLevel.SP2,
      issue_date: new Date('2025-03-01'),
      reason: 'Continued tardiness',
      expiry_date: sixMonthsFromNow,
      status: 'active',
      content: 'Second warning for continued tardiness',
      issued_by: 'hr-1',
      created_at: new Date('2025-03-01'),
    },
  ];

  const expiredWarningLetter = {
    id: 'wl-expired',
    employee_id: 'emp-1',
    warning_level: WarningLevel.SP1,
    issue_date: new Date('2024-01-01'),
    reason: 'Old issue',
    expiry_date: new Date('2024-07-01'), // Already expired
    status: 'expired',
    content: 'Expired warning',
    issued_by: 'hr-1',
    created_at: new Date('2024-01-01'),
  };

  beforeEach(() => {
    mockPrisma = {
      employee: {
        findUnique: vi.fn(),
      },
      warningLetter: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    mockNotificationService = {
      sendPrivateNotification: vi.fn().mockResolvedValue({}),
      sendPublicAnnouncement: vi.fn().mockResolvedValue({}),
    };

    mockEventBusService = {
      emit: vi.fn().mockResolvedValue({}),
    };

    service = new WarningLetterService(
      mockPrisma as any,
      mockNotificationService as any,
      mockEventBusService as any,
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Requirement 11.3: Never broadcast to public announcement channel
  // ─────────────────────────────────────────────────────────────────────────────
  describe('enforcePrivacyChannel - Req 11.3: Never broadcast to public', () => {
    it('should block "public" channel', () => {
      expect(() => service.enforcePrivacyChannel('public')).toThrow(
        /Privacy violation.*Warning letters cannot be sent via channel/,
      );
    });

    it('should block "public_announcement" channel', () => {
      expect(() => service.enforcePrivacyChannel('public_announcement')).toThrow(
        /Privacy violation/,
      );
    });

    it('should block "broadcast" channel', () => {
      expect(() => service.enforcePrivacyChannel('broadcast')).toThrow(
        /Privacy violation/,
      );
    });

    it('should block channels containing "public" (case-insensitive)', () => {
      expect(() => service.enforcePrivacyChannel('PUBLIC')).toThrow(/Privacy violation/);
      expect(() => service.enforcePrivacyChannel('Public_Channel')).toThrow(/Privacy violation/);
    });

    it('should block channels containing "announcement"', () => {
      expect(() => service.enforcePrivacyChannel('company_announcement')).toThrow(
        /Privacy violation/,
      );
    });

    it('should allow "private" channel', () => {
      expect(() => service.enforcePrivacyChannel('private')).not.toThrow();
    });

    it('should allow "personal" channel', () => {
      expect(() => service.enforcePrivacyChannel('personal')).not.toThrow();
    });

    it('should allow "direct_message" channel', () => {
      expect(() => service.enforcePrivacyChannel('direct_message')).not.toThrow();
    });

    it('should export blocked channels constant', () => {
      expect(WARNING_LETTER_BLOCKED_CHANNELS).toContain('public');
      expect(WARNING_LETTER_BLOCKED_CHANNELS).toContain('public_announcement');
      expect(WARNING_LETTER_BLOCKED_CHANNELS).toContain('broadcast');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Requirement 11.2: Visible only to recipient employee (query access)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('getWarningLettersForEmployee - Req 11.2: Recipient-only access', () => {
    it('should return warning letters when requesting employee is the recipient', async () => {
      mockPrisma.warningLetter.findMany.mockResolvedValue(mockWarningLetters);

      const result = await service.getWarningLettersForEmployee('emp-1', 'emp-1');

      expect(result).toEqual(mockWarningLetters);
      expect(mockPrisma.warningLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ employee_id: 'emp-1' }),
        }),
      );
    });

    it('should throw ForbiddenException when different employee requests access', async () => {
      await expect(
        service.getWarningLettersForEmployee('emp-1', 'emp-2'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.getWarningLettersForEmployee('emp-1', 'emp-2'),
      ).rejects.toThrow(/Access denied.*only visible to the recipient/);
    });

    it('should not call database when access is denied', async () => {
      await expect(
        service.getWarningLettersForEmployee('emp-1', 'other-emp'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.warningLetter.findMany).not.toHaveBeenCalled();
    });

    it('should filter by status when provided', async () => {
      mockPrisma.warningLetter.findMany.mockResolvedValue([mockWarningLetters[0]]);

      await service.getWarningLettersForEmployee('emp-1', 'emp-1', {
        status: 'active',
      });

      expect(mockPrisma.warningLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });

    it('should filter by warning level when provided', async () => {
      mockPrisma.warningLetter.findMany.mockResolvedValue([mockWarningLetters[0]]);

      await service.getWarningLettersForEmployee('emp-1', 'emp-1', {
        warning_level: WarningLevel.SP1,
      });

      expect(mockPrisma.warningLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ warning_level: WarningLevel.SP1 }),
        }),
      );
    });

    it('should order results by issue_date descending', async () => {
      mockPrisma.warningLetter.findMany.mockResolvedValue(mockWarningLetters);

      await service.getWarningLettersForEmployee('emp-1', 'emp-1');

      expect(mockPrisma.warningLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { issue_date: 'desc' },
        }),
      );
    });
  });

  describe('getWarningLetterById - Req 11.2: Recipient-only access', () => {
    it('should return warning letter when requesting employee is the recipient', async () => {
      mockPrisma.warningLetter.findUnique.mockResolvedValue(mockWarningLetters[0]);

      const result = await service.getWarningLetterById('wl-1', 'emp-1');

      expect(result).toEqual(mockWarningLetters[0]);
    });

    it('should throw ForbiddenException when different employee requests access', async () => {
      mockPrisma.warningLetter.findUnique.mockResolvedValue(mockWarningLetters[0]);

      await expect(
        service.getWarningLetterById('wl-1', 'emp-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return null when warning letter does not exist', async () => {
      mockPrisma.warningLetter.findUnique.mockResolvedValue(null);

      const result = await service.getWarningLetterById('non-existent', 'emp-1');

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Requirement 11.6: Multiple warning levels with tracking
  // ─────────────────────────────────────────────────────────────────────────────
  describe('getWarningLevelSummary - Req 11.6: Multiple warning levels', () => {
    it('should return warning level summary for the recipient employee', async () => {
      mockPrisma.warningLetter.findMany.mockResolvedValue(mockWarningLetters);

      const result = await service.getWarningLevelSummary('emp-1', 'emp-1');

      expect(result.employee_id).toBe('emp-1');
      expect(result.total_warnings).toBe(2);
      expect(result.active_count).toBe(2);
      expect(result.expired_count).toBe(0);
      expect(result.active_by_level[WarningLevel.SP1]).toBe(1);
      expect(result.active_by_level[WarningLevel.SP2]).toBe(1);
      expect(result.active_by_level[WarningLevel.SP3]).toBe(0);
    });

    it('should identify highest active warning level', async () => {
      mockPrisma.warningLetter.findMany.mockResolvedValue(mockWarningLetters);

      const result = await service.getWarningLevelSummary('emp-1', 'emp-1');

      expect(result.highest_active_level).toBe(WarningLevel.SP2);
    });

    it('should throw ForbiddenException for non-recipient access', async () => {
      await expect(
        service.getWarningLevelSummary('emp-1', 'emp-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should correctly categorize expired warnings', async () => {
      const warningsWithExpired = [...mockWarningLetters, expiredWarningLetter];
      mockPrisma.warningLetter.findMany.mockResolvedValue(warningsWithExpired);

      const result = await service.getWarningLevelSummary('emp-1', 'emp-1');

      expect(result.total_warnings).toBe(3);
      expect(result.active_count).toBe(2);
      expect(result.expired_count).toBe(1);
    });

    it('should calculate days until expiry for active warnings', async () => {
      mockPrisma.warningLetter.findMany.mockResolvedValue(mockWarningLetters);

      const result = await service.getWarningLevelSummary('emp-1', 'emp-1');

      // Each active warning should have days_until_expiry calculated
      result.warnings.forEach((w: any) => {
        if (w.expiry_date) {
          expect(w.days_until_expiry).toBeGreaterThanOrEqual(0);
          expect(typeof w.days_until_expiry).toBe('number');
        }
      });
    });

    it('should return null highest_active_level when no active warnings', async () => {
      mockPrisma.warningLetter.findMany.mockResolvedValue([expiredWarningLetter]);

      const result = await service.getWarningLevelSummary('emp-1', 'emp-1');

      expect(result.highest_active_level).toBeNull();
      expect(result.active_count).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Requirement 11.7: Track expiration dates per company policy
  // ─────────────────────────────────────────────────────────────────────────────
  describe('processExpiredWarnings - Req 11.7: Expiration tracking', () => {
    it('should mark expired warning letters as expired status', async () => {
      mockPrisma.warningLetter.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.processExpiredWarnings();

      expect(result).toBe(3);
      expect(mockPrisma.warningLetter.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          expiry_date: { lte: expect.any(Date) },
        },
        data: {
          status: WarningLetterStatus.EXPIRED,
          updated_at: expect.any(Date),
        },
      });
    });

    it('should return 0 when no warnings are expired', async () => {
      mockPrisma.warningLetter.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.processExpiredWarnings();

      expect(result).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Integration: Privacy enforcement in the issue flow
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Privacy in issueWarningLetter flow', () => {
    it('should always send via sendPrivateNotification, never public', async () => {
      const mockIssuer = { id: 'hr-1', full_name: 'HR Manager' };
      const createdWarning = {
        id: 'wl-new',
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        issue_date: new Date(),
        reason: 'Test',
        issued_by: 'hr-1',
        expiry_date: sixMonthsFromNow,
        status: 'active',
        content: 'Test warning',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.employee.findUnique
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockIssuer);
      mockPrisma.warningLetter.create.mockResolvedValue(createdWarning);
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Test',
        issued_by: 'hr-1',
        content: 'Test warning',
      });

      // Should use private notification
      expect(mockNotificationService.sendPrivateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient_id: 'emp-1',
          type: 'warning_letter',
        }),
      );

      // Should NEVER use public announcement
      expect(mockNotificationService.sendPublicAnnouncement).not.toHaveBeenCalled();
    });

    it('should emit event with private/confidential metadata', async () => {
      const mockIssuer = { id: 'hr-1', full_name: 'HR Manager' };
      const createdWarning = {
        id: 'wl-new',
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP2,
        issue_date: new Date(),
        reason: 'Policy violation',
        issued_by: 'hr-1',
        expiry_date: sixMonthsFromNow,
        status: 'active',
        content: 'SP2 warning',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.employee.findUnique
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockIssuer);
      mockPrisma.warningLetter.create.mockResolvedValue(createdWarning);
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP2,
        reason: 'Policy violation',
        issued_by: 'hr-1',
        content: 'SP2 warning',
      });

      expect(mockEventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            visibility: 'private',
            confidential: true,
          },
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // WarningLevel enum and WarningLetterStatus enum
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Enums and constants', () => {
    it('should define SP1, SP2, SP3 warning levels', () => {
      expect(WarningLevel.SP1).toBe('SP1');
      expect(WarningLevel.SP2).toBe('SP2');
      expect(WarningLevel.SP3).toBe('SP3');
    });

    it('should define warning letter statuses', () => {
      expect(WarningLetterStatus.ACTIVE).toBe('active');
      expect(WarningLetterStatus.EXPIRED).toBe('expired');
      expect(WarningLetterStatus.REVOKED).toBe('revoked');
    });
  });
});
