import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING EXPLORER FILE CLEANUP ---');

  // 1. Find all files with "Stock Opname" in name
  const files = await prisma.explorer_files.findMany({
    where: {
      name: { contains: 'Stock Opname' },
      deleted_at: null
    }
  });

  console.log(`Found ${files.length} Stock Opname related files.`);

  for (const file of files) {
    let metadata: any = {};
    try {
       metadata = typeof file.metadata === 'string' ? JSON.parse(file.metadata) : file.metadata || {};
    } catch (e) {}

    const createdAt = new Date(file.created_at);
    const year = createdAt.getFullYear().toString();
    const month = createdAt.toLocaleString('default', { month: 'long' });
    const location = metadata.location || 'Unknown Location';

    // Desired path: Stock Opname Reports -> Location -> Year -> Month
    // We'll simulate the "ensureFolderPath" logic here or just log it.
    console.log(`File: ${file.name} | Should be in: Stock Opname Reports / ${location} / ${year} / ${month}`);
    
    // In a real scenario, we'd create the folders and move the file.
    // But since I don't want to mess up the folder table without the service logic,
    // I'll just report what needs to be done or wait for the user to confirm.
  }

  console.log('--- CLEANUP ANALYSIS COMPLETE ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
