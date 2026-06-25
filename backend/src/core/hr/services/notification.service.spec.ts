import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService, TaraNotificationType, NotificationVisibility, NOTIFICATION_PRIVACY_RULES } from './notification.service';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventStreamGateway } from '../events/event-stream.gateway';

/**
 * Unit Tests for NotificationService
 * Task 13.2: Notification Privacy Rules
 * 
 * Tests automatic privacy rule enforcement:
 * - Tardiness notifications as Public_Announcements (Req 9.1)
 * - Warning letters as Private_Notifications (Req 9.2)
 * - Clock confirmations as Private_Notifications (Req 9.3)
 * - Weekly attendance recaps sent only to HR_Team (Req 9.4)
 * - Privacy rule validation and enforcement
 */
describe('NotificationService - Privacy Rules (Task 13.2)', () => {
  let service: NotificationService;
  let prisma: PrismaService;
  let eventGateway: EventStreamGateway;

  const mockEmployee = {
    id: 'employee-1',
    full_name: 'John Doe',
    email: 'john@example.com',
  };

  const mockHREmployee = {
    id: 'hr-1',
    full_name: 'HR Manager',
    email: 'hr@example.com',
    role: { role_name: 'hr_team' },
  };

  const mockNotification = {
    id: 'notif-1',
    recipient_id: 'employee-1',
    notification_type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
    visibility: NotificationVisibility.PRIVATE,
    title: 'Clock In Confirmed',
    content: 'You clocked in at 08:00',
    is_read: false,
    metadata: null,
    created_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: {
            employee: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            notification: {
              create: jest.fn(),
              createManyAndReturn: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: EventStreamGateway,
          useValue: {
            broadcastEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get<PrismaService>(PrismaService);
    eventGateway = module.get<EventStreamGateway>(EventStreamGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Privacy Rule Enforcement', () => {
    it('should enforce tardiness notifications as PUBLIC (Req 9.1)', async () => {
      jest.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployee as any);
      jest.spyOn(prisma.notification, 'create').mockResolvedValue({
        ...mockNotification,
        notification_type: TaraNotificationType.TARDINESS_REPORT,
        visibility: NotificationVisibility.PUBLIC,
      } as any);

      const result = await service.sendNotification({
        recipient_id: 'employee-1',
        type: TaraNotificationType.TARDINESS_REPORT,
        title: 'Tardiness Report',
        content: 'Daily tardiness report',
      });

      expect(result.visibility).toBe(NotificationVisibility.PUBLIC);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          visibility: NotificationVisibility.PUBLIC,
          notification_type: TaraNotificationType.TARDINESS_REPORT,
        }),
      });
    });

    it('should enforce warning letters as PRIVATE (Req 9.2)', async () => {
      jest.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployee as any);
      jest.spyOn(prisma.notification, 'create').mockResolvedValue({
        ...mockNotification,
        notification_type: TaraNotificationType.WARNING_LETTER,
        visibility: NotificationVisibility.PRIVATE,
      } as any);

      const result = await service.sendNotification({
        recipient_id: 'employee-1',
        type: TaraNotificationType.WARNING_LETTER,
        title: 'Warning Letter',
        content: 'Official warning letter content',
      });

      expect(result.visibility).toBe(NotificationVisibility.PRIVATE);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          visibility: NotificationVisibility.PRIVATE,
          notification_type: TaraNotificationType.WARNING_LETTER,
        }),
      });
    });

    it('should enforce clock confirmations as PRIVATE (Req 9.3)', async () => {
      jest.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployee as any);
      jest.spyOn(prisma.notification, 'create').mockResolvedValue({
        ...mockNotification,
        notification_type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
        visibility: NotificationVisibility.PRIVATE,
      } as any);

      const result = await service.sendNotification({
        recipient_id: 'employee-1',
        type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
        title: 'Clock In Confirmed',
        content: 'You clocked in at 08:00',
      });

      expect(result.visibility).toBe(NotificationVisibility.PRIVATE);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          visibility: NotificationVisibility.PRIVATE,
          notification_type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
        }),
      });
    });

    it('should enforce weekly attendance recap as HR_TEAM_ONLY (Req 9.4)', async () => {
      jest.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockHREmployee as any);
      jest.spyOn(prisma.notification, 'create').mockResolvedValue({
        ...mockNotification,
        notification_type: TaraNotificationType.WEEKLY_ATTENDANCE_RECAP,
        visibility: NotificationVisibility.HR_TEAM_ONLY,
      } as any);

      const result = await service.sendNotification({
        recipient_id: 'hr-1',
        type: TaraNotificationType.WEEKLY_ATTENDANCE_RECAP,
        title: 'Weekly Attendance Recap',
        content: 'Attendance summary for the week',
      });

      expect(result.visibility).toBe(NotificationVisibility.HR_TEAM_ONLY);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          visibility: NotificationVisibility.HR_TEAM_ONLY,
          notification_type: TaraNotificationType.WEEKLY_ATTENDANCE_RECAP,
        }),
      });
    });

    it('should reject manual visibility override that violates privacy rules', async () => {
      jest.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployee as any);

      // Try to send warning letter as public (should fail)
      await expect(
        service.sendNotification({
          recipient_id: 'employee-1',
          type: TaraNotificationType.WARNING_LETTER,
          visibility: 'public', // Attempting to override to public
          title: 'Warning Letter',
          content: 'Content',
        })
      ).rejects.toThrow(/Privacy rule violation/);
    });

    it('should default unknown notification types to PRIVATE', async () => {
      jest.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployee as any);
      jest.spyOn(prisma.notification, 'create').mockResolvedValue({
        ...mockNotification,
        notification_type: 'unknown_type',
        visibility: NotificationVisibility.PRIVATE,
      } as any);

      const result = await service.sendNotification({
        recipient_id: 'employee-1',
        type: 'unknown_type',
        title: 'Unknown Notification',
        content: 'Some content',
      });

      expect(result.visibility).toBe(NotificationVisibility.PRIVATE);
    });
  });

  describe('sendPublicAnnouncement', () => {
    it('should send public announcement only for PUBLIC notification types (Req 9.1)', async () => {
      const employees = [
        { id: 'emp-1', full_name: 'Emp One' },
        { id: 'emp-2', full_name: 'Emp Two' },
        { id: 'emp-3', full_name: 'Emp Three' },
      ];

      jest.spyOn(prisma.employee, 'findMany').mockResolvedValue(employees as any);
      jest.spyOn(prisma.notification, 'createManyAndReturn').mockResolvedValue(
        employees.map((e, i) => ({
          ...mockNotification,
          id: `notif-${i + 1}`,
          recipient_id: e.id,
        })) as any,
      );

      const result = await service.sendPublicAnnouncement({
        type: TaraNotificationType.TARDINESS_REPORT,
        title: 'Daily Tardiness Report',
        content: '3 employees were late today',
      });

      expect(result).toHaveLength(3);
      // Bulk path issues a single bulk insert instead of one create per recipient (Req 18.3)
      expect(prisma.notification.createManyAndReturn).toHaveBeenCalledTimes(1);
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('should reject public announcement for PRIVATE notification types (Req 9.2)', async () => {
      await expect(
        service.sendPublicAnnouncement({
          type: TaraNotificationType.WARNING_LETTER,
          title: 'Warning Letter',
          content: 'Content',
        })
      ).rejects.toThrow(/Cannot send.*as public announcement/);
    });

    it('should reject public announcement for HR_TEAM_ONLY notification types (Req 9.4)', async () => {
      await expect(
        service.sendPublicAnnouncement({
          type: TaraNotificationType.WEEKLY_ATTENDANCE_RECAP,
          title: 'Weekly Recap',
          content: 'Content',
        })
      ).rejects.toThrow(/Cannot send.*as public announcement/);
    });
  });

  describe('sendPrivateNotification', () => {
    it('should send private notification for PRIVATE notification types (Req 9.3)', async () => {
      jest.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployee as any);
      jest.spyOn(prisma.notification, 'create').mockResolvedValue(mockNotification as any);

      const result = await service.sendPrivateNotification({
        recipient_id: 'employee-1',
        type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
        title: 'Clock In Confirmed',
        content: 'You clocked in at 08:00',
      });

      expect(result).toBeDefined();
      expect(result.visibility).toBe(NotificationVisibility.PRIVATE);
    });

    it('should reject private notification for PUBLIC notification types', async () => {
      await expect(
        service.sendPrivateNotification({
          recipient_id: 'employee-1',
          type: TaraNotificationType.TARDINESS_REPORT,
          title: 'Tardiness Report',
          content: 'Content',
        })
      ).rejects.toThrow(/Cannot send.*as private notification/);
    });
  });

  describe('sendHRTeamNotification', () => {
    it('should send to HR Team members only for HR_TEAM_ONLY types (Req 9.4)', async () => {
      const hrMembers = [
        { id: 'hr-1', full_name: 'HR Manager 1', role: { role_name: 'hr_team' } },
        { id: 'hr-2', full_name: 'HR Manager 2', role: { role_name: 'hr_team' } },
      ];

      jest.spyOn(prisma.employee, 'findMany').mockResolvedValue(hrMembers as any);
      jest.spyOn(prisma.notification, 'createManyAndReturn').mockResolvedValue(
        hrMembers.map((m, i) => ({
          ...mockNotification,
          id: `notif-${i + 1}`,
          recipient_id: m.id,
        })) as any,
      );

      const result = await service.sendHRTeamNotification({
        type: TaraNotificationType.WEEKLY_ATTENDANCE_RECAP,
        title: 'Weekly Attendance Recap',
        content: 'Attendance summary for the week',
      });

      expect(result).toHaveLength(2);
      expect(prisma.notification.createManyAndReturn).toHaveBeenCalledTimes(1);
    });

    it('should include supervisors when requested (Req 9.5)', async () => {
      const hrAndSupervisors = [
        { id: 'hr-1', full_name: 'HR Manager', role: { role_name: 'hr_team' } },
        { id: 'sup-1', full_name: 'Supervisor', role: { role_name: 'supervisor' } },
      ];

      jest.spyOn(prisma.employee, 'findMany').mockResolvedValue(hrAndSupervisors as any);
      jest.spyOn(prisma.notification, 'createManyAndReturn').mockResolvedValue(
        hrAndSupervisors.map((m, i) => ({
          ...mockNotification,
          id: `notif-${i + 1}`,
          recipient_id: m.id,
        })) as any,
      );

      const result = await service.sendHRTeamNotification({
        type: TaraNotificationType.WEEKLY_CHECKIN_REPORT,
        title: 'Weekly Check-in Report',
        content: 'Productivity summary',
        include_supervisors: true,
      });

      expect(result).toHaveLength(2);
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: {
              role_name: { in: ['hr_team', 'supervisor'] },
            },
          }),
        })
      );
    });

    it('should reject HR Team notification for non-HR_TEAM_ONLY types', async () => {
      await expect(
        service.sendHRTeamNotification({
          type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
          title: 'Clock In',
          content: 'Content',
        })
      ).rejects.toThrow(/Cannot send.*as HR Team notification/);
    });
  });

  describe('Privacy Rule Configuration', () => {
    it('should have all TARA notification types defined in privacy rules', () => {
      const allTypes = Object.values(TaraNotificationType);
      const definedTypes = Object.keys(NOTIFICATION_PRIVACY_RULES);

      allTypes.forEach(type => {
        expect(definedTypes).toContain(type);
      });
    });

    it('should have valid visibility values for all privacy rules', () => {
      const validVisibilities = Object.values(NotificationVisibility);
      
      Object.values(NOTIFICATION_PRIVACY_RULES).forEach(visibility => {
        expect(validVisibilities).toContain(visibility);
      });
    });

    it('should classify notification types correctly', () => {
      // Public types
      expect(NOTIFICATION_PRIVACY_RULES[TaraNotificationType.TARDINESS_REPORT])
        .toBe(NotificationVisibility.PUBLIC);
      expect(NOTIFICATION_PRIVACY_RULES[TaraNotificationType.ATTENDANCE_ANNOUNCEMENT])
        .toBe(NotificationVisibility.PUBLIC);

      // Private types
      expect(NOTIFICATION_PRIVACY_RULES[TaraNotificationType.CLOCK_IN_CONFIRMATION])
        .toBe(NotificationVisibility.PRIVATE);
      expect(NOTIFICATION_PRIVACY_RULES[TaraNotificationType.CLOCK_OUT_CONFIRMATION])
        .toBe(NotificationVisibility.PRIVATE);
      expect(NOTIFICATION_PRIVACY_RULES[TaraNotificationType.WARNING_LETTER])
        .toBe(NotificationVisibility.PRIVATE);

      // HR Team only types
      expect(NOTIFICATION_PRIVACY_RULES[TaraNotificationType.WEEKLY_ATTENDANCE_RECAP])
        .toBe(NotificationVisibility.HR_TEAM_ONLY);
      expect(NOTIFICATION_PRIVACY_RULES[TaraNotificationType.WEEKLY_CHECKIN_REPORT])
        .toBe(NotificationVisibility.HR_TEAM_ONLY);
    });
  });

  describe('Real-time Delivery', () => {
    it('should deliver notifications in real-time via WebSocket', async () => {
      jest.spyOn(prisma.employee, 'findUnique').mockResolvedValue(mockEmployee as any);
      jest.spyOn(prisma.notification, 'create').mockResolvedValue(mockNotification as any);
      jest.spyOn(eventGateway, 'broadcastEvent');

      await service.sendNotification({
        recipient_id: 'employee-1',
        type: TaraNotificationType.CLOCK_IN_CONFIRMATION,
        title: 'Clock In Confirmed',
        content: 'You clocked in at 08:00',
      });

      expect(eventGateway.broadcastEvent).toHaveBeenCalledWith(
        'notification.sent',
        expect.objectContaining({
          event_type: 'notification.sent',
          payload: expect.objectContaining({
            notification_id: mockNotification.id,
            recipient_id: mockEmployee.id,
            visibility: NotificationVisibility.PRIVATE,
          }),
        })
      );
    });
  });
});
