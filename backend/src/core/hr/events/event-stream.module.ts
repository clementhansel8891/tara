import { Module, OnModuleInit } from '@nestjs/common';
import { EventStreamGateway } from './event-stream.gateway';
import { SessionDataPushGateway } from './session-data-push.gateway';
import { EventSubscriptionController } from './event-subscription.controller';
import { EventBusService } from '../services/event-bus.service';

/**
 * Event Stream Module
 * Provides WebSocket-based event streaming for external consumers and
 * session-aware data push for active user sessions.
 *
 * Requirements: 21.8, 21.14, 13.7
 * - EventStreamGateway: external consumer event stream (Hermes Agentic)
 * - SessionDataPushGateway: propagates data updates to active UI sessions within 10s
 */
@Module({
  providers: [EventStreamGateway, SessionDataPushGateway],
  controllers: [EventSubscriptionController],
  exports: [EventStreamGateway, SessionDataPushGateway],
})
export class EventStreamModule implements OnModuleInit {
  constructor(
    private readonly eventStreamGateway: EventStreamGateway,
    private readonly eventBusService: EventBusService,
  ) {}

  /**
   * Connect the gateway to the event bus on module initialization
   * This allows the EventBusService to broadcast events to external consumers
   */
  onModuleInit() {
    this.eventBusService.setExternalEventGateway(this.eventStreamGateway);
  }
}
