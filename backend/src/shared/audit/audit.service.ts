import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: any, _extra?: any) {
    try {
      // Accept both the new params object and old positional arguments
      const data = typeof params === 'string'
        ? { action_type: params, target_entity_type: 'unknown' }
        : params;
      await this.prisma.auditLog.create({ data });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`);
    }
  }
}
