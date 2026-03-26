# State Transitions: Period Controls

## 1. Fiscal Period Hierarchy
Fiscal periods act as temporal containers for financial data, with increasing levels of restriction.

| State | Restriction Level | Description |
| --- | --- | --- |
| `OPEN` | None | Postings and adjustments across all modules permitted. |
| `SOFT_LOCK` | Module-Specific | Prevents subledger postings (AR/AP) but allows manual adjustments for month-end close. |
| `HARD_LOCK` | Full Block | All writes to the General Ledger are rejected. Used during the Final Review phase. |
| `CLOSED` | Immutable | Period is sealed. `AccountBalanceSnapshot` is generated. No further changes possible. |

## 2. Closing Logic
1. **Validation**: All `LedgerPosting` records for the period must be `COMPLETED` or `FAILED_TERMINAL`.
2. **Snapshot**: `AccountBalanceSnapshot` captures the end-of-period state.
3. **Sealing**: `CertifiedReportingService` calculates the final Merkle root for all journals in the period.
4. **Transition**: The period is moved to `CLOSED` status.

## 3. Security Hardening
- Transitions to `HARD_LOCK` and `CLOSED` are restricted to users with `FINANCE_CONTROLLER` or `SUPERADMIN` roles.
- `LedgerPostingService` checks this status before every transaction, providing a database-agnostic "Time Fence".
