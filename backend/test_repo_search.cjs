require("dotenv").config({ path: "../.env" });
const { PrismaClient } = require("@prisma/client");
const {
  RetailDbRepository,
} = require("./src/core/retail/repositories/retail.db.repository");

async function testRepoSearch() {
  const prisma = new PrismaClient();
  const repo = new RetailDbRepository(prisma);

  const tenantId = "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f";

  console.log("Searching for 'bag'...");
  const results = await repo.listProducts(tenantId, { q: "bag" });
  console.log(`Results total: ${results.total}`);
  console.log(`Returned items: ${results.items.length}`);
  if (results.items.length > 0) {
    console.log(`Sample item: ${results.items[0].name}`);
  }

  await prisma.$disconnect();
}

testRepoSearch().catch(console.error);
