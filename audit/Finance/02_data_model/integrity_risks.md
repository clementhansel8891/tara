# Finance Data Integrity Risks

## 1. High-Level Risk Assessment

| Risk ID | Risk Title | Severity | Description |
| --- | --- | --- | --- |
| `DIR-001` | **Precision Mismatch** | Medium | Some models use `Decimal(15, 2)` (e.g., `Payable`) while others use `Decimal(19, 4)` (e.g., `JournalLine`). This can cause rounding discrepancies when reconciling subledgers to the general ledger. |
| `DIR-002` | **Orphaned Records** | Low | Absence of `onDelete: Cascade` on several line-item relations may lead to orphaned rows if head deletion is permitted. |
| `DIR-003` | **Hash Chain Verification** | High | `JournalEntry` has `entryHash` and `previousHash`, but the schema does not enforce that `previousHash` must exist. If the chain is broken, audit logs might not detect it without application-layer logic. |
| `DIR-004` | **Balance Concurrency** | Medium | `AccountBalance` uses a `version` field for optimistic locking, but high-frequency postings might lead to record locking contention or "Snapshot too old" errors in high-load scenarios. |
| `DIR-005` | **Soft Deletes Missing** | Medium | Core financial records (JournalEntries) do not have a `deletedAt` field. While this is good for auditability (immutability), the application must strictly prevent hard deletes. |

## 2. Recommended Hardening
1. **Standardize Precision**: Transition all financial amount fields to `Decimal(19, 4)` to align with the Ledger Engine.
2. **Strict Foreign Keys**: Add `onDelete: Restrict` to `FiscalPeriod` and `ChartOfAccount` to prevent deletion of master data while transactions exist.
3. **Idempotency Persistence**: Ensure `sys_idempotency_keys` is used for all API mutations to prevent duplicate network retries from creating duplicate data.
