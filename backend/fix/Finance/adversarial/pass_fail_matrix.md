# Pass/Fail Matrix: Zenvix Finance Core

| Test Case | Status | Impact |
| :--- | :--- | :--- |
| **Hash Bypassing** | ❌ **FAIL** | Ledger integrity can be masked by direct DB writes. |
| **Double Posting (Race)** | ❌ **FAIL** | Worker collision can lead to duplicate entries. |
| **Idempotency (Sequential)** | ✅ **PASS** | `@@unique` constraint correctly identifies duplicates. |
| **Atomicity (Invoice)** | ⚠️ **PARTIAL** | Tax side effects are non-transactional. |
| **Balance Math (Float)** | ❌ **FAIL** | Precision leaks found in Bank Ingestion. |
| **Reversal Safety** | ✅ **PASS** | Lock guards and single-reversal logic are robust. |
| **Unit-of-Work Consistency**| ❌ **FAIL** | AR Subledger entries are NOT persisted to the database. |
| **Production Execution** | ❌ **CRITICAL FAIL** | System crashes in DB mode due to interface mismatch. |
