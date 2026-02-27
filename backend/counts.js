const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function run() {
  const counts = await p.$queryRaw`SELECT 
    (SELECT count(*) FROM product_categories) AS product_categories,
    (SELECT count(*) FROM item_masters) AS item_masters,
    (SELECT count(*) FROM item_variants) AS item_variants,
    (SELECT count(*) FROM inventory_stocks) AS inventory_stocks`;
  console.log(counts);
  const channels = await p.$queryRaw`SELECT id,name,type,status FROM retail_channels WHERE type='headless' ORDER BY created_at DESC LIMIT 5`;
  console.log(channels);
}
run().finally(() => p.$disconnect());
