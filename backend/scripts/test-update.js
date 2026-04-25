const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
  const tenant_id = '89c73c4a-a216-4bd0-b3f7-299f6d3ffbcf';
  const location_id = '0effbc3d-e1b3-49e0-a6d1-2ab3c5623ab1';
  const product_id = '21dd875e-2c20-4d93-8077-37553ef918de';
  const q = 2;

  try {
    const updatedCount = await prisma.$executeRaw`
      UPDATE stock_levels 
      SET on_hand = on_hand - ${q},
          updated_at = NOW()
      WHERE tenant_id = ${tenant_id}
        AND location_id = ${location_id}
        AND product_id = ${product_id}
        AND on_hand >= ${q}
    `;
    console.log(`Updated count: ${updatedCount}`);
    
    // Check if the record actually exists with a select
    const record = await prisma.$queryRaw`
      SELECT * FROM stock_levels 
      WHERE tenant_id = ${tenant_id}
        AND location_id = ${location_id}
        AND product_id = ${product_id}
    `;
    console.log('Record found:', record);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();
