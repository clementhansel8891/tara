# Zenvix Platform: Core Architecture

The Zenvix Platform is a **Business Operating System (Business OS)** designed for high modularity, strict multi-tenancy, and auditability. It follows a multi-layered hierarchy to serve diverse industries while maintaining a unified core.

## 1. Architectural Layers

### L1: Company (Tenant)

- **Top level:** Master ledger, global HR, subscription billing.
- **Enforcement:** All data must be filtered by `tenant_id` (company_id).

### L2: Industry Module

- **Specialized logic:** Retail, Manufacturing, Hospitality, etc.
- **Activation:** Modules are activated per tenant.

### L3: Location

- **Physical/Logical:** Specific branches or sites.
- **Operational scope:** Inventory, local teams, and hardware devices (POS, scanners).

## 2. Technical Stack

- **Frontend:** React + Vite + TailwindCSS + Shadcn UI.
- **Backend:** NestJS (Node.js framework) with TypeScript.
- **Persistence:** PostgreSQL with Prisma ORM.
- **Communication:** REST API with RFC 7807 error standards.

## 3. Data Integrity & Security

### Multi-Tenancy

Multi-tenancy is enforced at both the API level (via headers) and the Repository level. Every transaction MUST include `tenant_id`.

### Repository Pattern

The system uses the **Repository Pattern** to decouple business logic from the database.

- **Interfaces:** Define the contract for data operations.
- **Mock Repositories:** Used during development (`DEV_MOCK_MODE`) for fast iteration without DB overhead.
- **Prisma Repositories:** Production-ready implementations for PostgreSQL.

### Audit Logging

Immutable audit logs are mandatory for every state-changing action. This ensures a transparent trail for compliance and debugging.

## 4. Operational Modes

- **DEV_MOCK_MODE:** Backend runs with in-memory data or static mocks. This allows UI development to proceed even if the DB schema is in flux.
- **PROD_READY:** Real DB integration with Prisma and RLS (Row Level Security).
