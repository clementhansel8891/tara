const { PrismaClient } = require("./backend/node_modules/@prisma/client");
const p = new PrismaClient();
async function main(){
  const owners = await p.$queryRawUnsafe(`
    select u.id, u.email, u.first_name, u.last_name, u.status, u.created_at, uc.tenant_id
    from users u
    join user_companies uc on u.id = uc.user_id
    where uc.role='OWNER'
    order by u.created_at;
  `);
  console.log(owners);
}
main().finally(()=>p.$disconnect());
