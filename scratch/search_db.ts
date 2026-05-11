
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const searchTerm = process.argv[2] || 'Anchor';
  console.log(`Searching for: ${searchTerm}`);

  const tables = [
    'locations',
    'stores',
    'companies',
    'departments',
    'item_masters',
    'tenants',
  ];

  for (const table of tables) {
    try {
      const records = await (prisma as any)[table].findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { code: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      });

      if (records.length > 0) {
        console.log(`Table ${table}: Found ${records.length} records`);
        console.log(JSON.stringify(records, null, 2));
      }
    } catch (e) {
      // console.error(`Failed to search table ${table}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
