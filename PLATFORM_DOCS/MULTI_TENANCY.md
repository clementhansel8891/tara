# Zenvix Platform: Multi-Tenancy & Location Awareness

Multi-tenancy is the backbone of the Zenvix Platform. It ensures data isolation and security across different companies (tenants) and their respective locations.

## 1. The Core Identifiers

- **`tenant_id` (Company ID):** Identifies the top-level organization.
- **`location_id`:** Identifies a specific physical or logical branch within a tenant.

## 2. Request Handling Flow

1. **Client Request:** The frontend includes `x-tenant-id` and `x-location-id` headers in every API call.
2. **Middleware/Interceptors:**
   - `TenantInterceptor` extracts headers and attaches them to the request object as `tenantContext`.
3. **Guards:**
   - `TenantGuard` verifies that the authenticated user has permission to access the requested `tenant_id`.
   - `LocationGuard` verifies access to the `location_id`.
4. **Services/Repositories:** The `tenant_id` is passed down as the first argument to ensure all database queries are scoped.

## 3. Database Isolation (RLS)

While the application logic handles `tenant_id` scoping, the production database (PostgreSQL) is designed to utilize **Row-Level Security (RLS)** as an additional layer of protection. This prevents one tenant from ever seeing another tenant's data, even in the event of an application-level bug.

## 4. Implementation Rules for Developers

### Rule 1: Method Signatures

Every repository and service method that interacts with tenant-specific data MUST accept `tenant_id` as its first parameter.

```typescript
async getInventory(tenant_id: string, location_id: string): Promise<Inventory[]>;
```

### Rule 2: Validation

Incoming Data Transfer Objects (DTOs) should NOT include `tenant_id` if it is meant to be derived from the authenticated context. The backend should inject it to prevent "Tenant Hopping" attacks.

### Rule 3: Cross-Tenant Operations

Cross-tenant operations are strictly forbidden unless performed by a user with `SUPERADMIN` privileges and explicitly logged.
