# HR Module Boundaries

## Internal Boundaries
- **Core HR vs. Industry Extension**: The HR module provides a "Core Workforce" base. Industry-specific data (e.g., Retail operation shifts) is injected into the overview via module-aware helpers (`isModuleActive`).
- **Command vs. Query**: Write operations are increasingly moved to the Command Layer (CQRS-lite), while read operations generally use the Service -> Repository pattern.

## External Dependencies
- **Finance Module**: Payroll execution triggers ledger postings (via `ExecutePayrollCommandHandler` integration points).
- **Retail Module**: HR overview consumes `RetailShift` data to show operational staffing levels.
- **Auth Module**: Used for permission checks and user-to-employee mapping.
- **Shared Components**:
    - `FileProcessing`: CSV/Excel imports.
    - `Audit`: Action logging.
    - `Workflow`: Task management.

## Isolation Mechanisms
- **Multi-Tenancy**: Every service method accepts `tenantId`. Repositories filter all queries by `tenantId`.
- **Branch Gating**: Operations can be further restricted by `locationId` (branch).
- **Request Context**: The `TenantContext` interface is used to pass tenant/user metadata throughout the request lifecycle.
