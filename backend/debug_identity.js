const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const userId = process.argv[2] || '89eb76f9-7641-4d56-9e6f-5a5af68759ad';
  const employees = await prisma.employees.findMany({
    where: { user_id: userId }
  });
  console.log('--- EMPLOYEES FOR USER ' + userId + ' ---');
  console.log(JSON.stringify(employees, null, 2));

  for (const emp of employees) {
    const shifts = await prisma.retail_shifts.findMany({
      where: { employee_id: emp.id }
    });
    console.log('\n--- SHIFTS FOR EMPLOYEE ' + emp.id + ' (' + emp.tenant_id + ') ---');
    console.log(JSON.stringify(shifts, null, 2));
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
