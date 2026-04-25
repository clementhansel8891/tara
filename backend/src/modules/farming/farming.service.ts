import { TenantContext } from "../../gateway/tenant-context.interface";
import { Injectable, Logger } from '@nestjs/common';
import { FarmingRepository as IFarmingRepository, SensorData } from './repositories/farming.repository';

@Injectable()
export class FarmingService {
  private readonly logger = new Logger(FarmingService.name);

  constructor(
    private readonly repository: IFarmingRepository
  ) {}

  async getLogs(ctx: TenantContext, sensor_id: string): Promise<SensorData[]> {
    return this.repository.getSensorLogs(ctx, sensor_id);
  }

  async logReading(ctx: TenantContext, data: Partial<SensorData>): Promise<string> {
    this.logger.log(`Anchoring IoT Reading for sensor ${data.sensor_id} into Audit Chain`);
    // Note: logSensorReadings and logSensorDataToAuditChain are used here.
    // I need to ensure they are available in the interface or use a cast.
    const ids = await (this.repository as any).logSensorReadings(ctx, [data]);
    
    // Construct SensorData from partial for the audit log
    const fullData: SensorData = {
      id: ids[0],
      tenant_id: ctx.tenant_id,
      sensor_id: data.sensor_id!,
      sensorType: data.sensorType || 'GENERIC',
      value: data.value as any,
      unit: data.unit || 'n/a',
      timestamp: data.timestamp || new Date(),
      metadata: data.metadata || {},
    };
    
    await this.repository.logSensorDataToAuditChain(ctx, fullData);
    return ids[0];
  }
}
