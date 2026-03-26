# Inventory Edge Case Detection

## 1. Concurrency: The "Double-Reserve" Case
- **Scenario**: Two users reserve the same item simultaneously.
- **Finding**: `FOR UPDATE` lock on `StockLevel` correctly serializes these requests. First request commits, second request sees updated `available` balance and fails with `Insufficient stock`.
- **Status**: [SECURE]

## 2. Zero-Stock Adjustment
- **Scenario**: Requesting a negative adjustment that would push `onHand` below zero.
- **Finding**: `approveAdjustment` uses `increment: adj.requestedDelta`. If delta is -100 and stock is 50, it results in -50.
- **Risk**: No non-negative constraint at DB level or logic check in `approveAdjustment`.
- **Hardening**: Must enforce `onHand >= 0` check during adjustment approval.

## 3. Batch Intake Integrity
- **Scenario**: One item in a 100-item batch intake fails validation.
- **Finding**: `batchIntakeStock` uses `this.prisma.$transaction`. Atomic rollback is guaranteed.
- **Status**: [SECURE]
