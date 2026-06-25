import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import {
  WarningLetterService,
  WarningLevel,
  WarningLetterStatus,
  WARNING_LETTER_BLOCKED_CHANNELS,
} from './warning-letter.service';

/**
 * Consolidated Unit Tests for WarningLetterService
 * Task 21.3: Write unit tests for warning letters
 *
 * Covers:
 * 1. Private delivery to recipient only (Req 11.1, 11.2)
 * 2. Visibility restrictions - no public broadcast (Req 11.3)
 * 3. Expiration date tracking (Req 11.7)
 * 4. Audit logging of issuance (Req 11.4, 11.5)
 */
describe('WarningLetterService (Task 21.3)', () => {
  let service: WarningLetterService;
  let mockPrisma: any;
  let mockNotificationService: any;
  let mockEventBusService: any;

  const mockEmployee = { id: 'emp-1', full_name: 'John Doe' };
  const mockIssuer = { id: 'hr-1', full_name: 'HR Manager' };

  const now = new Date('2025-06-15T10:00:00Z');
  const sixMonthsFromNow = new Date('2025-12-15T10:00:00Z');

  const mockWarningLetter = {
    id: 'wl-1',
    employee_id: 'emp-1',
    warning_level: 'SP1',
    issue_date: now,
    reason: 'Repeated tardiness',
    issued_by: 'hr-1',
    expiry_date: sixMonthsFromNow,
    status: 'active',
    content: 'This is a formal warning for repeated tardiness.',
    created_at: now,
    updated_at: now,
  };

  beforeEach(() => {
    mockPrisma = {
      employee: { findUnique: vi.fn() },
      warningLetter: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      auditLog: { create: vi.fn() },
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1. Private delivery to recipient only (Req 11.1, 11.2)
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('Private delivery to recipient only', () => {
    beforeEach(() => {
      mockPrisma.employee.findUnique
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockIssuer);
      mockPrisma.warningLetter.create.mockResolvedValue(mockWarningLetter);
      mockPrisma.auditLog.create.mockResolvedValue({});
    });

    it('should send notification via sendPrivateNotification (Req 11.1)', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'This is a formal warning for repeated tardiness.',
      });

      expect(mockNotificationService.sendPrivateNotification).toHaveBeenCalledTimes(1);
    });

    it('should send notification only to the recipient employee (Req 11.2)', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'This is a formal warning for repeated tardiness.',
      });

      expect(mockNotificationService.sendPrivateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient_id: 'emp-1',
          type: 'warning_letter',
        }),
      );
    });

    it('should never call sendPublicAnnouncement during issuance', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'This is a formal warning for repeated tardiness.',
      });

      expect(mockNotificationService.sendPublicAnnouncement).not.toHaveBeenCalled();
    });

    it('should include warning letter metadata in the private notification', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'This is a formal warning for repeated tardiness.',
      });

      expect(mockNotificationService.sendPrivateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Surat Peringatan SP1',
          content: 'This is a formal warning for repeated tardiness.',
          metadata: expect.objectContaining({
            warning_letter_id: 'wl-1',
            warning_level: 'SP1',
            issue_date: now,
            reason: 'Repeated tardiness',
          }),
        }),
      );
    });

    it('should emit event with private/confidential metadata', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP2,
        reason: 'Policy violation',
        issued_by: 'hr-1',
        content: 'SP2 warning content',
      });

      expect(mockEventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { visibility: 'private', confidential: true },
        }),
      );
    });

    it('should restrict getWarningLettersForEmployee to the recipient only', async () => {
      await expect(
        service.getWarningLettersForEmployee('emp-1', 'emp-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow recipient to view their own warning letters', async () => {
      mockPrisma.warningLetter.findMany.mockResolvedValue([mockWarningLetter]);

      const result = await service.getWarningLettersForEmployee('emp-1', 'emp-1');
      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe('emp-1');
    });

    it('should restrict getWarningLetterById to the recipient only', async () => {
      mockPrisma.warningLetter.findUnique.mockResolvedValue(mockWarningLetter);

      await expect(
        service.getWarningLetterById('wl-1', 'emp-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should restrict getWarningLevelSummary to the recipient only', async () => {
      await expect(
        service.getWarningLevelSummary('emp-1', 'emp-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should not query the database if access is denied', async () => {
      await expect(
        service.getWarningLettersForEmployee('emp-1', 'other-emp'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.warningLetter.findMany).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2. Visibility restrictions - no public broadcast (Req 11.3)
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('Visibility restrictions (no public broadcast)', () => {
    it('should block "public" channel', () => {
      expect(() => service.enforcePrivacyChannel('public')).toThrow(
        /Privacy violation/,
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

    it('should block channels containing "public" case-insensitively', () => {
      expect(() => service.enforcePrivacyChannel('PUBLIC')).toThrow(/Privacy violation/);
      expect(() => service.enforcePrivacyChannel('Public_Feed')).toThrow(/Privacy violation/);
      expect(() => service.enforcePrivacyChannel('all_public')).toThrow(/Privacy violation/);
    });

    it('should block channels containing "announcement"', () => {
      expect(() => service.enforcePrivacyChannel('company_announcement')).toThrow(
        /Privacy violation/,
      );
      expect(() => service.enforcePrivacyChannel('ANNOUNCEMENT_board')).toThrow(
        /Privacy violation/,
      );
    });

    it('should block channels containing "broadcast"', () => {
      expect(() => service.enforcePrivacyChannel('team_broadcast')).toThrow(
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

    it('should export the blocked channels constant with correct values', () => {
      expect(WARNING_LETTER_BLOCKED_CHANNELS).toContain('public');
      expect(WARNING_LETTER_BLOCKED_CHANNELS).toContain('public_announcement');
      expect(WARNING_LETTER_BLOCKED_CHANNELS).toContain('broadcast');
      expect(WARNING_LETTER_BLOCKED_CHANNELS).toHaveLength(3);
    });

    it('should provide an error message mentioning privacy violation', () => {
      try {
        service.enforcePrivacyChannel('public');
      } catch (e: any) {
        expect(e.message).toContain('Privacy violation');
        expect(e.message).toContain('Warning letters cannot be sent via channel');
        expect(e.message).toContain('strictly private');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3. Expiration date tracking (Req 11.7)
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('Expiration date tracking', () => {
    beforeEach(() => {
      mockPrisma.employee.findUnique
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockIssuer);
      mockPrisma.auditLog.create.mockResolvedValue({});
    });

    it('should set SP1 expiry to 6 months from issue date', async () => {
      mockPrisma.warningLetter.create.mockImplementation(async (args: any) => ({
        ...args.data,
        id: 'wl-sp1',
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const result = await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Tardiness',
        issued_by: 'hr-1',
        content: 'SP1 warning',
      });

      const issueDate = new Date(result.issue_date);
      const expiryDate = new Date(result.expiry_date);
      const monthsDiff =
        (expiryDate.getFullYear() - issueDate.getFullYear()) * 12 +
        (expiryDate.getMonth() - issueDate.getMonth());
      expect(monthsDiff).toBe(6);
    });

    it('should set SP2 expiry to 9 months from issue date', async () => {
      mockPrisma.employee.findUnique.mockReset();
      mockPrisma.employee.findUnique
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockIssuer);
      mockPrisma.warningLetter.create.mockImplementation(async (args: any) => ({
        ...args.data,
        id: 'wl-sp2',
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const result = await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP2,
        reason: 'Continued violation',
        issued_by: 'hr-1',
        content: 'SP2 warning',
      });

      const issueDate = new Date(result.issue_date);
      const expiryDate = new Date(result.expiry_date);
      const monthsDiff =
        (expiryDate.getFullYear() - issueDate.getFullYear()) * 12 +
        (expiryDate.getMonth() - issueDate.getMonth());
      expect(monthsDiff).toBe(9);
    });

    it('should set SP3 expiry to 12 months from issue date', async () => {
      mockPrisma.employee.findUnique.mockReset();
      mockPrisma.employee.findUnique
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockIssuer);
      mockPrisma.warningLetter.create.mockImplementation(async (args: any) => ({
        ...args.data,
        id: 'wl-sp3',
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const result = await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP3,
        reason: 'Severe policy violation',
        issued_by: 'hr-1',
        content: 'SP3 warning',
      });

      const issueDate = new Date(result.issue_date);
      const expiryDate = new Date(result.expiry_date);
      const monthsDiff =
        (expiryDate.getFullYear() - issueDate.getFullYear()) * 12 +
        (expiryDate.getMonth() - issueDate.getMonth());
      expect(monthsDiff).toBe(12);
    });

    it('should mark expired warnings via processExpiredWarnings', async () => {
      mockPrisma.warningLetter.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.processExpiredWarnings();

      expect(result).toBe(2);
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

    it('should return 0 when no warnings have expired', async () => {
      mockPrisma.warningLetter.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.processExpiredWarnings();
      expect(result).toBe(0);
    });

    it('should track nearest expiry in warning level summary', async () => {
      const futureDate1 = new Date();
      futureDate1.setMonth(futureDate1.getMonth() + 2); // 2 months from now
      const futureDate2 = new Date();
      futureDate2.setMonth(futureDate2.getMonth() + 5); // 5 months from now
      const warnings = [
        {
          id: 'wl-a',
          warning_level: WarningLevel.SP1,
          issue_date: new Date(),
          expiry_date: futureDate1,
          status: 'active',
        },
        {
          id: 'wl-b',
          warning_level: WarningLevel.SP2,
          issue_date: new Date(),
          expiry_date: futureDate2,
          status: 'active',
        },
      ];
      mockPrisma.warningLetter.findMany.mockResolvedValue(warnings);

      const summary = await service.getWarningLevelSummary('emp-1', 'emp-1');

      expect(summary.nearest_expiry_date).toEqual(futureDate1);
    });

    it('should calculate days_until_expiry for each active warning', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
      const warnings = [
        {
          id: 'wl-days',
          warning_level: WarningLevel.SP1,
          issue_date: new Date(),
          expiry_date: futureDate,
          status: 'active',
        },
      ];
      mockPrisma.warningLetter.findMany.mockResolvedValue(warnings);

      const summary = await service.getWarningLevelSummary('emp-1', 'emp-1');

      expect(summary.warnings).toHaveLength(1);
      expect(summary.warnings[0].days_until_expiry).toBeGreaterThanOrEqual(29);
      expect(summary.warnings[0].days_until_expiry).toBeLessThanOrEqual(31);
    });

    it('should categorize expired warnings separately from active', async () => {
      const pastDate = new Date('2024-01-01');
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);
      const warnings = [
        {
          id: 'wl-active',
          warning_level: WarningLevel.SP1,
          issue_date: new Date(),
          expiry_date: futureDate,
          status: 'active',
        },
        {
          id: 'wl-expired',
          warning_level: WarningLevel.SP1,
          issue_date: new Date('2023-06-01'),
          expiry_date: pastDate,
          status: 'expired',
        },
      ];
      mockPrisma.warningLetter.findMany.mockResolvedValue(warnings);

      const summary = await service.getWarningLevelSummary('emp-1', 'emp-1');

      expect(summary.active_count).toBe(1);
      expect(summary.expired_count).toBe(1);
      expect(summary.total_warnings).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 4. Audit logging of issuance (Req 11.4, 11.5)
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('Audit logging of issuance', () => {
    beforeEach(() => {
      mockPrisma.employee.findUnique
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockIssuer);
      mockPrisma.warningLetter.create.mockResolvedValue(mockWarningLetter);
      mockPrisma.auditLog.create.mockResolvedValue({});
    });

    it('should create an audit log entry on issuance (Req 11.4)', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'Formal warning content',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
    });

    it('should log action_type as warning_letter_issued', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'Formal warning content',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action_type: 'warning_letter_issued',
        }),
      });
    });

    it('should record the issuing HR personnel as actor (Req 11.5)', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'Formal warning content',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actor_id: 'hr-1',
          actor_role: 'hr_team',
        }),
      });
    });

    it('should include date, reason, and issuer in the changes field (Req 11.5)', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'Formal warning content',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes: expect.objectContaining({
            employee_id: 'emp-1',
            warning_level: 'SP1',
            issue_date: now,
            reason: 'Repeated tardiness',
            issued_by: 'hr-1',
            expiry_date: sixMonthsFromNow,
          }),
        }),
      });
    });

    it('should set target entity to the warning letter record', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'Formal warning content',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          target_entity_type: 'warning_letter',
          target_entity_id: 'wl-1',
        }),
      });
    });

    it('should set action_context to administrative', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'Formal warning content',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action_context: 'administrative',
        }),
      });
    });

    it('should emit warning_letter.issued event to Event Bus', async () => {
      await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Repeated tardiness',
        issued_by: 'hr-1',
        content: 'Formal warning content',
      });

      expect(mockEventBusService.emit).toHaveBeenCalledWith({
        event_type: 'warning_letter.issued',
        actor: { id: 'hr-1', type: 'employee' },
        entity: { id: 'wl-1', type: 'warning_letter' },
        payload: expect.objectContaining({
          recipient_id: 'emp-1',
          warning_level: 'SP1',
          reason: 'Repeated tardiness',
        }),
        metadata: { visibility: 'private', confidential: true },
      });
    });

    it('should still create the warning letter even if audit log fails', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('DB error'));

      const result = await service.issueWarningLetter({
        employee_id: 'emp-1',
        warning_level: WarningLevel.SP1,
        reason: 'Test',
        issued_by: 'hr-1',
        content: 'Content',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('wl-1');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Input validation
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('Input validation', () => {
    it('should throw error for invalid warning level', async () => {
      await expect(
        service.issueWarningLetter({
          employee_id: 'emp-1',
          warning_level: 'SP4',
          reason: 'Test',
          issued_by: 'hr-1',
          content: 'Test content',
        }),
      ).rejects.toThrow('Invalid warning level: SP4');
    });

    it('should throw error if employee not found', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.issueWarningLetter({
          employee_id: 'non-existent',
          warning_level: WarningLevel.SP1,
          reason: 'Test',
          issued_by: 'hr-1',
          content: 'Test content',
        }),
      ).rejects.toThrow('Employee not found: non-existent');
    });

    it('should throw error if issuer not found', async () => {
      mockPrisma.employee.findUnique
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(null);

      await expect(
        service.issueWarningLetter({
          employee_id: 'emp-1',
          warning_level: WarningLevel.SP1,
          reason: 'Test',
          issued_by: 'non-existent',
          content: 'Test content',
        }),
      ).rejects.toThrow('Issuer (HR personnel) not found: non-existent');
    });
  });
});
