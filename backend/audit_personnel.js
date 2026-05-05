const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditPersonnel() {
  console.log("=== RETAIL PERSONNEL AUDIT REPORT ===\n");

  // 1. Audit Shifts
  const shifts = await prisma.retail_shifts.findMany({
    include: {
      employees: true,
      retail_cash_movements: true
    }
  });
  console.log(`Total Shifts Found: ${shifts.length}`);
  shifts.forEach(s => {
    console.log(`- Shift [${s.status.toUpperCase()}] ID: ${s.id}`);
    console.log(`  Personnel: ${s.employees?.first_name} ${s.employees?.last_name} (Emp ID: ${s.employee_id})`);
    console.log(`  Opened By ID: ${s.opened_by_id || 'N/A'}`);
    console.log(`  Cash Movements: ${s.retail_cash_movements.length}`);
  });

  // 2. Audit Orders
  const orders = await prisma.retail_orders.findMany({
    include: {
      employees: true,
      shifts: true
    }
  });
  console.log(`\nTotal Orders Found: ${orders.length}`);
  orders.forEach(o => {
    console.log(`- Order ID: ${o.id}`);
    console.log(`  Cashier: ${o.employees?.first_name || 'System'} (ID: ${o.cashier_id})`);
    console.log(`  Shift Link: ${o.shift_id || 'MISSING'}`);
    console.log(`  Commission: ${o.commission_amount || 0} ${o.currency}`);
  });

  // 3. Audit Cash Movements
  const movements = await prisma.retail_cash_movements.findMany({
    include: {
      employees: true
    }
  });
  console.log(`\nTotal Cash Movements: ${movements.length}`);
  movements.forEach(m => {
    console.log(`- [${m.type}] Amount: ${m.amount} | Person: ${m.employees?.first_name} | Shift: ${m.shift_id}`);
  });

  // 4. Audit Attendance
  const attendance = await prisma.hr_attendance_records.findMany({
    where: { NOT: { shift_id: null } }
  });
  console.log(`\nTotal Attendance Records with Shift Links: ${attendance.length}`);

  // 5. Audit Stock Movements
  const stockMovements = await prisma.stock_movements.findMany({
    where: { type: "RETAIL_SALE" },
    take: 5
  });
  console.log(`\nRetail Stock Movements (performed_by check): ${stockMovements.length}`);
  stockMovements.forEach(sm => {
    console.log(`- Movement ID: ${sm.id} | Reference (Order): ${sm.reference_id} | Performed By (User): ${sm.performed_by}`);
  });

  console.log("\n=== AUDIT COMPLETE ===");
}

auditPersonnel()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
