# Inventory Critical Gap Analysis

## 1. GAP-INV-001: Floating Point Math Risk
- **Severity**: CRITICAL
- **Finding**: Use of `Float` in Prisma and `Number` in JS for balance tracking.
- **Impact**: Cumulative rounding errors will cause inventory-to-valuation drift over time.
- **Resolution**: Convert all stock fields to `Decimal` (Prisma) and use `Decimal.js` (Backend).

## 2. GAP-INV-002: Service/Repo Logic Duplication
- **Severity**: HIGH
- **Finding**: Competence overlap between `InventoryService` and `InventoryDbRepository`. For example, `transferStock` vs `transferOut`/`In`.
- **Impact**: Maintenance nightmare and risk of logic divergence (e.g., one method locks, the other doesn't).
- **Resolution**: Refactor and unify all core state-machine logic into the Repository with strict `SELECT FOR UPDATE` enforcement.

## 3. GAP-INV-003: Non-Atomic Event Emission
- **Severity**: MODERATE
- **Finding**: Events are published outside the DB transaction.
- **Impact**: "Ghost" events (event emitted but tx rolled back) or "Stale" events (tx committed but event failed).
- **Resolution**: Implement an Outbox pattern managed by the same Prisma transaction.

## 4. GAP-INV-004: Missing RBAC on Adjustments
- **Severity**: MODERATE
- **Finding**: `POST /inventory/adjustments` lacks `@RequireInventoryRole`.
- **Impact**: Unauthorized users could flood the system with adjustment requests.
- **Resolution**: Apply `@RequireInventoryRole(InventoryRole.SUPERVISOR)` immediately.
