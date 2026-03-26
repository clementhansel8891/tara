const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://zenvix:zenvix_dev_password@localhost:5432/zenvix_dev?schema=public"
    }
  }
});

async function test() {
  try {
    console.log('Testing connection to 5432...');
    await prisma.$connect();
    console.log('SUCCESS: Connected to 5432');
    const count = await prisma.domainEvent.count();
    console.log(`Event count: ${count}`);
    await prisma.$disconnect();
  } catch (err) {
    console.error('FAILED: could not connect to 5432', err.message);
    process.exit(1);
  }
}

test();
