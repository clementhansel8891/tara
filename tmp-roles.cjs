const { PrismaClient } = require("./backend/node_modules/@prisma/client");
const p = new PrismaClient();
async function main(){
  const roles = await p.$queryRawUnsafe(`select distinct role from user_companies`);
  console.log(roles);
}
main().finally(()=>p.$disconnect());
