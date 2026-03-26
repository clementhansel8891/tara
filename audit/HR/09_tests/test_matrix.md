# HR Test Matrix

## 1. Core Lifecycle Coverage
| Feature | Type | Scenario | Expected Outcome |
|---------|------|----------|-----------------|
| Hiring | Unit | Valid `CreateEmployeeDto` | Employee created, Audit logged, Event published |
| Hiring | Unit | Missing `departmentId` | 400 Bad Request / Validation Failure |
| Transfer| Integration| Move from Loc A to Loc B | Record updated, IT notified via EventBus |
| Deactivate| Unit | Soft-delete active employee| `deletedAt` set, `status` updated |

## 2. Payroll & Compliance Coverage
| Feature | Type | Scenario | Expected Outcome |
|---------|------|----------|-----------------|
| Payroll | Integration| Execute for 10 employees | 10 PayrollLines created, Compliance run |
| Payroll | Unit | Component failure (BPJS) | Warning logged, but Net Pay calculated |
| Exchange | Unit | Update Rate (USD -> IDR) | New rate record created in DB |

## 3. Resilience & Security Coverage
| Feature | Type | Scenario | Expected Outcome |
|---------|------|----------|-----------------|
| Tenant | Integration| Tenant A tries to read Tenant B | 403 Forbidden / Not Found |
| Concurrency| Integration| Dual salary update | Last-Write-Wins (Current) / Version Conflict (Ideal) |
| Idempotency| Integration| Duplicate clock-in | Blocked (Expected) / Duplicate (Current Risk) |
