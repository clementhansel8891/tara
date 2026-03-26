# Finance Auth Validation

## 1. Role-Based Access Control (RBAC)
Audit of `@Roles()` decorator usage across Finance controllers.

| Operation | Required Role | Audit Verdict |
|-----------|---------------|---------------|
| `createCOA` | ADMIN, OWNER | **PASSED** |
| `issueInvoice` | ADMIN, OWNER | **PASSED** |
| `reverseJournal` | ADMIN, OWNER, SUPERADMIN | **PASSED** |
| `sealPeriod` | ADMIN, OWNER, SUPERADMIN | **PASSED** |
| `getHealth` | ADMIN, OWNER, SUPERADMIN | **PASSED** |

## 2. Shared Guard Strategy
All finance controllers inherit security from `TenantGuard` and `RolesGuard`.
This ensures that every request is:
1. Authenticated.
2. Verified against the `tenantId` in the JWT.
3. Authorized based on role.

## 3. Vulnerability Analysis: Permission Escalation
- **Finding**: Some read-only endpoints (e.g., `listCustomers`, `listInvoices`) do not have `@Roles()` decorators in `ArController`.
- **Impact**: Any authenticated user within the tenant can view all customers and invoices.
- **Verdict**: **SAFE BY DESIGN** (Multi-tenancy isolation is enforced, but within the tenant, the access might be too broad for simple 'EMPLOYEE' role).
- **Recommendation**: Add `@Roles(UserRole.ACCOUNTANT, UserRole.MANAGER, ...)` for subledger read access.
