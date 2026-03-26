# Transitions Validation Report

## 1. Valid Transitions Table
| Source Status | Operation | Result Status | Side Effect |
|---------------|-----------|---------------|-------------|
| **DRAFT** | `issueInvoice()` | **ISSUED** | Enqueue `LedgerPosting` |
| **ISSUED** | `receivePayment()` | **ISSUED** | Enqueue `LedgerPosting` |
| **ISSUED** | `allocatePayment()` | **PARTIALLY_PAID** | Update Outstanding |
| **PARTIALLY_PAID** | `allocatePayment()` | **PAID** | Update Outstanding (0) |
| **DRAFT** | `voidInvoice()` | **VOID** | No financial event |

## 2. Invalid/Blocked Transitions
| Source Status | Operation | Result | Reason |
|---------------|-----------|--------|--------|
| **ISSUED** | `voidInvoice()` | **REJECTED** | Cannot void after posting |
| **VOID** | `issueInvoice()` | **REJECTED** | Illegal terminal state |
| **PAID** | `refundPayment()` | **ISSUED** | Refund re-opens outstanding |
| **HARD_LOCK** | `createJournal()` | **REJECTED** | Period is immutable |

## 3. High-Risk Transition Windows
- **Gap analysis**: `JournalReversalService` does not currently transition the *original* journal to a `REVERSED` state; it only creates a link.
- **Risk**: A user might mistakenly try to reverse the same journal twice.
- **Verdict**: **REMEDIATION_REQUIRED** (Add a `isReversed` flag or status transition to original journal).
