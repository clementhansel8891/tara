import { PrismaClient } from '@prisma/client';
import { AuditService } from './shared/audit/audit.service';
import { PrismaService } from './persistence/prisma.service';

async function main() {
  const prisma = new PrismaService();
  const auditService = new AuditService(prisma);

  const tenantId = 'tnt-pfzurx';
  console.log(`[REPAIR] Starting audit chain repair for tenant: ${tenantId}`);
  
  const result = await auditService.repairChain({
    tenant_id: tenantId,
    actor_id: 'system-fix-cli',
    reason: 'Manual repair triggered to resolve detected chain corruption on production VPS',
  });

  console.log('[REPAIR] Result:', result);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('[REPAIR] Failed:', err);
  process.exit(1);
});
