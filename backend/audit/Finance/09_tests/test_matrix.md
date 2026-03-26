# Finance Test Matrix

## 1. Core Ledger Tests
| ID | Title | Level | Requirement |
|----|-------|-------|-------------|
| **L-01** | Balanced Journal Check | Unit | Total Debit == Total Credit (Tolerance 0) |
| **L-02** | Hash Chain Integrity | Unit | current.prevHash == prev.entryHash |
| **L-03** | Fiscal Lock Enforcement | Integration| Block posting to HARD_LOCKED periods |
| **L-04** | Idempotency Replay | Integration| Duplicate events rejected |

## 2. AR Subledger Tests
| ID | Title | Level | Requirement |
|----|-------|-------|-------------|
| **AR-01** | Invoice-to-Ledger Flow | Integration| Issuing invoice creates Ledger Posting |
| **AR-02** | Partial Payment Allocation| Unit | Correct update of outstanding balance |
| **AR-03** | Overpayment Recognition | Unit | Auto-creation of customer credit balance |
| **AR-04** | Void Guard | Unit | Block voiding after issuance |

## 3. High-Security Tests
| ID | Title | Level | Requirement |
|----|-------|-------|-------------|
| **S-01** | Cross-Tenant Leakage | Integration| User A cannot view Tenant B data |
| **S-02** | Role Escalation (COA) | Integration| 'EMPLOYEE' role cannot update COA |
| **S-03** | Negative Refund Check | Unit | Block refund > payment amount |
