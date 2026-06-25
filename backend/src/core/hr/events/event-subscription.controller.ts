import { Controller, Get, UseGuards } from '@nestjs/common';
import { EventStreamGateway } from './event-stream.gateway';

/**
 * Event Subscription Controller
 * REST API for monitoring event subscriptions and statistics
 * Requirements: 21.8, 21.14
 */
@Controller('api/events/subscriptions')
export class EventSubscriptionController {
  constructor(private readonly eventStreamGateway: EventStreamGateway) {}

  /**
   * Get current subscription statistics
   * Shows active consumers and their subscription details
   */
  @Get('stats')
  getSubscriptionStats() {
    return this.eventStreamGateway.getStats();
  }

  /**
   * Health check endpoint for event streaming service
   */
  @Get('health')
  getHealth() {
    const stats = this.eventStreamGateway.getStats();
    return {
      status: 'healthy',
      service: 'event-stream',
      activeSubscriptions: stats.totalSubscriptions,
      timestamp: new Date().toISOString(),
    };
  }
}
