# Inventory Data Model Validation

## 1. Model: StockLevel [CRITICAL]
- **Risk ID**: INV-MODEL-001
- **Field**: `onHand`, `available`, `reserved`, `inTransit`
- **Type**: `Float`
- **Finding**: Using `Float` for primary stock quantities in an enterprise system is a high-risk pattern. Rounding errors in bulk transfers or fractional UOMs (e.g., kilograms) can lead to silent inventory drift.
- **Hardening Requirement**: Convert to `Decimal(20, 8)` or higher precision.

## 2. Model: StockMovement
- **Risk ID**: INV-MODEL-002
- **Constraint**: `@@unique([tenantId, referenceId, productId, type])`
- **Finding**: This is a strong idempotency key. However, the `referenceId` generation in the repository (`INTAKE-${Date.now()}`) partially defeats this by introducing non-determinism in some flows.
- **Hardening Requirement**: Enforce unique `idempotencyKey` provided by the client layer.

## 3. Model: StockAdjustment
- **Risk ID**: INV-MODEL-003
- **Field**: `requestedDelta`
- **Type**: `Float`
- **Finding**: Matches `StockLevel` risk. Financial reconciliation of adjustments will be inconsistent due to floating point arithmetic.

## 4. Model: StockReservation
- **Risk ID**: INV-MODEL-004
- **Index**: `@@index([tenantId, productId, locationId])`
- **Finding**: Good index for performance, but lacks a `status` index which is critical for background cleanup of expired reservations.
