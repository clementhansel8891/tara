import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestAgent } from './leave-request.agent';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from '../services/event-bus.service';
import { NotificationService, TaraNotificationType } from '../../../shared/comms/notification.service';

describe('LeaveRequestAgent', () => {
  let agent: LeaveRequestAgent;
  let prismaService: jest.Mocked<PrismaService>;
  let eventBusService: jest.Mocked<EventBusService>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const mockPrismaService = {
      leaveRequest: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      leaveBalance: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      eventBusLog: {
        count: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const mockEventBusService = {
      emit: jest.fn(),
    };

    const mockNotificationService = {
      createTaraNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveRequestAgent,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    agent = module.get<LeaveRequestAgent>(LeaveRequestAgent);
    prismaService = module.get(PrismaService);
    eventBusService = module.get(EventBusService);
    notificationService = module.get(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processLeaveRequestSubmission', () => {
    it('should process leave request and notify supervisor', async () => {
      // Arrange
      const leaveRequestId = 'leave-123';
      const tenantId = 'tenant-1';
      const mockLeaveRequest = {
        id: leaveRequestId,
        tenant_id: tenantId,
        employee_id: 'emp-123',
        leave_type: 'annual',
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-01-20'),
        total_days: 5,
        reason: 'Vacation',
        status: 'pending',
        requested_at: new Date(),
        employee: {
          id: 'emp-123',
          full_name: 'John Doe',
          email: 'john@example.com',
          supervisor_id: 'supervisor-1',
          department_id: 'dept-1',
        },
      };

      prismaService.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest as any);
      eventBusService.emit.mockResolvedValue({} as any);
      notificationService.createTaraNotification.mockResolvedValue({} as any);

      // Act
      await agent.processLeaveRequestSubmission(leaveRequestId, tenantId);

      // Assert
      expect(prismaService.leaveRequest.findUnique).toHaveBeenCalledWith({
        where: { id: leaveRequestId, tenant_id: tenantId },
        include: {
          employee: {
            select: {
              id: true,
              full_name: true,
              email: true,
              supervisor_id: true,
              department_id: true,
            },
          },
        },
      });

      // Verify event was emitted
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'leave.request.submitted',
        })
      );

      // Verify supervisor notification was sent
      expect(notificationService.createTaraNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: tenantId,
          recipient_id: 'supervisor-1',
          notification_type: TaraNotificationType.LEAVE_REQUEST_CONFIRMATION,
          title: 'Permintaan Cuti Membutuhkan Persetujuan',
        })
      );
    });

    it('should handle leave request without supervisor gracefully', async () => {
      // Arrange
      const leaveRequestId = 'leave-123';
      const tenantId = 'tenant-1';
      const mockLeaveRequest = {
        id: leaveRequestId,
        tenant_id: tenantId,
        employee_id: 'emp-123',
        leave_type: 'annual',
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-01-20'),
        total_days: 5,
        reason: 'Vacation',
        status: 'pending',
        requested_at: new Date(),
        employee: {
          id: 'emp-123',
          full_name: 'John Doe',
          email: 'john@example.com',
          supervisor_id: null, // No supervisor
          department_id: 'dept-1',
        },
      };

      prismaService.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest as any);
      eventBusService.emit.mockResolvedValue({} as any);

      // Act
      await agent.processLeaveRequestSubmission(leaveRequestId, tenantId);

      // Assert - should not throw and should emit event
      expect(eventBusService.emit).toHaveBeenCalled();
      // Notification should not be sent if no supervisor
      expect(notificationService.createTaraNotification).not.toHaveBeenCalled();
    });
  });

  describe('processLeaveRequestApproval', () => {
    it('should update leave balance and send confirmation', async () => {
      // Arrange
      const leaveRequestId = 'leave-123';
      const tenantId = 'tenant-1';
      const approvedBy = 'supervisor-1';
      const currentYear = new Date().getFullYear();

      const mockLeaveRequest = {
        id: leaveRequestId,
        tenant_id: tenantId,
        employee_id: 'emp-123',
        leave_type: 'annual',
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-01-20'),
        total_days: 5,
        reason: 'Vacation',
        status: 'approved',
        reviewed_at: new Date(),
        employee: {
          id: 'emp-123',
          full_name: 'John Doe',
          email: 'john@example.com',
        },
      };

      const mockLeaveBalance = {
        employee_id: 'emp-123',
        year: currentYear,
        total_entitlement: 12,
        used_days: 3,
        remaining_days: 9,
        carryover_days: 0,
      };

      prismaService.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest as any);
      prismaService.leaveBalance.findUnique.mockResolvedValue(mockLeaveBalance as any);
      prismaService.leaveBalance.update.mockResolvedValue({
        ...mockLeaveBalance,
        used_days: 8,
        remaining_days: 4,
      } as any);
      eventBusService.emit.mockResolvedValue({} as any);
      notificationService.createTaraNotification.mockResolvedValue({} as any);

      // Act
      await agent.processLeaveRequestApproval(leaveRequestId, tenantId, approvedBy);

      // Assert
      // Verify balance was updated
      expect(prismaService.leaveBalance.update).toHaveBeenCalledWith({
        where: {
          employee_id_year: {
            employee_id: 'emp-123',
            year: currentYear,
          },
        },
        data: {
          used_days: 8, // 3 + 5
          remaining_days: 4, // 9 - 5
          last_calculated_at: expect.any(Date),
          updated_at: expect.any(Date),
        },
      });

      // Verify approval event was emitted
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'leave.request.approved',
        })
      );
