const { PrismaClient } = require("./backend/node_modules/@prisma/client");
const p = new PrismaClient();
const TENANT='03bbc0e0-213d-4af4-9ce8-0e4674a58a8f';
async function main(){
  const users = await p.$queryRawUnsafe(`
    select u.id, u.email, u.first_name, u.last_name, u.status, u.created_at, uc.role, uc.is_default
    from users u
    join user_companies uc on u.id = uc.user_id
    where uc.tenant_id = '${TENANT}'
    order by uc.role, u.created_at;
  `);
  console.log('users_for_tenant', users);
}
main().finally(()=>p.$disconnect());
