const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const p = new PrismaClient();
const tenant='03bbc0e0-213d-4af4-9ce8-0e4674a58a8f';
async function run(){
  const [prods] = await p.$queryRaw`select count(*)::int as c from products where tenant_id=${tenant}`;
  const [items] = await p.$queryRaw`select count(*)::int as c from item_masters where tenant_id=${tenant}`;
  console.log({products: prods.c, item_masters: items.c});
}
run().finally(()=>p.$disconnect());
