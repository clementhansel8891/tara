/**
 * Integration test for Event Stream Gateway
 * Demonstrates WebSocket-based event subscription mechanism
 * Requirements: 21.8, 21.14
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventStreamGateway } from './event-stream.gateway';
import { Socket } from 'socket.io';

describe('EventStreamGateway Integration', () => {
  let gateway: EventStreamGateway;

  beforeEach(() => {
    gateway = new EventStreamGateway();
  });

  describe('Connection Management', () => {
    it('should register a new connection', () => {
      const mockClient = createMockSocket('client-1', 'Hermes_Agentic');
      
      gateway.handleConnection(mockClient as any);
      
      const stats = gateway.getStats();
      expect(stats.totalSubscriptions).toBe(1);
      expect(stats.subscriptionsByConsumer['Hermes_Agentic']).toBe(1);
    });

    it('should unregister on disconnection', () => {
      const mockClient = createMockSocket('client-1', 'Hermes_Agentic');
      
      gateway.handleConnection(mockClient as any);
      expect(gateway.getStats().totalSubscriptions).toBe(1);
      
      gateway.handleDisconnect(mockClient as any);
      expect(gateway.getStats().totalSubscriptions).toBe(0);
    });

    it('should support multiple concurrent connections', () => {
      const client1 = createMockSocket('client-1', 'Hermes_Agentic');
      const client2 = createMockSocket('client-2', 'DataAnalytics');
      const client3 = createMockSocket('client-3', 'Hermes_Agentic');
      
      gateway.handleConnection(client1 as any);
      gateway.handleConnection(client2 as any);
      gateway.handleConnection(client3 as any);
      
      const stats = gateway.getStats();
      expect(stats.totalSubscriptions).toBe(3);
      expect(stats.subscriptionsByConsumer['Hermes_Agentic']).toBe(2);
      expect(stats.subscriptionsByConsumer['DataAnalytics']).toBe(1);
    });
  });

  describe('Event Subscription', () => {
    it('should allow subscription to specific event types', () => {
      const mockClient = createMockSocket('client-1', 'Hermes_Agentic');
      const emittedData: any[] = [];
      mockClient.emit = (event: string, data: any) => emittedData.push({ event, data });
      
      gateway.handleConnection(mockClient as any);
      gateway.handleSubscribe(mockClient as any, {
        eventTypes: ['attendance.clock_in', 'leave.request.submitted']
      });
      
      const subscribedEvent = emittedData.find(e => e.event === 'subscribed');
      expect(subscribedEvent).toBeDefined();
      expect(subscribedEvent?.data.eventTypes).toEqual([
        'attendance.clock_in',
        'leave.request.submitted'
      ]);
    });

    it('should allow subscription to all events with wildcard', () => {
      const mockClient = createMockSocket('client-1', 'Hermes_Agentic');
      const emittedData: any[] = [];
      mockClient.emit = (event: string, data: any) => emittedData.push({ event, data });
      
      gateway.handleConnection(mockClient as any);
      gateway.handleSubscribe(mockClient as any, {
        eventTypes: ['*']
      });
      
      const subscribedEvent = emittedData.find(e => e.event === 'subscribed');
      expect(subscribedEvent?.data.eventTypes).toEqual(['*']);
    });

    it('should support wildcard patterns in event types', () => {
      const mockClient = createMockSocket('client-1', 'Hermes_Agentic');
      const emittedData: any[] = [];
      mockClient.emit = (event: string, data: any) => emittedData.push({ event, data });
      
      gateway.handleConnection(mockClient as any);
      gateway.handleSubscribe(mockClient as any, {
        eventTypes: ['attendance.*', 'leave.*']
      });
      
      const subscribedEvent = emittedData.find(e => e.event === 'subscribed');
      expect(subscribedEvent?.data.eventTypes).toEqual(['attendance.*', 'leave.*']);
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast events to subscribed clients', () => {
      const mockClient = createMockSocket('client-1', 'Hermes_Agentic');
      const emittedEvents: any[] = [];
      
      // Mock Socket.IO server.to() pattern
      gateway.server = {
        to: (room: string) => ({
          emit: (event: string, data: any) => {
            if (room === mockClient.id) {
              emittedEvents.push({ event, data });
            }
          }
        })
      } as any;
      
      gateway.handleConnection(mockClient as any);
      gateway.handleSubscribe(mockClient as any, {
        eventTypes: ['attendance.clock_in']
      });
      
      // Broadcast an event
      const testEvent = {
        id: 'evt-123',
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        entity_id: 'attendance-1',
        entity_type: 'attendance',
        payload: { employee_id: 'emp-1', timestamp: new Date().toISOString() },
        correlation_id: 'corr-1',
        version: 1,
        created_at: new Date().toISOString()
      };
      
      gateway.broadcastEvent('attendance.clock_in', testEvent);
      
      const broadcastedEvent = emittedEvents.find(e => e.event === 'event');
      expect(broadcastedEvent).toBeDefined();
      expect(broadcastedEvent?.data.event_type).toBe('attendance.clock_in');
      expect(broadcastedEvent?.data.event_id).toBe('evt-123');
    });

    it('should only broadcast to clients subscribed to specific event type', () => {
      const client1 = createMockSocket('client-1', 'Hermes_Agentic');
      const client2 = createMockSocket('client-2', 'DataAnalytics');
      const emittedEvents: Map<string, any[]> = new Map();
      
      // Mock Socket.IO server.to() pattern
      gateway.server = {
        to: (room: string) => ({
          emit: (event: string, data: any) => {
            if (!emittedEvents.has(room)) {
              emittedEvents.set(room, []);
            }
            emittedEvents.get(room)!.push({ event, data });
          }
        })
      } as any;
      
      gateway.handleConnection(client1 as any);
      gateway.handleConnection(client2 as any);
      
      gateway.handleSubscribe(client1 as any, { eventTypes: ['attendance.*'] });
      gateway.handleSubscribe(client2 as any, { eventTypes: ['leave.*'] });
      
      // Broadcast attendance event
      const attendanceEvent = {
        id: 'evt-123',
        tenant_id: 'tenant-1',
        entity_id: 'attendance-1',
        entity_type: 'attendance',
        payload: {},
        created_at: new Date().toISOString()
      };
      
      gateway.broadcastEvent('attendance.clock_in', attendanceEvent);
      
      // Client 1 should receive the event
      expect(emittedEvents.get('client-1')).toBeDefined();
      expect(emittedEvents.get('client-1')?.length).toBeGreaterThan(0);
      
      // Client 2 should NOT receive the event
      expect(emittedEvents.get('client-2')).toBeUndefined();
    });

    it('should broadcast to all wildcard subscribers', () => {
      const client1 = createMockSocket('client-1', 'Hermes_Agentic');
      const client2 = createMockSocket('client-2', 'Monitor');
      const emittedEvents: Map<string, any[]> = new Map();
      
      gateway.server = {
        to: (room: string) => ({
          emit: (event: string, data: any) => {
            if (!emittedEvents.has(room)) {
              emittedEvents.set(room, []);
            }
            emittedEvents.get(room)!.push({ event, data });
          }
        })
      } as any;
      
      gateway.handleConnection(client1 as any);
      gateway.handleConnection(client2 as any);
      
      gateway.handleSubscribe(client1 as any, { eventTypes: ['attendance.clock_in'] });
      gateway.handleSubscribe(client2 as any, { eventTypes: ['*'] });
      
      const testEvent = {
        id: 'evt-123',
        tenant_id: 'tenant-1',
        entity_id: 'attendance-1',
        entity_type: 'attendance',
        payload: {},
        created_at: new Date().toISOString()
      };
      
      gateway.broadcastEvent('attendance.clock_in', testEvent);
      
      // Both clients should receive the event
      expect(emittedEvents.get('client-1')).toBeDefined();
      expect(emittedEvents.get('client-2')).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should provide accurate subscription statistics', () => {
      const client1 = createMockSocket('client-1', 'Hermes_Agentic');
      const client2 = createMockSocket('client-2', 'Hermes_Agentic');
      const client3 = createMockSocket('client-3', 'DataAnalytics');
      
      gateway.handleConnection(client1 as any);
      gateway.handleConnection(client2 as any);
      gateway.handleConnection(client3 as any);
      
      gateway.handleSubscribe(client1 as any, { eventTypes: ['attendance.*'] });
      gateway.handleSubscribe(client2 as any, { eventTypes: ['*'] });
      gateway.handleSubscribe(client3 as any, { eventTypes: ['leave.*'] });
      
      const stats = gateway.getStats();
      
      expect(stats.totalSubscriptions).toBe(3);
      expect(stats.subscriptionsByConsumer['Hermes_Agentic']).toBe(2);
      expect(stats.subscriptionsByConsumer['DataAnalytics']).toBe(1);
      expect(stats.subscriptions).toHaveLength(3);
      
      const hermesSubscriptions = stats.subscriptions.filter(
        s => s.consumerName === 'Hermes_Agentic'
      );
      expect(hermesSubscriptions).toHaveLength(2);
    });
  });
});

/**
 * Helper function to create a mock Socket.IO socket
 */
function createMockSocket(id: string, consumerName: string): Partial<Socket> {
  return {
    id,
    handshake: {
      query: { consumerName },
    } as any,
    emit: () => {},
  };
}
