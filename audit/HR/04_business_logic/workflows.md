# HR Workflows

## 1. Recruitment to Hire
1. **Requisition**: `HRService.createRequisition` initializes a hiring need.
2. **Sourcing**: Leads ingested via `talentSourcingService` or manual candidate creation.
3. **Interview**: `ScheduleInterviewCommand` triggers repository-level scheduling.
4. **Hiring**: `HireEmployeeCommand` converts a candidate.
   - **CRITICAL RISK**: The handler sets names to `PENDING` and uses generic emails (`hire-id@pending.zenvix`). This creates "ghost" records if the subsequent update fails.

## 2. Employee Lifecycle
- **Promotion**: `PromoteEmployeeCommand` updates position and salary. It fetches `beforeState` for high-fidelity auditing.
- **Transfer**: `TransferEmployeeCommand` moves employee between departments/locations.
- **Suspension**: `SuspendEmployeeCommand` marks status as suspended with a mandatory reason.
- **Termination**: `TerminateEmployeeCommand` triggers `deactivateEmployee` (soft delete).

## 3. Payroll Execution
1. **Initialization**: `ExecutePayrollCommand` identifies active employees.
2. **Gross Calculation**: Sums `baseSalary` from the employee records.
3. **Compliance Integration**: Sequentially executes `BPJS_KESEHATAN`, `BPJS_KETENAGAKERJAAN`, and `PPH21`.
   - **CRITICAL RISK**: Failures in compliance modules are logged as warnings but do not halt payroll execution (line 340). This can result in legally non-compliant payslips being generated.
4. **Finalization**: Publishes `PAYROLL_EXECUTED` event.

## 4. Compliance Auditing
- `HRService.auditCompliance` triggers a global check across all employees for missing documents or expired certs.
- `triggerOcr` allows manual/automated data extraction from uploaded IDs/Contracts.
