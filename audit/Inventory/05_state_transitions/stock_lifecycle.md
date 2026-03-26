# Inventory State Transition Validation

## 1. Stock Reservation Lifecycle
- **States**: `PENDING` -> `CONSUMED` | `RELEASED`
- **Finding**: Reservations are correctly tracked in the `StockReservation` model.
- **Risk**: Reservation expiry logic is defined in the repo but lacks a background worker or event-driven cleanup trigger in the service.
- **Verification**: `consumeFromReservation` correctly decrements `onHand` and `reserved` while keeping `available` stable.

## 2. Stock Transfer Lifecycle
- **Flow A (Immediate)**: `Source` -> `Destination` (One transaction).
- **Flow B (Multi-step)**: `Source` -> `In-Transit` -> `Destination`.
- **Finding**: The system supports both, but the `InventoryService.transferStock` (Legacy) completely bypasses `In-Transit` states.
- **Risk**: High-value transfers are not visible during transit if legacy methods are used.

## 3. Product Approval Lifecycle
- **States**: `pending` -> `active` | `rejected` | `deleted`
- **Finding**: Standard HOD approval flow is implemented.
- **Risk**: `deleted` status is a soft-delete (update status), which is good for auditability but requires index filtering on `SKU` unique checks if they were enforced (Prisma schema uses `uuid` as PK, but SKU is not @unique at DB level, only checked in repo).
