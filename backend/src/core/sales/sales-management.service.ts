import { Injectable } from "@nestjs/common";
import { ISalesRepository } from "./repositories/sales.repository.interface";
import { SalesAnalytics } from "./entities/sales.entity";
import { TenantContext } from "../../gateway/tenant-context.interface";

@Injectable()
export class SalesManagementService {
  constructor(
    private readonly salesRepository: ISalesRepository,
  ) {}

  async getSalesAnalytics(ctx: TenantContext, period?: string): Promise<SalesAnalytics> {
    return this.salesRepository.getSalesAnalytics(ctx, period);
  }

  async getForecast(ctx: TenantContext): Promise<any> {
    return this.salesRepository.getForecast(ctx);
  }

  async getPipelineVelocity(ctx: TenantContext): Promise<any> {
    return this.salesRepository.getPipelineVelocity(ctx);
  }

  async getSLAPerformance(ctx: TenantContext): Promise<any> {
    return this.salesRepository.getSLAPerformance(ctx);
  }
}
