# HR Race Conditions

## 1. The "Ghost Hire" Race
**Sequence**:
1. Admin A calls `hireCandidate(ID)`.
2. `HireEmployeeCommandHandler` begins execution.
3. Admin B calls `deleteCandidate(ID)`.
4. `deleteCandidate` succeeds.
5. `HireEmployeeCommandHandler` tries to fetch candidate details to finalize the employee name but fails or proceeds with null data.

## 2. The "Double Pay" Race
**Sequence**:
1. System triggers automated `calculatePayroll` for a period.
2. An HR Admin manually triggers `calculatePayroll` for the same employee/period due to perceived slowness.
3. Both processes fetch the same historical data.
4. Both processes write `PayrollLine` records.
5. **Result**: Two pay lines for the same period.

## 3. The "State Drift" Race
**Sequence**:
1. `TerminateEmployeeCommand` is called.
2. `deactivateEmployee` begins.
3. A scheduled `TrainingReminder` job fetches the employee record while $status=active$.
4. `deactivateEmployee` completes ($status=terminated$).
5. The Training Job sends a notification to a persona who no longer has access to the system.
