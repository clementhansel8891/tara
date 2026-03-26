# Consistency: Event Deduplication

## 1. Source System Responsibility
Deduplication begins at the source of the financial event.

| Module | Deterministic ID | Source |
| --- | --- | --- |
| **AR Invoice** | `ar-invoice-${id}` | Generated during `issueInvoice()`. |
| **AR Payment** | `idempotencyKey` | Transmitted from Client/Frontend. |
| **Inventory** | `inv-move-${id}` | Generated during stock movement. |

## 2. Subledger to General Ledger Handshake
1. The Subledger generates a `postingRequestId` (UUID).
2. This ID is passed as `sourceEventId` to the `LedgerPostingService`.
3. The Ledger Engine uses this ID to "Anchor" the financial entry.
4. *Audit Result*: No path exists where a single AR invoice can be posted twice to the GL unless the ID generation logic is flawed.

## 3. Distributed Deduplication
In high-load environments with multiple API instances:
- The `LedgerEventLog` acts as the distributed semaphor.
- `prisma.ledgerEventLog.create()` is the atomic "Claim" operation.
- If instance A and B both try to claim `event-001`, the DB guarantees only one succeeds.
