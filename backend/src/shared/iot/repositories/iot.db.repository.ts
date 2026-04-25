import { TenantContext } from "../../../gateway/tenant-context.interface";
import { MultiTenancyUtil } from "../../../shared/utils/multi-tenancy.util";
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { IIoTRepository, TelemetryReading } from './iot.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IoTDbRepository implements IIoTRepository {
  private readonly logger = new Logger(IoTDbRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * High-Frequency Ingestion.
   * In production, this would hit an operational DB (e.g. TimescaleDB).
   * Here we use the specialized `farming_sensor_logs` as our operational table.
   */
  async logTelemetry(ctx: TenantContext, readings: TelemetryReading[]): Promise<string[]> {
    const ids: string[] = [];

    // Use a separate transaction pattern to avoid blocking the main system threads
    await this.prisma.$transaction(async (tx) => {
      for (const reading of readings) {
        const id = uuidv4();
        ids.push(id);

        // Note: Using (tx as any) to access the industry-specific table as a generic operational store
        await (tx as any).farmingSensorLog.create({
          data: {
            id,
            ...MultiTenancyUtil.getScope(ctx),
            sensor_id: reading.sensor_id,
            sensor_type: reading.sensor_type,
            value: reading.value,
            unit: reading.unit,
            timestamp: reading.timestamp || new Date(),
            metadata: reading.metadata || {},
          },
        });
      }
    });

    return ids;
  }

  async getFullHistory(ctx: TenantContext, sensor_id: string, timeframe: { start: Date; end: Date }): Promise<TelemetryReading[]> {
    return (this.prisma as any).farmingSensorLog.findMany({
      where: {
        ...MultiTenancyUtil.getScope(ctx),
        sensor_id,
        timestamp: { gte: timeframe.start, lte: timeframe.end },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Normalization Agent: Aggregates operational data for the Main DB.
   */
  async getAggregatedReport(ctx: TenantContext, sensor_id: string, interval: 'HOUR' | 'DAY', timeframe: { start: Date; end: Date }): Promise<any> {
    // This simulates the "normalization" mentioned by the user.
    // In a real system, this would be a specialized SQL aggregation query.
    const logs = await this.getFullHistory(ctx, sensor_id, timeframe);
    
    if (logs.length === 0) return null;

    const values = logs.map(l => Number(l.value));
    return {
        sensor_id,
        count: logs.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        normalized_at: new Date().toISOString(),
    };
  }
}
