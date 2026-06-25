import { EventSubscriptionRegistry } from './event-subscription.registry';

describe('EventSubscriptionRegistry', () => {
  let registry: EventSubscriptionRegistry;

  beforeEach(() => {
    registry = new EventSubscriptionRegistry();
  });

  describe('register', () => {
    it('should register a new subscription', () => {
      const subscription = registry.register('sub-1', 'Hermes_Agentic', ['attendance.clock_in']);

      expect(subscription.subscriptionId).toBe('sub-1');
      expect(subscription.consumerName).toBe('Hermes_Agentic');
      expect(subscription.eventTypes).toEqual(['attendance.clock_in']);
      expect(subscription.createdAt).toBeInstanceOf(Date);
      expect(subscription.lastActivityAt).toBeInstanceOf(Date);
    });

    it('should default to all events when eventTypes is empty', () => {
      const subscription = registry.register('sub-1', 'Hermes_Agentic', []);

      expect(subscription.eventTypes).toEqual(['*']);
    });

    it('should track multiple subscriptions', () => {
      registry.register('sub-1', 'Hermes_Agentic', ['attendance.*']);
      registry.register('sub-2', 'DataAnalytics', ['leave.*']);

      expect(registry.getSubscriptionCount()).toBe(2);
    });
  });

  describe('updateFilters', () => {
    it('should update event type filters for existing subscription', () => {
      registry.register('sub-1', 'Hermes_Agentic', ['attendance.clock_in']);
      
      const updated = registry.updateFilters('sub-1', ['leave.request.submitted']);

      expect(updated).not.toBeNull();
      expect(updated?.eventTypes).toEqual(['leave.request.submitted']);
    });

    it('should return null for non-existent subscription', () => {
      const result = registry.updateFilters('non-existent', ['*']);

      expect(result).toBeNull();
    });

    it('should update lastActivityAt timestamp', () => {
      registry.register('sub-1', 'Hermes_Agentic', ['attendance.clock_in']);
      const originalActivity = registry.getSubscription('sub-1')?.lastActivityAt;

      // Wait a bit
      const delayPromise = new Promise(resolve => setTimeout(resolve, 10));
      return delayPromise.then(() => {
        registry.updateFilters('sub-1', ['leave.*']);
        const newActivity = registry.getSubscription('sub-1')?.lastActivityAt;

        expect(newActivity).not.toEqual(originalActivity);
      });
    });
  });

  describe('unregister', () => {
    it('should remove an existing subscription', () => {
      registry.register('sub-1', 'Hermes_Agentic', ['*']);
      
      const result = registry.unregister('sub-1');

      expect(result).toBe(true);
      expect(registry.getSubscription('sub-1')).toBeUndefined();
    });

    it('should return false for non-existent subscription', () => {
      const result = registry.unregister('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getSubscribersForEvent', () => {
    beforeEach(() => {
      registry.register('sub-1', 'Hermes_Agentic', ['*']); // All events
      registry.register('sub-2', 'Analytics', ['attendance.*']); // Wildcard pattern
      registry.register('sub-3', 'Logger', ['attendance.clock_in']); // Specific event
      registry.register('sub-4', 'Dashboard', ['leave.request.submitted']); // Different event
    });

    it('should return subscribers listening to all events', () => {
      const subscribers = registry.getSubscribersForEvent('any.event.type');

      expect(subscribers).toContain('sub-1');
    });

    it('should return subscribers with matching wildcard patterns', () => {
      const subscribers = registry.getSubscribersForEvent('attendance.clock_in');

      expect(subscribers).toContain('sub-1'); // Wildcard *
      expect(subscribers).toContain('sub-2'); // Wildcard attendance.*
      expect(subscribers).toContain('sub-3'); // Specific match
      expect(subscribers).not.toContain('sub-4'); // Different event type
    });

    it('should return only subscribers with exact match', () => {
      const subscribers = registry.getSubscribersForEvent('leave.request.submitted');

      expect(subscribers).toContain('sub-1'); // Wildcard *
      expect(subscribers).toContain('sub-4'); // Exact match
      expect(subscribers).not.toContain('sub-2'); // attendance.* doesn't match
      expect(subscribers).not.toContain('sub-3'); // attendance.clock_in doesn't match
    });

    it('should handle events with no subscribers', () => {
      const subscribers = registry.getSubscribersForEvent('unknown.event.type');

      expect(subscribers).toEqual(['sub-1']); // Only wildcard subscriber
    });

    it('should handle multiple wildcard patterns', () => {
      registry.register('sub-5', 'MultiPatternConsumer', ['attendance.*', 'leave.*']);
      
      const attendanceSubscribers = registry.getSubscribersForEvent('attendance.clock_out');
      const leaveSubscribers = registry.getSubscribersForEvent('leave.request.approved');

      expect(attendanceSubscribers).toContain('sub-5');
      expect(leaveSubscribers).toContain('sub-5');
    });
  });

  describe('updateActivity', () => {
    it('should update lastActivityAt for existing subscription', () => {
      registry.register('sub-1', 'Hermes_Agentic', ['*']);
      const originalActivity = registry.getSubscription('sub-1')?.lastActivityAt;

      // Wait a bit
      const delayPromise = new Promise(resolve => setTimeout(resolve, 10));
      return delayPromise.then(() => {
        registry.updateActivity('sub-1');
        const newActivity = registry.getSubscription('sub-1')?.lastActivityAt;

        expect(newActivity).not.toEqual(originalActivity);
      });
    });

    it('should handle non-existent subscription gracefully', () => {
      expect(() => registry.updateActivity('non-existent')).not.toThrow();
    });
  });

  describe('getAllSubscriptions', () => {
    it('should return all active subscriptions', () => {
      registry.register('sub-1', 'Hermes_Agentic', ['*']);
      registry.register('sub-2', 'Analytics', ['attendance.*']);
      
      const subscriptions = registry.getAllSubscriptions();

      expect(subscriptions).toHaveLength(2);
      expect(subscriptions[0].subscriptionId).toBeDefined();
      expect(subscriptions[1].subscriptionId).toBeDefined();
    });

    it('should return empty array when no subscriptions exist', () => {
      const subscriptions = registry.getAllSubscriptions();

      expect(subscriptions).toEqual([]);
    });
  });

  describe('getSubscriptionCount', () => {
    it('should return correct count of active subscriptions', () => {
      expect(registry.getSubscriptionCount()).toBe(0);

      registry.register('sub-1', 'Hermes_Agentic', ['*']);
      expect(registry.getSubscriptionCount()).toBe(1);

      registry.register('sub-2', 'Analytics', ['attendance.*']);
      expect(registry.getSubscriptionCount()).toBe(2);

      registry.unregister('sub-1');
      expect(registry.getSubscriptionCount()).toBe(1);
    });
  });

  describe('event type filtering edge cases', () => {
    it('should not match partial event type names', () => {
      registry.register('sub-1', 'Consumer', ['attendance.clock']);
      
      const subscribers = registry.getSubscribersForEvent('attendance.clock_in');

      expect(subscribers).not.toContain('sub-1');
    });

    it('should handle deeply nested event types with wildcards', () => {
      registry.register('sub-1', 'Consumer', ['attendance.*']);
      
      const subscribers = registry.getSubscribersForEvent('attendance.clock_in.biometric');

      // Should match because attendance.* matches anything starting with 'attendance.'
      expect(subscribers).toContain('sub-1');
    });

    it('should handle event types with special characters', () => {
      registry.register('sub-1', 'Consumer', ['event-type.with-dashes']);
      
      const subscribers = registry.getSubscribersForEvent('event-type.with-dashes');

      expect(subscribers).toContain('sub-1');
    });
  });
});
