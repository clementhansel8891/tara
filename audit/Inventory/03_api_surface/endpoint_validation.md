# Inventory API Surface Validation

## 1. Multi-Tenant Isolation [PASSED]
- **Finding**: All endpoints use `TenantInterceptor` and `TenantGuard`. The `tenantId` is extracted from the secure context rather than the body.
- **Risk**: Low.

## 2. RBAC Enforcement [PARTIAL]
- **Finding**: `RequireInventoryRole` is applied to most sensitive endpoints (`intake`, `transfer`, `consume`, `reserve`, `release`).
- **Gap**: `POST /inventory/adjustments` lacks an explicit role guard, potentially allowing any authenticated user to request adjustments.
- **Role Map**:
  - `MANAGER`: Batch delete, Import, Snapshot, Audit cycle creation.
  - `SUPERVISOR`: Intake, Transfer, Consume, Reserve, Release, Scans.

## 3. Parameter Inconsistency [MINOR]
- **Finding**: Some services and controllers interchangeably use `tenantId` and `tenant_id`.
- **Finding**: `StockIntakeDto` does not strictly enforce `locationId` at the DTO level, though it's checked in the service.

## 4. Export Security [MODERATE]
- **Finding**: `GET /inventory/items/export` lacks a rate limit or specific PII scrubbing. Watermark functionality is present but relies on client-provided query params.
- **Hardening Requirement**: Enforce server-side rate limits on heavy exports.
