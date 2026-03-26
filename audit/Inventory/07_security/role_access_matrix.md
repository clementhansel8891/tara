# Inventory Security & Role Access Audit

## 1. Role Access Matrix
| Endpoint | Required Role | Implementation | Status |
|----------|---------------|----------------|--------|
| `POST /inventory/items` | `MANAGER` | `@RequireInventoryRole` | [OK] |
| `DELETE /inventory/items/:id` | `MANAGER` | `@RequireInventoryRole` | [OK] |
| `POST /inventory/intake` | `SUPERVISOR` | `@RequireInventoryRole` | [OK] |
| `POST /inventory/adjustments` | - | `MISSING` | [VIOLATION] |
| `POST /inventory/scans/*` | `SUPERVISOR` | `@RequireInventoryRole` | [OK] |

## 2. Tenant Context Leak Check
- **Finding**: All queries in `InventoryDbRepository` include `{ where: { tenantId } }`.
- **Finding**: `Location` and `Product` lookups verify `tenantId` match before processing.
- **Status**: [SECURE]

## 3. Data Sensitivity
- **Finding**: SKU and Category are exposed. Cost figures are calculated via `basePrice` (Base value, not actual FIFO/LIFO cost).
- **Risk**: Exposing `totalValuation` to `SUPERVISOR` role via dashboard might be a policy violation if they only require stock counts.
