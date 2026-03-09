const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  // List all FK constraints on retail_orders so we know exact names
  const constraints = await prisma.$queryRawUnsafe(`
    SELECT con.conname
    FROM pg_catalog.pg_constraint con
    INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'retail_orders'
    AND con.contype = 'f'
  `);
  console.log("All FK constraints:", JSON.stringify(constraints, null, 2));

  // Drop the cashier_id FK
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE retail_orders DROP CONSTRAINT IF EXISTS "retail_orders_cashier_id_fkey"',
    );
    console.log("Dropped retail_orders_cashier_id_fkey");
  } catch (e) {
    console.log("Error dropping cashier FK:", e.message);
  }

  // Drop the device_id FK
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE retail_orders DROP CONSTRAINT IF EXISTS "retail_orders_device_id_fkey"',
    );
    console.log("Dropped retail_orders_device_id_fkey");
  } catch (e) {
    console.log("Error dropping device FK:", e.message);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
