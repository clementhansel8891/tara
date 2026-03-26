# Security: Tenant Isolation

## 1. Isolation Layers

| Layer | Mechanism | Implementation Detail |
| --- | --- | --- |
| **API Layer** | Header Enforcement | `x-tenant-id` is extracted via middleware and injected into `req.tenantContext`. |
| **Service Layer** | Context Propagation | All service methods require `tenantId` as the first argument, following the "Zenvix Lead Architect" rule. |
| **Data Layer** | Row-Level Security | Prisma queries always include `{ where: { tenantId } }`. Unique constraints are scoped: `@@unique([tenantId, ref])`. |
| **Subsidiary Layer**| Company Filtering | `FinancialDashboardController` validates the requested `companyId` against the user's `allowedCompanies` array. |

## 2. Cross-Tenant Leakage Risks
- **Global Accounts**: Some system accounts (e.g., Retained Earnings) are "GLOBAL" but still scoped by `tenantId`.
- **Intercompany Transfers**: Currently being audited. If not properly scoped, a transfer could theoretically "bridge" two tenants who share a subsidiary. 
- *Audit Result*: No leakage found in core Ledger logic. All `updateBalance` calls are strictly keyed by `tenantId`.

## 3. Recommended Hardening
- **Strict Headers**: Reject any request where `x-tenant-id` in header does not match the JWT claim `tenantId`.
- **Database Vault**: Use Postgres/PlanetScale row-level security (RLS) as a second line of defense behind the Prisma layer.
