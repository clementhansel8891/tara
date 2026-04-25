import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { FarmingRepository as IFarmingRepository, SensorData } from './farming.repository';
import { AuditService } from '../../../shared/audit/audit.service';
import { v4 as uuidv4 } from 'uuid';
import { TenantContext } from '../../../gateway/tenant-context.interface';
import { MultiTenancyUtil } from '../../../shared/utils/multi-tenancy.util';

@Injectable()
export class FarmingDbRepository extends IFarmingRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async getSensorLogs(ctx: TenantContext, sensor_id: string): Promise<SensorData[]> {
    const raw = await (this.prisma as any).farmingSensorLog.findMany({
      where: { 
          ...MultiTenancyUtil.getScope(ctx),
          sensor_id,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return raw.map((r: any) => this.mapSensor(r));
  }

  async logSensorDataToAuditChain(ctx: TenantContext, data: SensorData): Promise<string> {
    const event = await this.auditService.log({
      tenant_id: ctx.tenant_id,
      user_id: 'IOT_GATEWAY',
      module: 'FARMING_IOT',
      action: 'SENSOR_ANCHOR',
      entity_type: "SENSOR_READING",
      entity_id: data.id,
      severity: Number(data.value) > 40 ? 'WARN' : 'INFO',
      metadata: {
        rawReading: data.value,
        unit: data.unit,
        sensor_id: data.sensor_id,
        readingCapturedAt: data.timestamp
      },
    });
    return event.id;
  }

  async logSensorReadings(ctx: TenantContext, readings: Partial<SensorData>[]): Promise<string[]> {
    const ids: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const reading of readings) {
        const id = uuidv4();
        ids.push(id);
        
        await (tx as any).farmingSensorLog.create({
          data: {
            id,
            updated_at: new Date(),
            ...MultiTenancyUtil.getScope(ctx),
            sensor_id: reading.sensor_id!,
            sensorType: reading.sensorType || 'GENERIC',
            value: reading.value || 0,
            unit: reading.unit || 'n/a',
            timestamp: reading.timestamp || new Date(),
            metadata: reading.metadata || {},
          },
        });
      }
    });

    return ids;
  }

  private mapSensor(r: any): SensorData {
    return {
      id: r.id,
      tenant_id: r.tenant_id,
      sensor_id: r.sensor_id,
      sensorType: r.sensorType,
      value: r.value,
      unit: r.unit,
      timestamp: r.timestamp,
      metadata: r.metadata,
    };
  }
}
