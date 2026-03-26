# Finance Data Access Audit

## 1. Tenant Isolation
Assessment of how `tenantId` is used to partition data.

| Entity | Isolation Check | Audit Verdict |
|--------|-----------------|---------------|
| **JournalEntry** | `WHERE tenant_id = :tenantId` | **PASSED** |
| **ArInvoice** | `WHERE tenant_id = :tenantId` | **PASSED** |
| **AccountBalance**| `WHERE tenant_id = :tenantId` | **PASSED** |

## 2. Row-Level Security (RLS) Simulation
- **Mechanism**: Prisma client is mostly used without explicit Postgres RLS, relying on software-level middleware (`TenantGuard`).
- **Audit Findings**:
    - Every repository query correctly maps the `tenantId` from the service layer.
    - `companyId` is also enforced in most financial paths to avoid cross-legal-entity leakage within a tenant.
- **Verdict**: **PASSED**.

## 3. PII & Sensitive Information
- **Found**: `ArCustomer` contains `email` and `phone`. `ArPayment` contains `reference`.
- **Finding**: No encryption-at-rest found for specific sensitive fields like bank accounts or tax IDs in the `PayrollProfile` (if it was part of this module's audit scope).
- **Verdict**: **CAUTION** (Ensure DB-level encryption is enabled in infrastructure).
