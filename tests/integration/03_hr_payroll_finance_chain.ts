/**
 * Phase 3: HR → Attendance → Payroll → Finance Chain
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Simulates the full HR workflow end-to-end:
 *   Employee created → Shift assigned → Attendance logged →
 *   Payroll run executed → JournalEntry created in Finance
 *
 * All data written inside a rolled-back transaction.
 * PASS / FAIL / WARN reported for each step.
 */

import { getPrisma, disconnectPrisma } from "./helpers/prisma";
import { setPhase, pass, fail, warn, printSummary } from "./helpers/logger";
import { runInRollbackTx } from "./helpers/tx";
import {
  seedTestCompany,
  seedTestLocation,
  seedTestDepartment,
  seedTestEmployee,
  seedTestShift,
  testId,
} from "./helpers/seeds";

async function runPhase3(): Promise<void> {
  const prisma = getPrisma();
  setPhase("03 — HR → Attendance → Payroll → Finance Chain");

  await runInRollbackTx(prisma, "Phase 3", async (tx) => {
    // ────────────────────────────────────────────────────────────────────────
    // STEP 3.1: Create base HR entities
    // ────────────────────────────────────────────────────────────────────────
    let company: any, location: any, department: any, employee: any, shift: any;

    try {
      company = await seedTestCompany(tx as any);
      location = await seedTestLocation(tx as any, company.id);
      department = await seedTestDepartment(tx as any, company.id);
      employee = await seedTestEmployee(
        tx as any,
        company.id,
        location.id,
        department.id,
        {
          email: `${testId()}@phase3.invalid`,
          baseSalary: 6000000,
        },
      );
      pass(
        "3.1 Employee created",
        `Employee ${employee.id} (${employee.firstName} ${employee.lastName}) created`,
      );
    } catch (e: any) {
      fail("3.1 Employee created", `Failed to create employee: ${e.message}`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3.2: Create and assign a Shift
    // ────────────────────────────────────────────────────────────────────────
    let scheduleAssignment: any;
    try {
      shift = await seedTestShift(tx as any, company.id);
      scheduleAssignment = await (tx as any).scheduleAssignment.create({
        data: {
          tenantId: company.id,
          employeeId: employee.id,
          shiftId: shift.id,
          locationId: location.id,
          effectiveDate: new Date(),
        },
      });
      pass(
        "3.2 Shift assigned",
        `Shift "${shift.name}" assigned to employee via ScheduleAssignment ${scheduleAssignment.id}`,
      );
    } catch (e: any) {
      fail(
        "3.2 Shift assigned",
        `Failed to create shift assignment: ${e.message}`,
      );
      return;
    }

    // Verify the shift assignment links back correctly
    const foundAssignment = await (tx as any).scheduleAssignment.findUnique({
      where: { id: scheduleAssignment.id },
      include: { shift: true, employee: true, location: true },
    });
    if (
      foundAssignment?.employee?.id === employee.id &&
      foundAssignment?.shift?.id === shift.id
    ) {
      pass(
        "3.2 Schedule→Employee→Shift link",
        `ScheduleAssignment.employee and .shift both resolve correctly`,
      );
    } else {
      fail(
        "3.2 Schedule→Employee→Shift link",
        `Relational integrity broken on ScheduleAssignment`,
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3.3: Log Attendance Record
    // ────────────────────────────────────────────────────────────────────────
    let attendanceRecord: any;
    try {
      attendanceRecord = await (tx as any).attendanceRecord.create({
        data: {
          tenantId: company.id,
          employeeId: employee.id,
          locationId: location.id,
          shiftId: shift.id,
          date: new Date(),
          status: "present",
          workDurationMinutes: 480,
          checkIn: { time: "08:00", method: "biometric" },
          checkOut: { time: "17:00", method: "biometric" },
        },
      });
      pass(
        "3.3 Attendance logged",
        `AttendanceRecord ${attendanceRecord.id} created for ${new Date().toDateString()}`,
      );
    } catch (e: any) {
      fail(
        "3.3 Attendance logged",
        `Failed to create attendance record: ${e.message}`,
      );
      return;
    }

    // Verify attendance references both employee and shift
    const foundAttendance = await (tx as any).attendanceRecord.findUnique({
      where: { id: attendanceRecord.id },
      include: { employee: true, shift: true },
    });
    if (foundAttendance?.employee?.id === employee.id) {
      pass(
        "3.3 Attendance→Employee link",
        `AttendanceRecord correctly references employee`,
      );
    } else {
      fail(
        "3.3 Attendance→Employee link",
        `AttendanceRecord does not correctly reference employee`,
      );
    }
    if (foundAttendance?.shift?.id === shift.id) {
      pass(
        "3.3 Attendance→Shift link",
        `AttendanceRecord correctly references shift`,
      );
    } else {
      warn(
        "3.3 Attendance→Shift link",
        `AttendanceRecord shiftId is optional — currently null`,
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3.4: Create PayrollRun and PayrollLine
    // ────────────────────────────────────────────────────────────────────────
    let payrollRun: any, payrollLine: any;
    const grossPay = employee.baseSalary ?? 6000000;
    const netPay = Number(grossPay) * 0.85; // 15% deductions

    try {
      payrollRun = await (tx as any).payrollRun.create({
        data: {
          tenantId: company.id,
          periodStart: new Date("2026-03-01"),
          periodEnd: new Date("2026-03-31"),
          payDate: new Date("2026-03-31"),
          status: "draft",
          totalEmployees: 1,
          totalGrossPay: grossPay,
          totalNetPay: netPay,
        },
      });
      pass(
        "3.4 PayrollRun created",
        `PayrollRun ${payrollRun.id} created for March 2026`,
      );
    } catch (e: any) {
      fail(
        "3.4 PayrollRun created",
        `Failed to create payroll run: ${e.message}`,
      );
      return;
    }

    try {
      payrollLine = await (tx as any).payrollLine.create({
        data: {
          tenantId: company.id,
          payrollRunId: payrollRun.id,
          employeeId: employee.id,
          grossPay: grossPay,
          netPay: netPay,
          adjustments: 0,
        },
      });
      pass(
        "3.4 PayrollLine created",
        `PayrollLine ${payrollLine.id} for employee ${employee.id} — Gross: ${grossPay}, Net: ${netPay}`,
      );
    } catch (e: any) {
      fail(
        "3.4 PayrollLine created",
        `Failed to create payroll line: ${e.message}`,
      );
      return;
    }

    // Verify PayrollLine→PayrollRun and PayrollLine→Employee
    const foundLine = await (tx as any).payrollLine.findUnique({
      where: { id: payrollLine.id },
      include: { payrollRun: true, employee: true },
    });
    if (
      foundLine?.payrollRun?.id === payrollRun.id &&
      foundLine?.employee?.id === employee.id
    ) {
      pass(
        "3.4 PayrollLine→PayrollRun→Employee",
        `Full payroll chain linked correctly`,
      );
    } else {
      fail(
        "3.4 PayrollLine→PayrollRun→Employee",
        `Payroll relational chain is broken`,
        {
          linePayrollRun: foundLine?.payrollRun?.id,
          lineEmployee: foundLine?.employee?.id,
        },
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3.5: Create Finance JournalEntry for payroll expense
    // ────────────────────────────────────────────────────────────────────────
    let journalEntry: any;
    const journalRef = `PAYROLL-${payrollRun.id.slice(0, 8)}`;

    try {
      journalEntry = await (tx as any).journalEntry.create({
        data: {
          tenantId: company.id,
          ref: journalRef,
          description: `Payroll expense for ${payrollRun.id}`,
          status: "POSTED",
          lines: {
            create: [
              {
                accountCode: "5000", // Salaries Expense (debit)
                description: `Gross payroll — ${employee.firstName} ${employee.lastName}`,
                debit: grossPay,
                credit: 0,
              },
              {
                accountCode: "2010", // Salaries Payable (credit)
                description: `Net pay payable — ${employee.firstName} ${employee.lastName}`,
                debit: 0,
                credit: netPay,
              },
              {
                accountCode: "2020", // Tax Withholding Payable (credit)
                description: `Tax withholding`,
                debit: 0,
                credit: Number(grossPay) - netPay,
              },
            ],
          },
        },
        include: { lines: true },
      });
      pass(
        "3.5 JournalEntry created",
        `JournalEntry ${journalEntry.id} (ref: ${journalRef}) created with ${journalEntry.lines.length} lines`,
      );
    } catch (e: any) {
      fail(
        "3.5 JournalEntry created",
        `Failed to create journal entry: ${e.message}`,
      );
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3.6: Validate double-entry accounting integrity
    // ────────────────────────────────────────────────────────────────────────
    const totalDebit = journalEntry.lines.reduce(
      (sum: number, l: any) => sum + Number(l.debit),
      0,
    );
    const totalCredit = journalEntry.lines.reduce(
      (sum: number, l: any) => sum + Number(l.credit),
      0,
    );

    if (Math.abs(totalDebit - totalCredit) < 0.01) {
      pass(
        "3.6 Double-entry balanced",
        `Debits (${totalDebit}) = Credits (${totalCredit}) — ledger is balanced`,
      );
    } else {
      fail(
        "3.6 Double-entry balanced",
        `LEDGER IMBALANCE: Debits ${totalDebit} ≠ Credits ${totalCredit}`,
        { totalDebit, totalCredit },
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3.7: Verify full chain is queryable end-to-end
    // ────────────────────────────────────────────────────────────────────────
    const chain = await (tx as any).payrollLine.findUnique({
      where: { id: payrollLine.id },
      include: {
        payrollRun: true,
        employee: {
          include: {
            department: true,
            location: true,
          },
        },
      },
    });

    const chainValid =
      chain?.payrollRun?.tenantId === company.id &&
      chain?.employee?.department?.tenantId === company.id &&
      chain?.employee?.location?.tenantId === company.id;

    if (chainValid) {
      pass(
        "3.7 Full HR chain validated",
        `PayrollLine → PayrollRun → Employee → Department → Location — all tenantId = ${company.id} ✓`,
      );
    } else {
      fail(
        "3.7 Full HR chain validated",
        `tenantId inconsistency across HR chain`,
        {
          payrollRunTenant: chain?.payrollRun?.tenantId,
          deptTenant: chain?.employee?.department?.tenantId,
          locTenant: chain?.employee?.location?.tenantId,
          expected: company.id,
        },
      );
    }

    // Check cross-reference to finance (loose — JournalEntry ref → PayrollRun)
    const linkedJournal = await (tx as any).journalEntry.findFirst({
      where: { tenantId: company.id, ref: journalRef },
    });
    if (linkedJournal) {
      pass(
        "3.7 PayrollRun→Finance cross-ref",
        `JournalEntry found via ref ${journalRef} — finance cross-reference is traceable`,
      );
    } else {
      warn(
        "3.7 PayrollRun→Finance cross-ref",
        `No JournalEntry found for ref ${journalRef} — finance linkage is via string ref only, no FK`,
      );
    }
  });

  const { hasCriticalFailure } = printSummary();
  process.exit(hasCriticalFailure ? 1 : 0);
}

runPhase3()
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
