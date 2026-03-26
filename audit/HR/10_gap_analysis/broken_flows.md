# HR Broken Flows

## 1. Payroll Compliance Resilience
- **Status**: **CRITICAL FAILURE**.
- **Description**: `ExecutePayrollCommandHandler` continues even if tax/insurance calculations (BPJS/PPH21) fail.
- **Impact**: Incorrect net pay calculation and legal liability for the tenant.

## 2. Hiring Data Integrity
- **Status**: **MAJOR FAILURE**.
- **Description**: `HireEmployeeCommand` creates "Ghost" records with `PENDING` names. If the system crashes or the admin browser closes before the secondary update, the employee record remains unusable.

## 3. Candidate Conversion Sync
- **Status**: **MEDIUM FAILURE**.
- **Description**: Candidate conversion to Employee is not transactional. If Employee creation succeeds but Candidate update fails, the candidate remains `INTERVIEWING` while also being an `active` employee.

## 4. Zero-Salary Payroll Escape
- **Status**: **LOW FAILURE**.
- **Description**: `ExecutePayroll` falls back to `0` salary without warning. In a production environment, this should trigger an `INCOMPLETE_PAYROLL_DATA` exception.
