import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { EventSubscriptionRegistry } from './event-subscription.registry';

/**
 * Event Stream Gateway
 * WebSocket gateway for external consumers to subscribe to TARA event stream
 * Requirements: 21.8, 21.14
 * 
 * Usage:
 * 1. Connect to WebSocket: ws://host:port/event-stream
 * 2. Send 'subscribe' message with event type filters
 * 3. Receive real-time events matching your filters
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'event-stream',
})
@Injectable()
export class EventStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventStreamGateway.name);
  private readonly registry = new EventSubscriptionRegistry();

  /**
   * Handle new WebSocket connection
   */
  handleConnection(client: Socket) {
    const consumerName = client.handshake.query.consumerName as string || 'Unknown';
    const subscriptionId = client.id;

    this.logger.log(`[EVENT_STREAM] New connection: ${subscriptionId} (consumer: ${consumerName})`);

    // Register with default subscription to no events (client must explicitly subscribe)
    this.registry.register(subscriptionId, consumerName, []);

    // Send connection confirmation
    client.emit('connected', {
      subscriptionId,
      message: 'Connected to TARA Event Stream',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnect(client: Socket) {
    const subscriptionId = client.id;
    const subscription = this.registry.getSubscription(subscriptionId);

    this.logger.log(`[EVENT_STREAM] Client disconnected: ${subscriptionId} (consumer: ${subscription?.consumerName})`);
    this.registry.unregister(subscriptionId);
  }

  /**
   * Handle subscription request from client
   * Message format: { eventTypes: string[] }
   * Example: { eventTypes: ['attendance.clock_in', 'leave.request.*'] }
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventTypes?: string[] },
  ) {
    const subscriptionId = client.id;
    const eventTypes = payload.eventTypes || ['*'];

    this.logger.log(`[EVENT_STREAM] Subscribe request from ${subscriptionId}: ${JSON.stringify(eventTypes)}`);

    const subscription = this.registry.updateFilters(subscriptionId, eventTypes);

    if (!subscription) {
      client.emit('error', {
        message: 'Subscription not found',
        subscriptionId,
      });
      return;
    }

    client.emit('subscribed', {
      subscriptionId,
      eventTypes: subscription.eventTypes,
      message: 'Successfully subscribed to event types',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle unsubscribe request
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    const subscriptionId = client.id;
    
    this.logger.log(`[EVENT_STREAM] Unsubscribe request from ${subscriptionId}`);
    
    // Set to empty array (no events)
    this.registry.updateFilters(subscriptionId, []);

    client.emit('unsubscribed', {
      subscriptionId,
      message: 'Unsubscribed from all events',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get subscription status
   */
  @SubscribeMessage('status')
  handleStatus(@ConnectedSocket() client: Socket) {
    const subscriptionId = client.id;
    const subscription = this.registry.getSubscription(subscriptionId);

    if (!subscription) {
      client.emit('error', {
        message: 'Subscription not found',
        subscriptionId,
      });
      return;
    }

    client.emit('status', {
      subscriptionId,
      consumerName: subscription.consumerName,
      eventTypes: subscription.eventTypes,
      createdAt: subscription.createdAt,
      lastActivityAt: subscription.lastActivityAt,
    });
  }

  /**
   * Broadcast an event to all subscribed consumers
   * This method is called by the EventBusService when events are published
   * Requirement 21.12: Deliver events within 500ms of emission
   */
  broadcastEvent(eventType: string, event: any) {
    const subscribers = this.registry.getSubscribersForEvent(eventType);

    if (subscribers.length === 0) {
      return; // No subscribers for this event type
    }

    this.logger.debug(`[EVENT_STREAM] Broadcasting ${eventType} to ${subscribers.length} subscribers`);

    // Prepare event payload
    const eventPayload = {
      event_id: event.id,
      event_type: eventType,
      timestamp: event.created_at || new Date().toISOString(),
      tenant_id: event.tenant_id,
      actor_id: event.user_id,
      entity_id: event.entity_id,
      entity_type: event.entity_type,
      payload: event.payload,
      correlation_id: event.correlation_id,
      version: event.version || 1,
    };

    // Send to each subscriber
    subscribers.forEach(subscriptionId => {
      try {
        this.server.to(subscriptionId).emit('event', eventPayload);
        this.registry.updateActivity(subscriptionId);
      } catch (error) {
        this.logger.error(`[EVENT_STREAM] Failed to send event to ${subscriptionId}: ${error.message}`);
      }
    });
  }

  /**
   * Get current subscription statistics
   */
  getStats() {
    const subscriptions = this.registry.getAllSubscriptions();
    
    return {
      totalSubscriptions: this.registry.getSubscriptionCount(),
      subscriptionsByConsumer: subscriptions.reduce((acc, sub) => {
        acc[sub.consumerName] = (acc[sub.consumerName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      subscriptions: subscriptions.map(sub => ({
        subscriptionId: sub.subscriptionId,
        consumerName: sub.consumerName,
        eventTypes: sub.eventTypes,
        createdAt: sub.createdAt,
        lastActivityAt: sub.lastActivityAt,
      })),
    };
  }
}
