# Inventory Business Logic & Concurrency Audit

## 1. Concurrency Control [PASSED]
- **Mechanism**: `InventoryDbRepository.getLock` uses `SELECT ... FOR UPDATE` on `stock_levels`.
- **Finding**: This correctly prevents typical race conditions during `intake`, `consume`, `reserve`, and `release` within a transaction.
- **Risk**: Low.

## 2. Inconsistent Transfer Logic [MODERATE]
- **Finding**: `InventoryDbRepository` has two competing transfer implementations:
  1. `transferStock` (Legacy, uses `upsert` and manual increment/decrement).
  2. `transferOut` / `transferIn` (Modern, uses `FOR UPDATE` and supports `InTransit`).
- **Risk ID**: INV-LOGIC-001
- **Recommendation**: Deprecate `transferStock` and unify all transfers under the two-step `initiateTransfer` / `completeTransfer` orchestration.

## 3. Adjustment Math Risk [CRITICAL]
- **Finding**: `approveAdjustment` uses `Math.abs(adj.requestedDelta)` when creating a `StockMovement` of type `ADJUSTMENT_MINUS`.
- **Risk ID**: INV-LOGIC-002
- **Issue**: If `requestedDelta` is -50, `Math.abs(-50)` is 50. Entering 50 as the `quantity` for a `minus` adjustment in the `StockMovement` table is semantically ambiguous and breaks pure ledger arithmetic.
- **Recommendation**: Movements should ALWAYS use the raw signed delta to preserve mathematical integrity.

## 4. Transactional Boundary [MODERATE]
- **Finding**: `InventoryService.intakeStock` and `consumeStock` wrap the repository call in a transaction but also perform `this.eventBus.publish` after the fact.
- **Risk ID**: INV-LOGIC-003
- **Finding**: If `eventBus.publish` fails, the stock was already committed. If the external world depends on these events for sync (e.g., Retail syncing to Inventory), states will drift.
- **Recommendation**: Implement an Outbox pattern for mission-critical events.
