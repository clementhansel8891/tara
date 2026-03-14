import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';

export interface DomainEvent {
  eventType: string;
  tenantId: string;
  entityId: string;
  payload: any;
  userId?: string;
  createdAt?: Date;
}

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private listeners: ((event: DomainEvent) => void)[] = [];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Subscribe to domain events.
   */
  subscribe(callback: (event: DomainEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Publish a domain event.
   * Currently uses PostgreSQL persistence (SystemLog fallback) as the event store.
   * Can be extended to Redis Streams as per architecture spec.
   */
  async publish(event: DomainEvent) {
    this.logger.log(`Publishing event: ${event.eventType} for tenant ${event.tenantId}`);

    // Persist event to the database (PostgreSQL event table pattern)
    // We use SystemLog as the generic event store for now to avoid immediate schema migrations,
    // but categorize it as 'EVENT' level.
    try {
      await this.prisma.systemLog.create({
        data: {
          tenantId: event.tenantId,
          module: 'EVENT_BUS',
          level: 'event',
          event: event.eventType,
          message: `Event: ${event.eventType}`,
          userId: event.userId,
          payload: {
            eventType: event.eventType,
            entityId: event.entityId,
            payload: event.payload,
            publishedAt: new Date().toISOString(),
          },
        },
      });

      // Dispatch to internal listeners
      this.listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          this.logger.error(`Error in event listener: ${error.message}`);
        }
      });

    } catch (error) {
      this.logger.error(`Failed to persist event ${event.eventType}: ${error.message}`);
    }
  }
}
