import { TenantContext } from "../../../gateway/tenant-context.interface";
import { Prisma } from '@prisma/client';

export interface TelemetryReading {
  sensor_id: string;
  sensor_type: string;
  value: Prisma.Decimal;
  unit: string;
  timestamp: Date;
  metadata?: any;
}

export abstract class IIoTRepository {
  /**
   * High-Frequency Ingestion (Operational Sub-system).
   * Persists full record to specialized storage.
   */
  abstract logTelemetry( ctx: TenantContext, 
    readings: TelemetryReading[]
  ): Promise<string[]>;

  /**
   * Retrieves full history for specialized audit/analysis.
   */
  abstract getFullHistory( ctx: TenantContext,
    sensor_id: string,
    timeframe: { start: Date; end: Date }
  ): Promise<TelemetryReading[]>;

  /**
   * Normalization Hook: Aggregates high-frequency data for main system reporting.
   */
  abstract getAggregatedReport( ctx: TenantContext,
    sensor_id: string,
    interval: 'HOUR' | 'DAY',
    timeframe: { start: Date; end: Date }
  ): Promise<any>;
}
