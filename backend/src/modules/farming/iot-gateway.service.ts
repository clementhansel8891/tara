import { Injectable, Logger } from '@nestjs/common';
import { FarmingRepository as IFarmingRepository, SensorData } from './repositories/farming.repository';
import { TenantContext } from '../../gateway/tenant-context.interface';

@Injectable()
export class IoTGatewayService {
  private readonly logger = new Logger(IoTGatewayService.name);

  constructor(
    private readonly sensorRepo: IFarmingRepository
  ) {}

  /**
   * Primary HTTP JSON Entry Point.
   * Standardizes incoming telemetry before persistence.
   */
  async handleHttpTelemetry(ctx: TenantContext, payload: any, forensicInfo?: { ip?: string; deviceModel?: string }): Promise<{ status: string; ids: string[] }> {
    this.logger.log(`IoT Gateway: Standardizing JSON Telemetry for tenant ${ctx.tenant_id}`);
    
    const readings: Partial<SensorData>[] = Array.isArray(payload) ? payload : [payload];
    
    const processedReadings = readings.map(r => ({
      sensor_id: r.sensor_id,
      sensorType: r.sensorType || 'IOT_GENERIC',
      value: r.value,
      unit: r.unit || 'n/a',
      timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
      metadata: { ...r.metadata, ingestionMethod: 'HTTP_JSON' }
    }));

    const ids = await (this.sensorRepo as any).logSensorReadings(ctx, processedReadings);

    // Auto-anchor critical readings (e.g., integrity check)
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const reading = processedReadings[i];
        
        // Construct SensorData from partial for the audit log
        const fullData: SensorData = {
          id: id,
          tenant_id: ctx.tenant_id,
          sensor_id: reading.sensor_id!,
          sensorType: reading.sensorType || 'GENERIC',
          value: reading.value as any,
          unit: reading.unit || 'n/a',
          timestamp: reading.timestamp || new Date(),
          metadata: reading.metadata || {},
        };

        await this.sensorRepo.logSensorDataToAuditChain(ctx, fullData);
    }

    return { status: 'SUCCESS', ids };
  }

  /**
   * Future MQTT Hook - Placeholder
   * Design is ready for MQTT subscription logic.
   */
  async handleMqttTelemetry(ctx: TenantContext, topic: string, message: Buffer): Promise<void> {
    this.logger.log(`IoT Gateway: MQTT Hook triggered for topic ${topic} (Ready for implementation)`);
    // Parsing and routing logic would go here
  }
}
