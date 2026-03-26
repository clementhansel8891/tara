# Finance State Machine Audit

## 1. Ledger Posting Lifecycle
The `LedgerPosting` entity follows a linear state progression:

```mermaid
stateDiagram-v2
    [*] --> PENDING: createPosting()
    PENDING --> PROCESSING: worker.triggerProcess()
    PROCESSING --> COMPLETED: Journal created & status updated
    PROCESSING --> FAILED: Error caught in processEvent()
    FAILED --> PENDING: Retry Logic (Manual/Auto)
    COMPLETED --> [*]
```

| State | transitions to | Condition |
|-------|----------------|-----------|
| **PENDING** | `PROCESSING` | Worker selects the record for execution |
| **PROCESSING** | `COMPLETED` | Successful commit of JournalEntry & Lines |
| **PROCESSING** | `FAILED` | Exception (Rule not found, Unbalanced, Locked Period) |

## 2. AR Invoice Lifecycle
```mermaid
stateDiagram-v2
    [*] --> DRAFT: createInvoice()
    DRAFT --> ISSUED: issueInvoice()
    ISSUED --> PARTIALLY_PAID: allocatePayment()
    PARTIALLY_PAID --> PAID: allocatePayment() (Balance=0)
    DRAFT --> VOID: voidInvoice()
    PAID --> [*]
```

## 3. Critical State Guardrails
- **Immutable VOID**: Invoices in `ISSUED` or `PAID` status cannot be `VOID`ed; they must be reversed via Journal Entry to preserve the audit trail.
- **Lock Enforcement**: No state can transition from `PENDING` to `COMPLETED` if the target `FiscalPeriod` is `HARD_LOCKED`.
