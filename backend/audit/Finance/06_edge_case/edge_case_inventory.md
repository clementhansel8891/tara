# Finance Edge Case Inventory

## 1. Monetary Edge Cases
| Case | Scenario | Current Handling | Audit Verdict |
|------|----------|------------------|---------------|
| **Division Rounding** | Splitting $10.00 into 3 cost centers | Not explicitly found | **HIGH_RISK** |
| **Micro-Cents** | Transaction of $0.0001 | 19,4 Decimal precision | **PASSED** |
| **Negative Balances** | Refund exceeding available cash | No balance check in refund path | **MEDIUM_RISK** |
| **Zero-Amount Posting** | Posting rule resolves to $0.00 | Guarded in ValidationService | **PASSED** |

## 2. Concurrency Edge Cases
| Case | Scenario | Current Handling | Audit Verdict |
|------|----------|------------------|---------------|
| **Double Spend** | Two identical payments enqueued same MS | Idempotency Key | **PASSED** |
| **Race to Close** | Posting event arrives exactly as Period Locks | Fiscal Repo Lock check | **PASSED** |
| **Worker Overlap** | Multiple processors pick same event | Status PROCESSING update | **PASSED** |

## 3. Organizational Edge Cases
- **Inter-Tenant Transfers**: Attempting to post cross-tenant via manually injecting `companyId` in JSON payload.
- **Audit Findings**: `TenantCtx` in controllers blocks this at the gateway level.
- **Verdict**: **PASSED**.
