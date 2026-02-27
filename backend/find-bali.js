const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function run(){
  const store = await p.location.findMany({where:{name:{contains:"Bali", mode:"insensitive"}}});
  console.log(store);
}
run().finally(()=>p.$disconnect());
