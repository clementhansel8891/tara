# Finance Security & Compliance

## 1. Authentication & Authorization

- **Tenant Isolation**: Mandatory `x-tenant-id` header on all requests. 
- **Company Access**: `FinancialDashboardController` performs a deep-check on `userCompanies` to ensure cross-tenant leakage is impossible even within the same tenant (multiple subsidiaries).
- **Role Scoping**: High-risk operations (e.g., `repair-chain`, `voidInvoice`) are restricted to `SUPERADMIN` or specific Finance roles (implied by service logic).

## 2. Security Mechanisms

- **Idempotency**: `FinancialDashboardController` generates a SHA-256 idempotency key based on `userId`, `action`, `parameters`, and a `time-bucket`. This prevents duplicate audit logs for refreshed views.
- **Throttling**: `@UseGuards(ThrottlerGuard)` is applied to dashboard endpoints to prevent scraping of sensitive financial data.
- **Signature Verification**: Exports are signed with `FINANCE_EXPORT_SECRET`. The `/verify-export` endpoint allows recipients to validate the authenticity of the report.

## 3. Compliance Integration

- **Audit Chain**: The system implements an immutable "Audit Chain" where `AuditService.log` is called on all mutations.
- **Hash Integrity**: `CertifiedReportingController` uses "Sealing" to create a cryptographic proof of a period's data, which is then stored in the `finance_ledger_hash_anchors` table.

## 4. Security Gaps

| Gap ID | Description | Severity |
| --- | --- | --- |
| `SEC-001` | **Inconsistent Context Retrieval**: Some controllers pull `tenantId` from `req.tenantContext` while others use `req.headers`. This could bypass middleware validation if the stack is misconfigured. | Medium |
| `SEC-002` | **Implicit Permissions**: Some subledger services (AR) do not explicitly check user permissions at the Controller level (only tenant-id). | Medium |
| `SEC-003` | **Hardcoded Secrets**: `FinancialDashboardController` has a fallback hardcoded secret for export verification if `ENV` is missing. | High |
