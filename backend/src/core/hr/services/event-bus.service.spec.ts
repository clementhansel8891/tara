import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBusService, TaraEvent } from './event-bus.service';
import { PrismaService } from '../../../persistence/prisma.service';
import * as fc from 'fast-check';

describe('EventBusService', () => {
  let service: EventBusService;
  let mockPrismaService: any;

  beforeEach(() => {
    // Create mock Prisma service
    mockPrismaService = {
      eventBusLog: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
      },
    };

    // Create service instance with mock
    service = new EventBusService(mockPrismaService as PrismaService);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('emit', () => {
    it('should emit a valid TaraEvent and store in EventBusLog', async () => {
      const event: Partial<TaraEvent> = {
        event_type: 'leave.request.submitted',
        actor: {
          id: 'emp-123',
          type: 'employee',
        },
        entity: {
          id: 'leave-456',
          type: 'leave_request',
        },
        payload: {
          leave_type: 'annual',
          start_date: '2024-01-15',
          end_date: '2024-01-20',
          total_days: 5,
        },
      };

      const mockEventLog = {
        id: 'event-uuid',
        event_type: 'leave.request.submitted',
        event_version: '1.0',
        actor_id: 'emp-123',
        actor_type: 'employee',
        entity_id: 'leave-456',
        entity_type: 'leave_request',
        event_payload: event.payload,
        event_timestamp: new Date(),
        delivery_status: 'pending',
        retry_count: 0,
      };

      mockPrismaService.eventBusLog.create.mockResolvedValue(mockEventLog);
      mockPrismaService.eventBusLog.update.mockResolvedValue({
        ...mockEventLog,
        delivery_status: 'delivered',
      });

      const result = await service.emit(event);

      expect(mockPrismaService.eventBusLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: 'leave.request.submitted',
          actor_id: 'emp-123',
          actor_type: 'employee',
          entity_id: 'leave-456',
          entity_type: 'leave_request',
          event_payload: event.payload,
          event_version: '1.0',
          delivery_status: 'pending',
          retry_count: 0,
        }),
      });

      expect(result).toEqual(mockEventLog);
    });

    it('should generate event_id if not provided', async () => {
      const event: Partial<TaraEvent> = {
        event_type: 'attendance.clock_in',
        actor: { id: 'emp-123', type: 'employee' },
        entity: { id: 'att-789', type: 'attendance' },
        payload: { timestamp: '2024-01-15T08:00:00Z' },
      };

      mockPrismaService.eventBusLog.create.mockResolvedValue({
        id: expect.any(String),
        ...event,
      });
      mockPrismaService.eventBusLog.update.mockResolvedValue({});

      await service.emit(event);

      expect(mockPrismaService.eventBusLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
        }),
      });
    });

    it('should set default event_version to 1.0 if not provided', async () => {
      const event: Partial<TaraEvent> = {
        event_type: 'attendance.clock_in',
        actor: { id: 'emp-123', type: 'employee' },
        entity: { id: 'att-789', type: 'attendance' },
        payload: {},
      };

      mockPrismaService.eventBusLog.create.mockResolvedValue({});
      mockPrismaService.eventBusLog.update.mockResolvedValue({});

      await service.emit(event);

      expect(mockPrismaService.eventBusLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_version: '1.0',
        }),
      });
    });

    it('should throw error if event_type is missing', async () => {
      const event: Partial<TaraEvent> = {
        actor: { id: 'emp-123', type: 'employee' },
        entity: { id: 'att-789', type: 'attendance' },
        payload: {},
      };

      await expect(service.emit(event)).rejects.toThrow(
        'event_type is required',
      );
    });

    it('should throw error if actor is missing', async () => {
      const event: Partial<TaraEvent> = {
        event_type: 'attendance.clock_in',
        entity: { id: 'att-789', type: 'attendance' },
        payload: {},
      };

      await expect(service.emit(event)).rejects.toThrow(
        'actor with id and type is required',
      );
    });

    it('should throw error if entity is missing', async () => {
      const event: Partial<TaraEvent> = {
        event_type: 'attendance.clock_in',
        actor: { id: 'emp-123', type: 'employee' },
        payload: {},
      };

      await expect(service.emit(event)).rejects.toThrow(
        'entity with id and type is required',
      );
    });

    it('should throw error if payload is missing', async () => {
      const event: Partial<TaraEvent> = {
        event_type: 'attendance.clock_in',
        actor: { id: 'emp-123', type: 'employee' },
        entity: { id: 'att-789', type: 'attendance' },
      };

      await expect(service.emit(event)).rejects.toThrow('payload is required');
    });

    it('should mark event as delivered after creation', async () => {
      const event: Partial<TaraEvent> = {
        event_type: 'leave.request.approved',
        actor: { id: 'agent-leave', type: 'agent' },
        entity: { id: 'leave-456', type: 'leave_request' },
        payload: { approved_by: 'supervisor-123' },
      };

      const mockEventLog = {
        id: 'event-uuid',
        event_type: 'leave.request.approved',
        delivery_status: 'pending',
      };

      mockPrismaService.eventBusLog.create.mockResolvedValue(mockEventLog);
      mockPrismaService.eventBusLog.update.mockResolvedValue({
        ...mockEventLog,
        delivery_status: 'delivered',
      });

      await service.emit(event);

      expect(mockPrismaService.eventBusLog.update).toHaveBeenCalledWith({
        where: { id: expect.any(String) },
        data: {
          delivery_status: 'delivered',
          published_at: expect.any(Date),
        },
      });
    });
  });

  describe('markAsFailed', () => {
    it('should mark event as failed and increment retry_count', async () => {
      const event_id = 'event-123';
      const mockEvent = {
        id: event_id,
        retry_count: 2,
        delivery_status: 'pending',
      };

      mockPrismaService.eventBusLog.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.eventBusLog.update.mockResolvedValue({
        ...mockEvent,
        delivery_status: 'failed',
        retry_count: 3,
      });

      await service.markAsFailed(event_id, 'Network timeout');

      expect(mockPrismaService.eventBusLog.update).toHaveBeenCalledWith({
        where: { id: event_id },
        data: {
          delivery_status: 'failed',
          retry_count: 3,
        },
      });
    });

    it('should throw error if event not found', async () => {
      const event_id = 'non-existent';

      mockPrismaService.eventBusLog.findUnique.mockResolvedValue(null);

      await expect(service.markAsFailed(event_id)).rejects.toThrow(
        `Event ${event_id} not found`,
      );
    });
  });

  describe('getEventsForEmployee', () => {
    it('should retrieve events for a specific employee ordered chronologically', async () => {
      const employeeId = 'emp-123';
      const mockEvents = [
        {
          id: 'event-1',
          event_type: 'attendance.clock_in',
          actor_id: employeeId,
          event_timestamp: new Date('2024-01-15T08:00:00Z'),
        },
        {
          id: 'event-2',
          event_type: 'leave.request.submitted',
          actor_id: employeeId,
          event_timestamp: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockPrismaService.eventBusLog.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsForEmployee(employeeId);

      expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { actor_id: employeeId },
            { entity_id: employeeId, entity_type: 'employee' },
          ],
        },
        orderBy: { event_timestamp: 'asc' },
        take: 100,
        skip: 0,
      });

      expect(result).toEqual(mockEvents);
    });

    it('should filter by event_type when provided', async () => {
      const employeeId = 'emp-123';
      const event_type = 'attendance.clock_in';

      mockPrismaService.eventBusLog.findMany.mockResolvedValue([]);

      await service.getEventsForEmployee(employeeId, { event_type });

      expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { actor_id: employeeId },
            { entity_id: employeeId, entity_type: 'employee' },
          ],
          event_type,
        },
        orderBy: { event_timestamp: 'asc' },
        take: 100,
        skip: 0,
      });
    });

    it('should support pagination', async () => {
      const employeeId = 'emp-123';

      mockPrismaService.eventBusLog.findMany.mockResolvedValue([]);

      await service.getEventsForEmployee(employeeId, {
        limit: 50,
        offset: 100,
      });

      expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: { event_timestamp: 'asc' },
        take: 50,
        skip: 100,
      });
    });
  });

  describe('getEventsByType', () => {
    it('should retrieve events by type', async () => {
      const event_type = 'leave.request.submitted';
      const mockEvents = [
        { id: 'event-1', event_type },
        { id: 'event-2', event_type },
      ];

      mockPrismaService.eventBusLog.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsByType(event_type);

      expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
        where: { event_type },
        orderBy: { event_timestamp: 'desc' },
        take: 100,
        skip: 0,
      });

      expect(result).toEqual(mockEvents);
    });

    it('should filter by delivery_status when provided', async () => {
      const event_type = 'attendance.clock_in';
      const delivery_status = 'failed';

      mockPrismaService.eventBusLog.findMany.mockResolvedValue([]);

      await service.getEventsByType(event_type, { delivery_status });

      expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
        where: { event_type, delivery_status },
        orderBy: { event_timestamp: 'desc' },
        take: 100,
        skip: 0,
      });
    });
  });

  describe('getPendingEvents', () => {
    it('should retrieve pending events with retry_count < 5', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          delivery_status: 'pending',
          retry_count: 2,
        },
        {
          id: 'event-2',
          delivery_status: 'pending',
          retry_count: 0,
        },
      ];

      mockPrismaService.eventBusLog.findMany.mockResolvedValue(mockEvents);

      const result = await service.getPendingEvents();

      expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
        where: {
          delivery_status: 'pending',
          retry_count: { lt: 5 },
        },
        orderBy: { event_timestamp: 'asc' },
        take: 100,
      });

      expect(result).toEqual(mockEvents);
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.eventBusLog.findMany.mockResolvedValue([]);

      await service.getPendingEvents(50);

      expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: { event_timestamp: 'asc' },
        take: 50,
      });
    });
  });

  describe('retryFailedEvents', () => {
    it('should retry failed events with retry_count < 5', async () => {
      const mockFailedEvents = [
        { id: 'event-1', retry_count: 2, delivery_status: 'failed' },
        { id: 'event-2', retry_count: 4, delivery_status: 'failed' },
      ];

      mockPrismaService.eventBusLog.findMany.mockResolvedValue(
        mockFailedEvents,
      );
      mockPrismaService.eventBusLog.update.mockResolvedValue({});

      const result = await service.retryFailedEvents();

      expect(result).toBe(2);
      expect(mockPrismaService.eventBusLog.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.eventBusLog.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { delivery_status: 'pending' },
      });
    });

    it('should handle update errors gracefully', async () => {
      const mockFailedEvents = [
        { id: 'event-1', retry_count: 2, delivery_status: 'failed' },
        { id: 'event-2', retry_count: 4, delivery_status: 'failed' },
      ];

      mockPrismaService.eventBusLog.findMany.mockResolvedValue(
        mockFailedEvents,
      );
      mockPrismaService.eventBusLog.update
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await service.retryFailedEvents();

      expect(result).toBe(1); // Only one succeeded
    });
  });

  describe('event ordering per employee', () => {
    it('should maintain chronological order for employee events', async () => {
      const employeeId = 'emp-123';
      const mockEvents = [
        {
          id: 'event-1',
          actor_id: employeeId,
          event_timestamp: new Date('2024-01-15T08:00:00Z'),
        },
        {
          id: 'event-2',
          actor_id: employeeId,
          event_timestamp: new Date('2024-01-15T09:00:00Z'),
        },
        {
          id: 'event-3',
          actor_id: employeeId,
          event_timestamp: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockPrismaService.eventBusLog.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsForEmployee(employeeId);

      // Verify ordering is maintained
      expect(result[0].event_timestamp.getTime()).toBeLessThan(
        result[1].event_timestamp.getTime(),
      );
      expect(result[1].event_timestamp.getTime()).toBeLessThan(
        result[2].event_timestamp.getTime(),
      );
    });
  });

  describe('Property 13: Event Structure Completeness', () => {
    /**
     * **Validates: Requirements 21.7**
     * 
     * Property-based test verifying that any emitted event contains all required fields:
     * - type (event_type)
     * - timestamp (event_timestamp)
     * - actor (with id and type)
     * - entity (with id and type)
     * - payload
     * 
     * This property test generates various event types and validates that the event
     * structure is complete regardless of the specific event type or payload content.
     */
    it('should ensure all emitted events contain required fields (type, timestamp, actor, entity, payload)', async () => {
      // Arbitrary for event types
      const eventTypeArb = fc.constantFrom(
        'leave.request.submitted',
        'leave.request.approved',
        'leave.request.rejected',
        'attendance.clock_in',
        'attendance.clock_out',
        'attendance.tardiness_detected',
        'warning_letter.issued',
        'notification.sent',
        'onboarding.step_completed',
        'onboarding.workflow_completed',
        'onboarding.step_failed',
        'weekly_checkin.submitted',
        'weekly_checkin.report_generated',
        'leave_balance.updated',
      );

      // Arbitrary for actor types
      const actorTypeArb = fc.constantFrom('employee', 'agent', 'system');

      // Arbitrary for entity types
      const entityTypeArb = fc.constantFrom(
        'leave_request',
        'attendance',
        'employee',
        'warning_letter',
        'notification',
        'onboarding',
        'weekly_checkin',
        'leave_balance',
      );

      // Arbitrary for actor
      const actorArb = fc.record({
        id: fc.uuid(),
        type: actorTypeArb,
      });

      // Arbitrary for entity
      const entityArb = fc.record({
        id: fc.uuid(),
        type: entityTypeArb,
      });

      // Arbitrary for payload - use various payload structures
      const payloadArb = fc.oneof(
        fc.record({
          leave_type: fc.constantFrom('annual', 'sick', 'emergency'),
          start_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
          end_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
          total_days: fc.integer({ min: 1, max: 30 }),
        }),
        fc.record({
          timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
          location: fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
          }),
        }),
        fc.record({
          warning_level: fc.constantFrom('SP1', 'SP2', 'SP3'),
          reason: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        fc.record({
          step_number: fc.integer({ min: 1, max: 7 }),
          step_name: fc.string({ minLength: 5, maxLength: 50 }),
          status: fc.constantFrom('pending', 'completed', 'failed'),
        }),
        fc.record({
          accomplishments: fc.string({ minLength: 10, maxLength: 200 }),
          challenges: fc.string({ minLength: 10, maxLength: 200 }),
          next_week_goals: fc.string({ minLength: 10, maxLength: 200 }),
        }),
      );

      // Arbitrary for complete TaraEvent
      const taraEventArb = fc.record({
        event_type: eventTypeArb,
        actor: actorArb,
        entity: entityArb,
        payload: payloadArb,
        event_timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        event_version: fc.constantFrom('1.0', '1.1', '2.0'),
      });

      await fc.assert(
        fc.asyncProperty(taraEventArb, async (event) => {
          // Mock Prisma responses
          const mockEventLog = {
            id: fc.sample(fc.uuid(), 1)[0],
            event_type: event.event_type,
            event_version: event.event_version,
            actor_id: event.actor.id,
            actor_type: event.actor.type,
            entity_id: event.entity.id,
            entity_type: event.entity.type,
            event_payload: event.payload,
            event_timestamp: event.event_timestamp,
            delivery_status: 'pending',
            retry_count: 0,
          };

          mockPrismaService.eventBusLog.create.mockResolvedValue(mockEventLog);
          mockPrismaService.eventBusLog.update.mockResolvedValue({
            ...mockEventLog,
            delivery_status: 'delivered',
          });

          // Emit the event
          const result = await service.emit(event);

          // Verify all required fields are present in the stored event
          expect(result.event_type).toBeDefined();
          expect(typeof result.event_type).toBe('string');
          expect(result.event_type.length).toBeGreaterThan(0);

          expect(result.event_timestamp).toBeDefined();
          expect(result.event_timestamp).toBeInstanceOf(Date);

          expect(result.actor_id).toBeDefined();
          expect(typeof result.actor_id).toBe('string');
          expect(result.actor_id.length).toBeGreaterThan(0);

          expect(result.actor_type).toBeDefined();
          expect(['employee', 'agent', 'system']).toContain(result.actor_type);

          expect(result.entity_id).toBeDefined();
          expect(typeof result.entity_id).toBe('string');
          expect(result.entity_id.length).toBeGreaterThan(0);

          expect(result.entity_type).toBeDefined();
          expect(typeof result.entity_type).toBe('string');
          expect(result.entity_type.length).toBeGreaterThan(0);

          expect(result.event_payload).toBeDefined();
          expect(result.event_payload).not.toBeNull();
          expect(typeof result.event_payload).toBe('object');

          // Verify the create call was made with all required fields
          expect(mockPrismaService.eventBusLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              id: expect.any(String),
              event_type: expect.any(String),
              event_version: expect.any(String),
              actor_id: expect.any(String),
              actor_type: expect.any(String),
              entity_id: expect.any(String),
              entity_type: expect.any(String),
              event_payload: expect.any(Object),
              event_timestamp: expect.any(Date),
              delivery_status: 'pending',
              retry_count: 0,
            }),
          });
        }),
        { 
          numRuns: 100, // Run 100 random tests
          verbose: true,
        },
      );
    });

    it('should reject events missing required fields', async () => {
      // Test missing event_type
      const eventMissingType: Partial<TaraEvent> = {
        actor: { id: 'emp-123', type: 'employee' },
        entity: { id: 'entity-456', type: 'leave_request' },
        payload: { test: 'data' },
      };

      await expect(service.emit(eventMissingType)).rejects.toThrow(
        'event_type is required',
      );

      // Test missing actor
      const eventMissingActor: Partial<TaraEvent> = {
        event_type: 'test.event',
        entity: { id: 'entity-456', type: 'leave_request' },
        payload: { test: 'data' },
      };

      await expect(service.emit(eventMissingActor)).rejects.toThrow(
        'actor with id and type is required',
      );

      // Test missing entity
      const eventMissingEntity: Partial<TaraEvent> = {
        event_type: 'test.event',
        actor: { id: 'emp-123', type: 'employee' },
        payload: { test: 'data' },
      };

      await expect(service.emit(eventMissingEntity)).rejects.toThrow(
        'entity with id and type is required',
      );

      // Test missing payload
      const eventMissingPayload: Partial<TaraEvent> = {
        event_type: 'test.event',
        actor: { id: 'emp-123', type: 'employee' },
        entity: { id: 'entity-456', type: 'leave_request' },
      };

      await expect(service.emit(eventMissingPayload)).rejects.toThrow(
        'payload is required',
      );
    });
  });

  describe('Event Persistence - 90-day Retention (Requirement 21.9)', () => {
    describe('cleanupOldEvents', () => {
      it('should delete events older than 90 days', async () => {
        const mockDeleteResult = { count: 42 };
        mockPrismaService.eventBusLog.deleteMany.mockResolvedValue(mockDeleteResult);

        const result = await service.cleanupOldEvents();

        expect(result).toBe(42);
        expect(mockPrismaService.eventBusLog.deleteMany).toHaveBeenCalledWith({
          where: {
            event_timestamp: {
              lt: expect.any(Date),
            },
          },
        });

        // Verify the cutoff date is approximately 90 days ago
        const call = mockPrismaService.eventBusLog.deleteMany.mock.calls[0][0];
        const cutoffDate = call.where.event_timestamp.lt;
        const daysDiff = Math.floor((Date.now() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24));
        expect(daysDiff).toBe(90);
      });

      it('should handle cleanup errors gracefully', async () => {
        mockPrismaService.eventBusLog.deleteMany.mockRejectedValue(
          new Error('Database error'),
        );

        await expect(service.cleanupOldEvents()).rejects.toThrow('Database error');
      });
    });

    describe('getEventCount', () => {
      it('should count all events when no filters provided', async () => {
        mockPrismaService.eventBusLog.count.mockResolvedValue(1234);

        const result = await service.getEventCount();

        expect(result).toBe(1234);
        expect(mockPrismaService.eventBusLog.count).toHaveBeenCalledWith({
          where: {},
        });
      });

      it('should filter by event_type', async () => {
        mockPrismaService.eventBusLog.count.mockResolvedValue(56);

        const result = await service.getEventCount({
          event_type: 'leave.request.submitted',
        });

        expect(result).toBe(56);
        expect(mockPrismaService.eventBusLog.count).toHaveBeenCalledWith({
          where: { event_type: 'leave.request.submitted' },
        });
      });

      it('should filter by delivery_status', async () => {
        mockPrismaService.eventBusLog.count.mockResolvedValue(12);

        const result = await service.getEventCount({
          delivery_status: 'failed',
        });

        expect(result).toBe(12);
        expect(mockPrismaService.eventBusLog.count).toHaveBeenCalledWith({
          where: { delivery_status: 'failed' },
        });
      });

      it('should filter by age (olderThanDays)', async () => {
        mockPrismaService.eventBusLog.count.mockResolvedValue(89);

        const result = await service.getEventCount({
          olderThanDays: 30,
        });

        expect(result).toBe(89);
        expect(mockPrismaService.eventBusLog.count).toHaveBeenCalledWith({
          where: {
            event_timestamp: {
              lt: expect.any(Date),
            },
          },
        });
      });
    });
  });

  describe('Event Replay Mechanism (Requirement 21.9)', () => {
    describe('replayEventsInTimeRange', () => {
      it('should replay events within time range in chronological order', async () => {
        const startDate = new Date('2024-01-15T00:00:00Z');
        const endDate = new Date('2024-01-15T23:59:59Z');
        
        const mockEvents = [
          {
            id: 'event-1',
            event_type: 'attendance.clock_in',
            event_version: '1.0',
            actor_id: 'emp-123',
            actor_type: 'employee',
            entity_id: 'att-1',
            entity_type: 'attendance',
            event_payload: { timestamp: '08:00' },
            event_timestamp: new Date('2024-01-15T08:00:00Z'),
          },
          {
            id: 'event-2',
            event_type: 'leave.request.submitted',
            event_version: '1.0',
            actor_id: 'emp-456',
            actor_type: 'employee',
            entity_id: 'leave-1',
            entity_type: 'leave_request',
            event_payload: { leave_type: 'annual' },
            event_timestamp: new Date('2024-01-15T10:00:00Z'),
          },
        ];

        mockPrismaService.eventBusLog.findMany.mockResolvedValue(mockEvents);
        mockPrismaService.eventBusLog.create.mockImplementation((args: any) =>
          Promise.resolve({ id: 'replayed-' + Math.random(), ...args.data }),
        );
        mockPrismaService.eventBusLog.update.mockResolvedValue({});

        const result = await service.replayEventsInTimeRange(startDate, endDate);

        expect(result).toHaveLength(2);
        expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
          where: {
            event_timestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { event_timestamp: 'asc' },
        });

        // Verify events were re-emitted with replay markers
        expect(mockPrismaService.eventBusLog.create).toHaveBeenCalledTimes(2);
        const firstCall = mockPrismaService.eventBusLog.create.mock.calls[0][0];
        expect(firstCall.data.event_payload._replay).toBe(true);
        expect(firstCall.data.event_payload._original_event_id).toBe('event-1');
      });

      it('should support dry run without re-emitting events', async () => {
        const startDate = new Date('2024-01-15T00:00:00Z');
        const endDate = new Date('2024-01-15T23:59:59Z');
        
        const mockEvents = [
          {
            id: 'event-1',
            event_type: 'attendance.clock_in',
            event_timestamp: new Date('2024-01-15T08:00:00Z'),
          },
        ];

        mockPrismaService.eventBusLog.findMany.mockResolvedValue(mockEvents);

        const result = await service.replayEventsInTimeRange(
          startDate,
          endDate,
          { dryRun: true },
        );

        expect(result).toEqual(mockEvents);
        expect(mockPrismaService.eventBusLog.create).not.toHaveBeenCalled();
      });

      it('should filter by event_type when provided', async () => {
        const startDate = new Date('2024-01-15T00:00:00Z');
        const endDate = new Date('2024-01-15T23:59:59Z');

        mockPrismaService.eventBusLog.findMany.mockResolvedValue([]);

        await service.replayEventsInTimeRange(startDate, endDate, {
          event_type: 'attendance.clock_in',
          dryRun: true,
        });

        expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
          where: {
            event_timestamp: { gte: startDate, lte: endDate },
            event_type: 'attendance.clock_in',
          },
          orderBy: { event_timestamp: 'asc' },
        });
      });

      it('should filter by entity_id when provided', async () => {
        const startDate = new Date('2024-01-15T00:00:00Z');
        const endDate = new Date('2024-01-15T23:59:59Z');

        mockPrismaService.eventBusLog.findMany.mockResolvedValue([]);

        await service.replayEventsInTimeRange(startDate, endDate, {
          entity_id: 'emp-123',
          dryRun: true,
        });

        expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
          where: {
            event_timestamp: { gte: startDate, lte: endDate },
            entity_id: 'emp-123',
          },
          orderBy: { event_timestamp: 'asc' },
        });
      });

      it('should handle replay errors gracefully', async () => {
        const startDate = new Date('2024-01-15T00:00:00Z');
        const endDate = new Date('2024-01-15T23:59:59Z');
        
        const mockEvents = [
          {
            id: 'event-1',
            event_type: 'attendance.clock_in',
            event_version: '1.0',
            actor_id: 'emp-123',
            actor_type: 'employee',
            entity_id: 'att-1',
            entity_type: 'attendance',
            event_payload: { timestamp: '08:00' },
            event_timestamp: new Date('2024-01-15T08:00:00Z'),
          },
          {
            id: 'event-2',
            event_type: 'leave.request.submitted',
            event_version: '1.0',
            actor_id: 'emp-456',
            actor_type: 'employee',
            entity_id: 'leave-1',
            entity_type: 'leave_request',
            event_payload: { leave_type: 'annual' },
            event_timestamp: new Date('2024-01-15T10:00:00Z'),
          },
        ];

        mockPrismaService.eventBusLog.findMany.mockResolvedValue(mockEvents);
        mockPrismaService.eventBusLog.create
          .mockResolvedValueOnce({ id: 'replayed-1' })
          .mockRejectedValueOnce(new Error('Database error'));
        mockPrismaService.eventBusLog.update.mockResolvedValue({});

        const result = await service.replayEventsInTimeRange(startDate, endDate);

        // Should have only 1 successful replay
        expect(result).toHaveLength(1);
      });
    });

    describe('replayEventById', () => {
      it('should replay a specific event by ID', async () => {
        const mockEvent = {
          id: 'event-123',
          event_type: 'leave.request.approved',
          event_version: '1.0',
          actor_id: 'supervisor-1',
          actor_type: 'employee',
          entity_id: 'leave-456',
          entity_type: 'leave_request',
          event_payload: { approved_by: 'supervisor-1' },
          event_timestamp: new Date(),
        };

        mockPrismaService.eventBusLog.findUnique.mockResolvedValue(mockEvent);
        mockPrismaService.eventBusLog.create.mockResolvedValue({
          id: 'event-123', // Actually returns the mock event id
          ...mockEvent,
        });
        mockPrismaService.eventBusLog.update.mockResolvedValue({});

        const result = await service.replayEventById('event-123');

        expect(result.id).toBe('event-123');
        expect(mockPrismaService.eventBusLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            event_type: 'leave.request.approved',
            event_payload: expect.objectContaining({
              _replay: true,
              _original_event_id: 'event-123',
            }),
          }),
        });
      });

      it('should throw error if event not found', async () => {
        mockPrismaService.eventBusLog.findUnique.mockResolvedValue(null);

        await expect(service.replayEventById('non-existent')).rejects.toThrow(
          'Event non-existent not found',
        );
      });
    });

    describe('replayEventsForEntity', () => {
      it('should replay all events for a specific entity', async () => {
        const mockEvents = [
          {
            id: 'event-1',
            event_type: 'leave.request.submitted',
            event_version: '1.0',
            actor_id: 'emp-123',
            actor_type: 'employee',
            entity_id: 'leave-456',
            entity_type: 'leave_request',
            event_payload: { leave_type: 'annual' },
            event_timestamp: new Date('2024-01-15T08:00:00Z'),
          },
          {
            id: 'event-2',
            event_type: 'leave.request.approved',
            event_version: '1.0',
            actor_id: 'supervisor-1',
            actor_type: 'employee',
            entity_id: 'leave-456',
            entity_type: 'leave_request',
            event_payload: { approved_by: 'supervisor-1' },
            event_timestamp: new Date('2024-01-15T10:00:00Z'),
          },
        ];

        mockPrismaService.eventBusLog.findMany.mockResolvedValue(mockEvents);
        mockPrismaService.eventBusLog.create.mockImplementation((args: any) =>
          Promise.resolve({ id: 'replayed-' + Math.random(), ...args.data }),
        );
        mockPrismaService.eventBusLog.update.mockResolvedValue({});

        const result = await service.replayEventsForEntity(
          'leave_request',
          'leave-456',
        );

        expect(result).toHaveLength(2);
        expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
          where: {
            entity_type: 'leave_request',
            entity_id: 'leave-456',
          },
          orderBy: { event_timestamp: 'asc' },
        });
      });

      it('should support dry run', async () => {
        const mockEvents = [
          {
            id: 'event-1',
            entity_id: 'leave-456',
            entity_type: 'leave_request',
          },
        ];

        mockPrismaService.eventBusLog.findMany.mockResolvedValue(mockEvents);

        const result = await service.replayEventsForEntity(
          'leave_request',
          'leave-456',
          { dryRun: true },
        );

        expect(result).toEqual(mockEvents);
        expect(mockPrismaService.eventBusLog.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('Event Schema Versioning (Requirement 21.10)', () => {
    describe('isEventVersionSupported', () => {
      it('should return true for supported versions', () => {
        expect(service.isEventVersionSupported('leave.request.submitted', '1.0')).toBe(true);
        expect(service.isEventVersionSupported('leave.request.submitted', '1.1')).toBe(true);
        expect(service.isEventVersionSupported('leave.request.submitted', '2.0')).toBe(true);
      });

      it('should return false for unsupported versions', () => {
        expect(service.isEventVersionSupported('leave.request.submitted', '3.0')).toBe(false);
        expect(service.isEventVersionSupported('leave.request.submitted', '0.9')).toBe(false);
      });

      it('should allow any version for unknown event types', () => {
        expect(service.isEventVersionSupported('unknown.event.type', '99.0')).toBe(true);
      });
    });

    describe('getSupportedVersions', () => {
      it('should return array of supported versions', () => {
        const versions = service.getSupportedVersions('leave.request.submitted');
        expect(versions).toEqual(['1.0', '1.1', '2.0']);
      });

      it('should return default version for unknown event types', () => {
        const versions = service.getSupportedVersions('unknown.event.type');
        expect(versions).toEqual(['1.0']);
      });
    });

    describe('getLatestVersion', () => {
      it('should return latest version for event type', () => {
        const version = service.getLatestVersion('leave.request.submitted');
        expect(version).toBe('2.0');
      });

      it('should return 1.0 for unknown event types', () => {
        const version = service.getLatestVersion('unknown.event.type');
        expect(version).toBe('1.0');
      });
    });

    describe('transformEventToVersion', () => {
      it('should not transform if already at target version', () => {
        const event = {
          id: 'event-1',
          event_type: 'leave.request.submitted',
          event_version: '2.0',
          event_payload: { leave_type: 'annual' },
        };

        const result = service.transformEventToVersion(event, '2.0');
        expect(result).toEqual(event);
      });

      it('should transform leave request event from v1.0 to v2.0', () => {
        const event = {
          id: 'event-1',
          event_type: 'leave.request.submitted',
          event_version: '1.0',
          event_payload: {
            leave_type: 'annual',
            start_date: '2024-01-15',
          },
        };

        const result = service.transformEventToVersion(event, '2.0');

        expect(result.event_version).toBe('2.0');
        expect(result.event_payload.reason_category).toBe('other');
        expect(result.event_payload.requester_department).toBeNull();
      });

      it('should transform attendance event from v1.0 to v2.0', () => {
        const event = {
          id: 'event-1',
          event_type: 'attendance.clock_in',
          event_version: '1.0',
          event_payload: {
            timestamp: '08:00',
          },
        };

        const result = service.transformEventToVersion(event, '2.0');

        expect(result.event_version).toBe('2.0');
        expect(result.event_payload.location).toBeNull();
        expect(result.event_payload.device_type).toBe('phone');
      });

      it('should use latest version if target not specified', () => {
        const event = {
          id: 'event-1',
          event_type: 'leave.request.submitted',
          event_version: '1.0',
          event_payload: { leave_type: 'annual' },
        };

        const result = service.transformEventToVersion(event);

        expect(result.event_version).toBe('2.0');
      });
    });

    describe('getEventsWithVersionTransform', () => {
      it('should retrieve and transform events to latest version', async () => {
        const mockEvents = [
          {
            id: 'event-1',
            event_type: 'leave.request.submitted',
            event_version: '1.0',
            event_payload: { leave_type: 'annual' },
            entity_id: 'leave-1',
            actor_id: 'emp-123',
            event_timestamp: new Date(),
          },
          {
            id: 'event-2',
            event_type: 'attendance.clock_in',
            event_version: '1.0',
            event_payload: { timestamp: '08:00' },
            entity_id: 'att-1',
            actor_id: 'emp-456',
            event_timestamp: new Date(),
          },
        ];

        mockPrismaService.eventBusLog.findMany.mockResolvedValue(mockEvents);

        const result = await service.getEventsWithVersionTransform({
          event_type: 'leave.request.submitted',
        });

        expect(result).toHaveLength(2);
        expect(result[0].event_version).toBe('2.0');
        expect(result[1].event_version).toBe('2.0');
      });

      it('should support date range filters', async () => {
        mockPrismaService.eventBusLog.findMany.mockResolvedValue([]);

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        await service.getEventsWithVersionTransform({ startDate, endDate });

        expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
          where: {
            event_timestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { event_timestamp: 'desc' },
          take: 100,
          skip: 0,
        });
      });

      it('should support pagination', async () => {
        mockPrismaService.eventBusLog.findMany.mockResolvedValue([]);

        await service.getEventsWithVersionTransform({
          limit: 50,
          offset: 100,
        });

        expect(mockPrismaService.eventBusLog.findMany).toHaveBeenCalledWith({
          where: {},
          orderBy: { event_timestamp: 'desc' },
          take: 50,
          skip: 100,
        });
      });
    });

    describe('backward compatibility', () => {
      it('should maintain 2 previous versions support', () => {
        const eventTypes = [
          'leave.request.submitted',
          'attendance.clock_in',
          'warning.letter.issued',
        ];

        eventTypes.forEach(eventType => {
          const versions = service.getSupportedVersions(eventType);
          expect(versions.length).toBeGreaterThanOrEqual(2);
          expect(versions.length).toBeLessThanOrEqual(3); // Current + 2 previous
        });
      });

      it('should transform old events to latest version seamlessly', () => {
        const oldEvent = {
          id: 'event-1',
          event_type: 'leave.request.submitted',
          event_version: '1.0',
          event_payload: { leave_type: 'annual' },
        };

        const transformed = service.transformEventToVersion(oldEvent);

        expect(transformed.event_version).toBe('2.0');
        expect(transformed.event_payload).toHaveProperty('reason_category');
        expect(transformed.event_payload).toHaveProperty('requester_department');
      });
    });
  });
});
