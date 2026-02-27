const { PrismaClient } = require("./node_modules/@prisma/client");
const p = new PrismaClient();
(async () => {
  const res = await p.$queryRaw`select id, sku, name, status from products where tenant_id='03bbc0e0-213d-4af4-9ce8-0e4674a58a8f' and (sku ilike '%e.aro%' or name ilike '%e.aro%' or barcode ilike '%e.aro%') limit 10`;
  console.log('products', res);
  const res2 = await p.$queryRaw`select id, sku, name from item_variants where tenant_id='03bbc0e0-213d-4af4-9ce8-0e4674a58a8f' and sku ilike '%e.aro%' limit 10`;
  console.log('variants', res2);
  await p.$disconnect();
})();
