# Zenvix Platform: Backend Build Documentation

The backend is a robust NestJS application designed for scalability and multi-industry support.

## 1. Technologies

- **NestJS**: Modular Node.js framework.
- **TypeScript**: Typed safety across all layers.
- **Prisma ORM**: Type-safe database access for PostgreSQL.
- **Class-Validator / Transformer**: DTO-driven validation.
- **RFC 7807**: Problem Details for HTTP APIs (Standardized error responses).

## 2. Core Modules

| Module      | Purpose                                                 |
| ----------- | ------------------------------------------------------- |
| **Auth**    | Identity management, RBAC, and Token handling.          |
| **Finance** | Ledger, transactions, and fiscal reporting.             |
| **HR**      | Employee lifecycle, attendance, and payroll.            |
| **Retail**  | (Industry) POS, Inventory sync, and Channel management. |
| **Shared**  | Filters, interceptors, and common utilities.            |

## 3. Data Persistence Logic

### Repository Pattern

1. **Interfaces**: `persistence/interfaces/[entity].repository.interface.ts`
2. **Mock Implementation**: `persistence/repositories/mock/[entity].mock.repository.ts`
3. **Prisma Implementation**: `persistence/repositories/prisma/[entity].prisma.repository.ts`

### Multi-Tenancy Enforcement

Every repository method MUST accept `tenant_id` as the first argument.

```typescript
async findOne(tenant_id: string, id: string): Promise<Entity>;
```

## 4. Middleware & Guards

- **TenantGuard**: Verifies the Presence and validity of `x-tenant-id` header.
- **LocationGuard**: ensures the user has access to the specified `x-location-id`.
- **Rfc7807Filter**: Catches all exceptions and formats them as per RFC 7807.

## 5. Development Workflow

The backend supports a `DEV_MOCK_MODE` (driven by the `MOCK_MODE` env var) which bypasses the database and uses in-memory repositories. This is ideal for testing frontend integrations without setting up a full PostgreSQL instance.
