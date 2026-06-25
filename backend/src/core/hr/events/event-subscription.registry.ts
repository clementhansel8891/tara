/**
 * Event Subscription Registry
 * Manages external consumer subscriptions to the Event Bus
 * Requirements: 21.8, 21.14
 */

export interface EventSubscription {
  subscriptionId: string;
  consumerName: string;
  eventTypes: string[]; // Event types the consumer is interested in (e.g., ['attendance.clock_in', 'leave.request.submitted'])
  createdAt: Date;
  lastActivityAt: Date;
}

export class EventSubscriptionRegistry {
  private subscriptions: Map<string, EventSubscription> = new Map();

  /**
   * Register a new subscription for an external consumer
   * @param subscriptionId Unique identifier for this subscription (typically socket ID)
   * @param consumerName Name of the consuming system (e.g., 'Hermes_Agentic')
   * @param eventTypes Array of event types to subscribe to, or ['*'] for all events
   */
  register(subscriptionId: string, consumerName: string, eventTypes: string[]): EventSubscription {
    const subscription: EventSubscription = {
      subscriptionId,
      consumerName,
      eventTypes: eventTypes.length === 0 ? ['*'] : eventTypes,
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Update subscription event type filters
   */
  updateFilters(subscriptionId: string, eventTypes: string[]): EventSubscription | null {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return null;
    }

    subscription.eventTypes = eventTypes.length === 0 ? ['*'] : eventTypes;
    subscription.lastActivityAt = new Date();
    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Remove a subscription
   */
  unregister(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  /**
   * Get all active subscriptions
   */
  getAllSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscriptions interested in a specific event type
   * @param eventType The event type to match (e.g., 'attendance.clock_in')
   * @returns Array of subscription IDs that should receive this event
   */
  getSubscribersForEvent(eventType: string): string[] {
    const subscribers: string[] = [];

    for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
      // Check if subscribed to all events
      if (subscription.eventTypes.includes('*')) {
        subscribers.push(subscriptionId);
        continue;
      }

      // Check if subscribed to this specific event type
      if (subscription.eventTypes.includes(eventType)) {
        subscribers.push(subscriptionId);
        continue;
      }

      // Check for wildcard patterns (e.g., 'attendance.*' matches 'attendance.clock_in')
      const matchesPattern = subscription.eventTypes.some(pattern => {
        if (pattern.endsWith('.*')) {
          const prefix = pattern.slice(0, -2);
          return eventType.startsWith(prefix + '.');
        }
        return false;
      });

      if (matchesPattern) {
        subscribers.push(subscriptionId);
      }
    }

    return subscribers;
  }

  /**
   * Update last activity timestamp for a subscription
   */
  updateActivity(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.lastActivityAt = new Date();
    }
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): EventSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get count of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}
