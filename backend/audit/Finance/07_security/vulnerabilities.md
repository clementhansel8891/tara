# Finance Vulnerability Analysis (CWE Mapping)

## 1. High-Priority Vulnerabilities
| Vulnerability | Description | CWE Mapping | Audit Verdict |
|---------------|-------------|-------------|---------------|
| **BROAD_READ**| Missing `@Roles()` on subledger read-only endpoints | CWE-285 | **MEDIUM_RISK** |
| **MOCK_HASH** | Hardcoded MD5/Mock hashing for immutable ledger | CWE-327 | **HIGH_RISK** |
| **PRECISION_LOSS**| Mixing (19,4) and (15,2) Decimals | CWE-190 | **MEDIUM_RISK** |
| **UNBALANCED_TOLERANCE**| Imbalance allowed at (0.001) | CWE-682 | **MEDIUM_RISK** |

## 2. Secure Context Audit
- **CWE-639 (IDOR)**: `TenantCtx` correctly resolves `tenantId` from JWT/Registry, making manual ID injection via JSON body/params fail-safe.
- **Verdict**: **PASSED**.

## 3. Command Injection
- **CWE-77**: `LedgerPostingRule` uses `amountExpression` (e.g., `payload.totalAmount`).
- **Finding**: This expression is currently parsed by basic `.split('.')` or simple field lookup (see `ledger-posting.service.ts:112`).
- **Risk**: If the parser evolves to use `eval()` or a complex script engine, it must be sandboxed.
- **Verdict**: **SAFE** (Current implementation is simple field mapping).
