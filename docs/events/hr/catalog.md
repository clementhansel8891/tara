# HR Domain Event Catalog (v1)

This document defines the formal contracts for all events emitted by the Zenvix HR module. All events are emitted via the Transactional Outbox Pattern to ensure 100% reliability.

## Common Metadata Structure
Every event payload includes a `_metadata` object:
- `eventId`: Unique UUID for deduplication.
- `version`: Event schema version (e.g., "v1").
- `timestamp`: UTC ISO string of when the event occurred.

---

## 1. Employee Lifecycle Events

### `hr.employee.created.v1`
- **Trigger**: Fired when a candidate is successfully hired and a new employee record is created.
- **Payload Schema**:
  ```json
  {
    "employeeId": "string (UUID)",
    "candidateId": "string (UUID)",
    "email": "string",
    "_metadata": { ... }
  }
  ```
- **Consumer Guidance**: Use for IT provisioning (creating accounts) and Finance (setting up payroll profiles).

---

## 2. Payroll Events

### `hr.payroll.executed.v1`
- **Trigger**: Fired when a payroll transaction is successfully committed to the ledger.
- **Payload Schema**:
  ```json
  {
    "payrollRunId": "string (UUID)",
    "period": "string (YYYY-MM-DD)",
    "totalGross": "number",
    "totalNet": "number",
    "processedCount": "number",
    "_metadata": { ... }
  }
  ```
- **Consumer Guidance**: Finance module uses this to update general ledger balances and trigger payment payouts.

---

## 3. Time & Attendance Events

### `hr.attendance.logged.v1`
- **Trigger**: Fired when a clock-in/out event is recorded.
- **Payload Schema**:
  ```json
  {
    "employeeId": "string (UUID)",
    "locationId": "string (UUID)",
    "type": "CLOCK_IN | CLOCK_OUT",
    "timestamp": "string (ISO)",
    "_metadata": { ... }
  }
  ```
- **Consumer Guidance**: Used by AI Insight layer to track attendance patterns.
