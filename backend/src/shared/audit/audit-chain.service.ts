import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';
import { AuditService } from './audit.service';
import { createHash } from 'crypto';

@Injectable()
export class AuditChainService {
  private readonly logger = new Logger(AuditChainService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Fix 2: Safe Repair Mode (MANDATORY)
   * Detects and repairs broken audit chains without silent overwrites.
   */
  async repairChain(
    tenantId: string, 
    userId: string, 
    approval: { approvedBy: string; reason: string },
    fromTimestamp?: Date
  ) {
    this.logger.log(`[AuditChainService] Starting chain repair for tenant ${tenantId}. Requested by: ${userId}, Approved by: ${approval.approvedBy}`);

    // Step 3: Repair Authorization Hardened Log
    await this.audit.log({
      tenantId,
      userId,
      module: 'SYSTEM',
      action: 'AUDIT_CHAIN_REPAIR_REQUEST',
      entityType: 'AUDIT_CHAIN',
      entityId: tenantId,
      severity: 'WARN',
      metadata: { 
        ...approval,
        requestedTimestamp: new Date().toISOString(),
      },
    });

    this.audit.incrementRepairCount();

    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: fromTimestamp ? { gte: fromTimestamp } : undefined,
      },
      orderBy: { createdAt: 'asc' },
    });

    let corruptionDetected = false;
    let repairedCount = 0;
    let lastHash = 'GENESIS';

    // If starting from a point, find the hash of the entry just before it
    if (fromTimestamp) {
      const prevLog = await this.prisma.auditLog.findFirst({
        where: {
          tenantId,
          createdAt: { lt: fromTimestamp },
        },
        orderBy: { createdAt: 'desc' },
        select: { hashChain: true },
      });
      lastHash = prevLog?.hashChain || 'GENESIS';
    }

    const affectedRange = {
      startId: logs[0]?.id,
      endId: logs[logs.length - 1]?.id,
    };

    for (const log of logs) {
      const expectedPrevHash = lastHash;
      
      // Check for corruption
      if (log.previousHash !== expectedPrevHash) {
        corruptionDetected = true;
        
        // Recompute the correct hash for this entry
        const logData = JSON.stringify({
          tenantId: log.tenantId,
          userId: log.userId,
          action: log.action,
          entityId: log.entityId,
          correlationId: log.correlationId,
          previousHash: expectedPrevHash,
        });
        const recomputedHash = createHash('sha256').update(logData).digest('hex');

        // Update with safe repair tracking
        await this.prisma.auditLog.update({
          where: { id: log.id },
          data: {
            status: 'REPAIRED',
            originalHash: log.hashChain,
            recomputedHash: recomputedHash,
            previousHash: expectedPrevHash,
            hashChain: recomputedHash,
          },
        });

        this.logger.warn(`[AuditChainService] Repaired log ${log.id}. Found mismatch: ${log.previousHash} !== ${expectedPrevHash}`);
        repairedCount++;
        lastHash = recomputedHash;
      } else {
        lastHash = log.hashChain || 'CORRUPT_NULL';
      }
    }

    // Requirement: Audit event for repair
    await this.audit.log({
      tenantId,
      userId,
      module: 'SYSTEM',
      action: 'AUDIT_CHAIN_REPAIR',
      entityType: 'AUDIT_CHAIN',
      entityId: tenantId,
      severity: 'CRITICAL', // Fix 2: Mandatory Critical Severity
      metadata: {
        affectedRange,
        repairedCount,
        corruptionDetected,
        triggeredBy: userId,
      },
    });

    return {
      success: true,
      corruptionDetected,
      repairedCount,
      affectedRange,
    };
  }
}
