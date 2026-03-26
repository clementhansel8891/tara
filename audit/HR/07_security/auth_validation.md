# HR Auth Validation

## 1. Authentication Layer
- **Standard**: All HR endpoints are protected by `TenantGuard` and `BranchGatingGuard`.
- **Enforcement**: Access requires a valid Bearer token containing `tenantId`, `userId`, and `role`.

## 2. Role-Based Access Control (RBAC)
The following roles are used to control HR functionality:
- **SUPERADMIN**: Global read/write access (bypasses tenant filters).
- **OWNER / ADMIN**: Full access within a specific tenant.
- **HR_MANAGER**: Manage employees, leave, and recruitment.
- **EMPLOYEE**: Self-service (Apply for leave, view profile).

### Observation: Role Hardcoding
- **Risk**: Some sensitive actions (e.g., `approvePayrollRun`, line 1158) have hardcoded role checks: `["SUPERADMIN", "OWNER", "COMPANY_ADMIN", "FINANCE_ADMIN"].includes(role)`.
- **RECO**: Move these checks to a centralized policy-based authorization service (e.g., CASL or a custom `AbilityGuard`).

## 3. JWT Payloads & Impersonation
- **Risk**: If a `SUPERADMIN` impersonates a user, the `auditService.log` must record BOTH the actor ID and the target user ID.
- **Status**: **PASSING**. Most logs record `actorId` and `tenantId`.
