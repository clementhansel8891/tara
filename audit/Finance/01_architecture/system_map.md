# 01_architecture/system_map.md

## High-Level Architecture Map: Finance Core

The Zenvix Finance module is a core backbone component, responsible for double-entry bookkeeping, fiscal management, and financial reporting. It follows a strictly decoupled architecture using the Repository Pattern and Service-Oriented approach.

### 1. Presentation Layer (Controllers)
- **`FinanceController`**: Primary entry point for COA, balances, and direct ledger queries.
- **`FinancialDashboardController`**: Aggregates data for real-time visualization.
- **`ReportingController`**: Orchestres complex report generation (P&L, Balance Sheet).
- **`OperationsController`**: Handles fiscal period management and closings.
- **`ComplianceController`**: Manages audit trails and regulatory exports.
- **`CertifiedReportingController`**: Handles cryptographically signed financial reports.

### 2. Service Layer (Business Logic)
- **Core Ledger Logic**:
  - `LedgerPostingService`: Orchestrates the transition from transactions to double-entry ledger entries.
  - `PostingGatewayService`: Acts as the unified entry point for all subledgers.
- **Fiscal Management**:
  - `FiscalPeriodService`: Manages period status (OPEN, CLOSED, CLOSING).
  - `PeriodClosingService`: Implements the end-of-period reconciliation and snapshotting.
- **Reporting Engines**:
  - `ReportingEngineService`: High-performance aggregation for standard reports.
  - `ProfitLossService` / `BalanceSheetService`: Domain-specific reporting logic.
- **Integrity & Verification**:
  - `LedgerIntegrityService`: Validates ledger parity and audit hashes.
  - `TrialBalanceVerificationService`: Ensures debits = credits at the aggregate level.
- **Asynchronous Processing**:
  - `LedgerWorkerService`: Background processing of high-volume posting events.

### 3. Repository Layer (Data Persistence)
- **`DbUnitOfWork`**: Orchestrates ACID-compliant transactions across multiple repositories.
- **Domain Repositories**:
  - `AccountBalanceDbRepository`: Manages real-time account balances.
  - `LedgerPostingDbRepository`: Atomic writes to the ledger.
  - `JournalDbRepository`: Manages journal headers and lines.
  - `CoaDbRepository`: Management of the Chart of Accounts.

### 4. Integration Surface
- **Subledgers**:
  - `ArModule`: Accounts Receivable integration.
  - `InventorySubledger`: Specialized inventory-to-GL mapping.
- **Shared Infrastructure**:
  - `AuditModule`: Centralized logging for compliance.
  - `PersistenceModule`: Prisma-backed database access.

## Summary Verdict: Architecture
The architecture is **Exhaustive** and follows **Clean Architecture** principles. The use of a central `PostingGateway` prevents dependency bloat from submodules into the core ledger.
