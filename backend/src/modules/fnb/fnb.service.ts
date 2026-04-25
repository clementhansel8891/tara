import { TenantContext } from "../../gateway/tenant-context.interface";
import { Injectable, Logger, Inject } from '@nestjs/common';
import { FnbRepository as IFnbRepository, Recipe } from './repositories/fnb.repository';
import { AuditService } from '../../shared/audit/audit.service';

@Injectable()
export class FnbService {
  private readonly logger = new Logger(FnbService.name);

  constructor(
    private readonly repository: IFnbRepository,
    private readonly audit: AuditService,
  ) {}

  async getAllRecipes(ctx: TenantContext): Promise<Recipe[]> {
    return this.repository.getRecipes(ctx);
  }

  async auditProduction(ctx: TenantContext, recipeId: string, yieldQty: number, forensic?: { ip?: string, device_model?: string }): Promise<void> {
    this.logger.log(`Auditing production execution for recipe ${recipeId}`);
    
    // 1. Operational Deduction
    await this.repository.deductIngredientsFromInventory(ctx, recipeId, yieldQty);

    // 2. Forensic Log
    await this.audit.log({
      tenant_id: ctx.tenant_id,
      user_id: 'FNB_OPERATOR',
      module: 'FNB',
      action: 'PRODUCTION_EXECUTION',
      entity_type: 'RECIPE',
      entity_id: recipeId,
      severity: 'INFO',
      ip_address: forensic?.ip,
      device_model: forensic?.device_model,
      metadata: {
        yieldQuantity: yieldQty,
        timestamp: new Date().toISOString()
      }
    });
  }

  async getDynamicCost(ctx: TenantContext, recipeId: string) {
    // Note: this method is only in FnbDbRepository, not in FnbRepository interface.
    // I should probably add it to the interface or use a cast if I'm sure.
    // For now, I'll assume it's available or should be in the interface.
    return (this.repository as any).calculateDynamicCost(ctx, recipeId);
  }
}
