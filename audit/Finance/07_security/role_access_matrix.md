# Security: Role Access Matrix

## 1. Defined Roles & Capabilities

| Module | SUPERADMIN | FINANCE_CONTROLLER | AUDITOR | STAFF |
| --- | --- | --- | --- | --- |
| **Ledger Engine** | Rezero, Rebuild | Post, Adjust, Void | View Only | View Only |
| **Fiscal Periods** | Force Open/Close | Soft/Hard Lock | View Only | None |
| **AR / AP** | Full Access | Approve, Reconcile | Trace Only | Create Draft |
| **Audit Chain** | **Repair Hash** | Verify | Verify | None |

## 2. Authorization Enforcement Points
- **Controller Guards**: `@UseGuards(RolesGuard)` is present on sensitive endpoints like `/repair-chain`.
- **Workflow Interceptors**: Large financial mutations (above policies) are intercepted and held until a user with `FINANCE_CONTROLLER` approval releases them.

## 3. Security Blind Spots
- **Mock Repositories**: The dev-mode mock repositories do not enforce roles internally; they rely entirely on the Controller guards.
- **API Key Leakage**: Service-to-service communication (e.g., Procurement calling Ledger) uses a shared secret which must be rotated periodically.
