# HR Idempotency

## 1. Idempotency Support Status
- **Overall Status**: **FAILING / NON-EXISTENT**.
- **Assessment**: No HR endpoint currently supports the `x-idempotency-key` header.

## 2. High-Risk Endpoints

### `POST /attendance/clock-in`
- **Behavior**: Clicking "Clock In" twice in rapid succession (e.g., due to network lag) creates two duplicate attendance records.
- **Business Impact**: Double-counting of shifts/hours in payroll reporting.

### `POST /payroll-runs`
- **Behavior**: Initializing a payroll run for the same period multiple times creates duplicate `HRCase` records.
- **Business Impact**: Operational confusion and potential over-disbursement.

### `POST /candidates/:id/hire`
- **Behavior**: Retrying a failed hire command creates a new `Employee` record each time without checking if the candidate has already been converted.

## 3. Recommendation
Implement a global `IdempotencyInterceptor` that stores request hashes in Redis or the Ledger database for all `POST`, `PATCH`, and `DELETE` operations in the HR module.
