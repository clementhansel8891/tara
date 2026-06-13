import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../persistence/prisma.service";
import { AuditService, AuditLogParams } from "../../../shared/audit/audit.service";
import {
  EventBusService,
  DomainEvent,
} from "../../../shared/events/event-bus.service";

/**
 * Options accepted by an Atomic_Operation, mirroring the subset of
 * `prisma.$transaction` interactive-transaction options that HR operations use.
 */
export interface AtomicOperationOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * The context handed to the body of an Atomic_Operation. It carries the active
 * transaction client plus `tx`-bound convenience wrappers so that repository
 * writes, audit logs, and domain events all enrol in the SAME transaction and
 * therefore commit or roll back together (Requirements 4.1, 4.2, 4.4).
 */
export interface AtomicContext {
  /** The active Prisma transaction client. Pass this to repository writes. */
  tx: Prisma.TransactionClient;
  /** Write an audit log inside the current transaction. */
  audit: (params: AuditLogParams) => Promise<any>;
  /** Publish a domain event inside the current transaction. */
  publish: (event: DomainEvent) => Promise<any>;
}

/**
 * Atomic_Operation helper.
 *
 * A thin convention around `prisma.$transaction(async (tx) => …)` that threads a
 * single transaction client through every write performed by an HR operation —
 * repository writes, {@link AuditService.log}, and {@link EventBusService.publish}.
 * If any write inside the body throws, the whole operation rolls back and no
 * record, audit log, or domain event is persisted.
 *
 * This codifies the pattern that `SchedulingService` already follows for
 * schedule create/approve (the reference template) so that other services
 * (notably the payroll lifecycle) can adopt it without re-deriving the wiring.
 *
 * @example
 * return this.atomic.run(async ({ tx, audit, publish }) => {
 *   const schedule = await this.hrRepository.createWorkSchedule(tenant_id, data, tx);
 *   await audit({
 *     tenant_id, user_id, module: "HR", action: "CREATE",
 *     entity_type: "WORK_SCHEDULE", entity_id: schedule.id, after_state: schedule,
 *   });
 *   await publish({
 *     event_type: "hr.schedule.created.v1", tenant_id, entity_id: schedule.id,
 *     entity_type: "WORK_SCHEDULE", source_module: "HR", user_id, payload: { ... },
 *   });
 *   return schedule;
 * });
 */
@Injectable()
export class AtomicOperationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Execute `work` inside a single database transaction. The supplied
   * {@link AtomicContext} exposes the transaction client and `tx`-bound audit
   * and event helpers, guaranteeing that all writes share one Atomic_Operation.
   *
   * Any exception thrown inside `work` rolls back the entire transaction.
   */
  async run<T>(
    work: (ctx: AtomicContext) => Promise<T>,
    options?: AtomicOperationOptions,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ctx: AtomicContext = {
        tx,
        audit: (params: AuditLogParams) => this.auditService.log(params, tx),
        publish: (event: DomainEvent) => this.eventBus.publish(event, tx),
      };
      return work(ctx);
    }, options);
  }
}
