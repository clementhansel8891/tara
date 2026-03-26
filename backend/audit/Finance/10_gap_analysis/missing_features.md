# Finance Missing Features Audit

## 1. Cryptographic Integrity
- **Gap**: `LedgerPostingService` uses `'MOCK-HASH'` instead of a real SHA-256 Hmac linked to the previous entry.
- **Impact**: The "Trustless Ledger" architecture is functionally disabled in the current build.
- **Priority**: **CRITICAL**.

## 2. Advanced Multi-Currency
- **Gap**: No real-time exchange rate ingestion or re-valuation logic.
- **Impact**: Inaccurate P&L for international subsidiaries.
- **Priority**: **MEDIUM**.

## 3. Automated Reconciliations
- **Gap**: `BankIngestionService` and `ReconciliationService` are heavily mocked or missing DB-backed rule sets.
- **Impact**: Manual reconciliation overhead for high-volume transactions.
- **Priority**: **MEDIUM**.

## 4. Subledger Aggregation (Snapshots)
- **Gap**: `AccountBalanceSnapshotRepository` is currently mocked.
- **Impact**: Performance degradation during historical multi-year trail balance reports.
- **Priority**: **LOW** (Operational for small-to-medium datasets).
