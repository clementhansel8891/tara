# Consistency: Posting Idempotency

## 1. Multi-Stage Guarding
The Finance module implements a "Defense in Depth" strategy for idempotency.

| Layer | Guardian | Mechanism |
| --- | --- | --- |
| **API** | `idempotencyKey` | Clients pass a unique key; cached in `ArPayment` or `LedgerPosting` tables. |
| **Queue** | `sourceEventId` | The `LedgerEventLog` table has a `@@unique([tenantId, sourceEventId])` constraint. |
| **Engine** | Processing Marker | `LedgerPostingService` transitions status to `PROCESSING` before work starts. |
| **Final Write**| Ledger Sequence | The Unit of Work ensures that duplicate journal IDs cannot be inserted. |

## 2. Conflict Resolution
- **Re-Queuing**: If an event is enqueued twice with the same `sourceEventId`, the repository rejects the second insertion.
- **Worker Recovery**: If a worker crashes mid-posting, the `LedgerEventLog` will remain in `PENDING` or `PROCESSING`. The `AuditChainService` or a cleanup worker can identify these "zombie" entries using the `createdAt` timestamp.

## 3. Idempotency Gaps
- **Global Reset**: Manual DB resets or trunking of the `LedgerIdempotency` table will lose the protection for historical events.
- **Mock Limitations**: The mock implementation stores logs in a `Map`. A process restart will wipe the idempotency memory (Non-persistent in DEV).
