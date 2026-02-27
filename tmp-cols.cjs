const { PrismaClient } = require("./backend/node_modules/@prisma/client");
const p = new PrismaClient();
async function run(){
  const cols = await p.$queryRaw`select column_name, data_type from information_schema.columns where table_schema='public' and table_name='item_variants' order by ordinal_position`;
  const cols2 = await p.$queryRaw`select column_name, data_type from information_schema.columns where table_schema='public' and table_name='item_masters' order by ordinal_position`;
  console.log('item_variants', cols);
  console.log('item_masters', cols2);
}
run().finally(()=>p.$disconnect());
