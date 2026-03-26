# Vulnerabilities Found: Zenvix Finance Core

| ID | Title | Severity | Location | Description |
| :--- | :--- | :--- | :--- | :--- |
| **V-01** | Bank Ingestion Precision Leak | **HIGH** | `bank-ingestion.service.ts` | Use of `parseFloat` and `reduce(+)` on strings causes floating-point drift in large statements. |
| **V-02** | Worker Collision Race | **MEDIUM** | `ledger-worker.service.ts` | Concurrent execution of `poll()` and `triggerProcess()` can lead to duplicate processing attempts for the same tenant. |
| **V-03** | Production Path Crash | **CRITICAL** | `LedgetPostingDbRepository` | Interface/Implementation mismatch: Worker calls `getNextProcessablePostings`, but DB repo only has `claimPostings`. |
| **V-04** | Non-Transactional Tax Calc | **MEDIUM** | `ar-invoice.service.ts` | Tax calculation occurs outside the main invoice issuance transaction. Potential for stale tax data. |
| **V-05** | Internal Audit Log Leak | **MEDIUM** | `ar-invoice.service.ts` | `subledgerEntry` object is prepared but never persisted to the database. AR module lacks internal unit-of-record. |
| **V-06** | Brittle Hash Verification | **LOW** | `hashing.service.ts` | Hash depends on `Date.toISOString()`. Any DB-level timestamp truncation (ms removal) will break the integrity chain. |

## 🚨 Critical Failure Warning
The system currently **CRASHES** in production mode due to **V-03**. This indicates that the production code path has not been verified against the most recent repository interface updates.
