import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

async function activateModule(prisma: PrismaClient, name: string, tenantId: string) {
  console.log(`Working on ${name}...`);
  try {
    // Verify tenant exists
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId }
    });
    console.log(`Tenant details in ${name}:`, tenant);

    if (!tenant) {
      console.log(`Warning: Tenant ${tenantId} not found in ${name}.`);
    }

    // List existing module statuses for this tenant
    const existingStatuses = await prisma.admin_module_statuses.findMany({
      where: { tenant_id: tenantId }
    });
    console.log(`Current active modules for ${tenantId} in ${name}:`, existingStatuses.map(s => `${s.module_key}: ${s.enabled}`));

    // Modules to enable
    const modules = [
      'retail', 'finance', 'hr', 'it', 'it-settings', 'settings',
      'admin', 'procurement', 'sales', 'inventory', 'marketing', 'payment'
    ];

    for (const mod of modules) {
      await prisma.admin_module_statuses.upsert({
        where: {
          tenant_id_module_key: {
            tenant_id: tenantId,
            module_key: mod
          }
        },
        update: {
          enabled: true,
          updated_by: 'system',
          updated_at: new Date()
        },
        create: {
          id: uuidv4(),
          tenant_id: tenantId,
          module_key: mod,
          enabled: true,
          updated_by: 'system',
          updated_at: new Date()
        }
      });
      console.log(`Upserted and enabled module: ${mod}`);
    }

    // Verify updated status
    const updatedStatuses = await prisma.admin_module_statuses.findMany({
      where: { tenant_id: tenantId }
    });
    console.log(`Updated active modules for ${tenantId} in ${name}:`, updatedStatuses.map(s => `${s.module_key}: ${s.enabled}`));

  } catch (err: any) {
    console.error(`Operation on ${name} failed:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const tenantId = "tnt-3rlhko";

  const localPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://zenvix:zenvix_secure_2026!@localhost:5432/zenvix_prod?schema=public"
      }
    }
  });

  const prodPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://zenvix:zenvix_secure_2026!@150.109.15.108:5433/zenvix_prod?schema=public"
      }
    }
  });

  await activateModule(localPrisma, "Local Database (5432)", tenantId);
  console.log('\n-----------------------------------------\n');
  await activateModule(prodPrisma, "Production VPS Database (5433)", tenantId);
}

run();
