# Inventory Module Architecture Map

## 1. Component Overview
The Inventory module is a core part of the Zenvix enterprise suite, responsible for stock management, reservations, transfers, and integration with Procurement and Sales.

## 2. Layered Architecture
- **API Boundary**: `InventoryController` (REST API).
- **Service Layer**: `InventoryService` (Business logic coordination, Event emission).
- **Domain Layer**: `SkuGeneratorService`, `LabelTemplateService`.
- **Persistence Layer**: `InventoryDbRepository` (Prisma-based DAO).
- **Database**: `StockLevel`, `StockMovement`, `Product`, `StockReservation`, `StockAdjustment`, `InventoryPool`.

## 3. Key Interactions
- **Procurement Integration**: `InventoryService.requestProcurement` creates requisitions for low stock.
- **Sales Integration**: `InventoryController.getDashboard` checks `Retail` module state for store-specific inventory.
- **Worker/Event Layer**: Uses `EventBusService` to publish `STOCK_MOVEMENT_CREATED`, `STOCK_RESERVED`, etc.

## 4. Security & Isolation
- **Tenant Isolation**: Enforced via `TenantInterceptor` and `TenantGuard`.
- **RBAC**: Multi-tier role system (`MANAGER`, `SUPERVISOR`).
- **Data Integrity**: Uses SQL `FOR UPDATE` locks in critical repository methods.
