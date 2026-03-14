import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';

export interface DomainEvent {
  eventType: string;
  tenantId: string;
  entityId: string;
  entityType: string;
  sourceModule: string;
  payload: any;
  userId?: string;
  correlationId?: string;
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
   * Persists to the DomainEvent table (Event Store) and notifies listeners.
   */
  async publish(event: DomainEvent) {
    this.logger.log(`Publishing event: ${event.eventType} for tenant ${event.tenantId} from ${event.sourceModule}`);

    try {
      // 1. Persist event to the dedicated Event Store (DomainEvent table)
      await this.prisma.domainEvent.create({
        data: {
          tenantId: event.tenantId,
          eventType: event.eventType,
          sourceModule: event.sourceModule,
          entityType: event.entityType,
          entityId: event.entityId,
          payload: event.payload,
          userId: event.userId ?? null,
        },
      });

      // 2. Dispatch to internal async listeners
      this.listeners.forEach(listener => {
        try {
          // Wrap in setImmediate to ensure async execution if needed, 
          // but for now simple forEach is fine as long as listeners handle their own async work.
          listener(event);
        } catch (error) {
          this.logger.error(`Error in event listener: ${error.message}`);
        }
      });

    } catch (error) {
      this.logger.error(`Failed to persist domain event ${event.eventType}: ${error.message}`);
    }
  }
}
