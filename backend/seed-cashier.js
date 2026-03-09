const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const tenantId = "comp-demo-a";
  const location = await prisma.location.findFirst({ where: { tenantId } });

  if (!location) {
    console.log("Location not found");
    return;
  }

  let dept = await prisma.department.findFirst({ where: { tenantId } });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        id: "dept-retail",
        tenantId,
        name: "Retail Operations",
        code: "RET",
        status: "active",
      },
    });
  }

  // Seed employee for "dev-user" userId (used by bypass mode)
  try {
    const employee = await prisma.employee.upsert({
      where: { id: "dev-user" },
      update: {},
      create: {
        id: "dev-user",
        tenantId,
        locationId: location.id,
        departmentId: dept.id,
        firstName: "Dev",
        lastName: "User",
        email: "dev@zenvix.com",
        position: "Cashier",
        employeeCode: "DEV001",
        hireDate: new Date(),
        status: "active",
        userId: "dev-user",
      },
    });
    console.log("Dev employee seeded:", employee.id);
  } catch (e) {
    console.log("Error seeding dev employee:", e.message);
  }

  // Also seed emp-001 fallback
  try {
    const employee = await prisma.employee.upsert({
      where: { id: "emp-001" },
      update: {},
      create: {
        id: "emp-001",
        tenantId,
        locationId: location.id,
        departmentId: dept.id,
        firstName: "System",
        lastName: "Admin",
        email: "admin@zenvix.com",
        position: "Store Manager",
        employeeCode: "EMP001",
        hireDate: new Date(),
        status: "active",
        userId: "emp-001",
      },
    });
    console.log("Admin employee seeded:", employee.id);
  } catch (e) {
    console.log("Error seeding admin employee:", e.message);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
