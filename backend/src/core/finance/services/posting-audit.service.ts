import { Injectable, Logger } from '@nestjs/common';
import { PostingState, StateTransition } from '../domain/posting-gateway.interfaces';

@Injectable()
export class PostingAuditService {
  private readonly logger = new Logger(PostingAuditService.name);

  /**
   * Records a state transition for a posting request.
   */
  async recordTransition(requestId: string, from: PostingState, to: PostingState, reason?: string): Promise<StateTransition> {
    const transition: StateTransition = {
      from,
      to,
      timestamp: new Date(),
      reason,
    };

    this.logger.log(`[Audit] Request ${requestId}: ${from} -> ${to} ${reason ? `(${reason})` : ''}`);
    
    // In production, this would persist to a specialized Audit table
    return transition;
  }

  /**
   * Captures operational metrics for Prometheus/Grafana.
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>) {
    // Simulated metric capture
    this.logger.debug(`[Metric] ${name}: ${value} ${labels ? JSON.stringify(labels) : ''}`);
  }

  /**
   * General ledger event logging (Phase 11 Standard).
   */
  async log(params: {
    tenantId: string;
    companyId: string;
    module: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: any;
  }) {
    this.logger.log(`[AuditLog] ${params.action} on ${params.entityType}:${params.entityId} (Company: ${params.companyId})`);
  }
}
