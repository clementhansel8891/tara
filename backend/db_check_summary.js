const { PrismaClient } = require("@prisma/client");
const fs = require('fs');
const prisma = new PrismaClient();

async function check() {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, code: true }
    });
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
            select: { id: true, email: true }
    });
    const summary = JSON.stringify({ companies, userCount, users }, null, 2);
    fs.writeFileSync('db_summary_output.json', summary);
    console.log("Summary written to db_summary_output.json");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
