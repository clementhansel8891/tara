import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log("Starting report migration cleanup...");
  
  const reports = await prisma.explorer_files.findMany({
    where: {
      metadata: {
        path: ['type'],
        equals: 'STOCK_OPNAME_REPORT'
      },
      deleted_at: null
    }
  });

  console.log(`Found ${reports.length} reports to analyze.`);

  for (const report of reports) {
    const meta: any = report.metadata;
    if (!meta.location || !meta.timestamp) {
      console.log(`Skipping report ${report.name} (missing location or timestamp)`);
      continue;
    }

    const date = new Date(meta.timestamp);
    const year = date.getFullYear().toString();
    const month = date.toLocaleString('default', { month: 'long' });
    const pathParts = ["Stock Opname Reports", meta.location, year, month];

    let parent_id: string | null = null;
    
    // Ensure the folder path exists
    for (const part of pathParts) {
      const existing = await prisma.explorer_folders.findFirst({
        where: { 
          tenant_id: report.tenant_id, 
          name: part, 
          parent_id: parent_id 
        }
      });
      
      let currentId: string;
      if (!existing) {
        console.log(`Creating folder: ${part} under parent ${parent_id || 'root'}`);
        const created = await prisma.explorer_folders.create({
          data: { 
            tenant_id: report.tenant_id, 
            name: part, 
            parent_id: parent_id, 
            access_level: 'shared' 
          }
        });
        currentId = created.id;
      } else {
        currentId = existing.id;
      }
      parent_id = currentId;
    }

    // Move the file if it's not already there
    if (report.folder_id !== parent_id) {
      await prisma.explorer_files.update({
        where: { id: report.id },
        data: { folder_id: parent_id }
      });
      console.log(`✅ Moved report "${report.name}" to ${pathParts.join(' > ')}`);
    } else {
      console.log(`ℹ️ Report "${report.name}" is already in the correct folder.`);
    }
  }
  
  console.log("Cleanup migration complete.");
}

cleanup()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
