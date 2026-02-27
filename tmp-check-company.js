const { PrismaClient } = require("./backend/node_modules/@prisma/client");
const p = new PrismaClient();
async function main(){
  const companies = await p.$queryRawUnsafe(`select id, name, code, status, created_at from companies order by created_at desc limit 10`);
  console.log('companies', companies);
  const perTenant = await p.$queryRawUnsafe(`select tenant_id, count(*) as item_variants from item_variants group by tenant_id order by item_variants desc limit 5`);
  console.log('item_variants per tenant', perTenant);
  const perTenantMasters = await p.$queryRawUnsafe(`select tenant_id, count(*) as item_masters from item_masters group by tenant_id order by item_masters desc limit 5`);
  console.log('item_masters per tenant', perTenantMasters);
  const perTenantCats = await p.$queryRawUnsafe(`select tenant_id, count(*) as categories from product_categories group by tenant_id order by categories desc limit 5`);
  console.log('product_categories per tenant', perTenantCats);
  const zenvix = await p.$queryRawUnsafe(`select * from companies where name ilike 'zenvix%' or code ilike 'zenvix%'`);
  console.log('zenvix company', zenvix);
}
main().finally(()=>p.$disconnect());
