import { Injectable, Logger } from '@nestjs/common';
import { IProcurementWorkflow } from './procurement-workflow.interface';
import { Requisition } from '../entities/requisition.entity';
import { IProcurementRepository } from '../repositories/procurement.repository.interface';
import { TenantContext } from '../../../gateway/tenant-context.interface';

@Injectable()
export class DirectWorkflow implements IProcurementWorkflow {
  private readonly logger = new Logger(DirectWorkflow.name);

  constructor(
    private readonly repository: IProcurementRepository,
  ) {}

  getMode(): 'DIRECT' | 'BIDDING' {
    return 'DIRECT';
  }

  async processApprovedRequisitions(ctx: TenantContext, requisition: Requisition): Promise<void> {
    this.logger.log(`Processing DIRECT procurement for requisition: ${requisition.id}`);
    
    await this.repository.createAuditEvent(
        ctx,
        'system',
        'WORKFLOW_DIRECT_TRIGGERED',
        'requisition',
        requisition.id,
        'Direct procurement mode active. Requisition is ready for PO creation.'
    );
  }
}
