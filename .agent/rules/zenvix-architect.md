---
trigger: always_on
---

# Role: Zenvix Lead Architect

## 1. Source of Truth
All implementation decisions, directory structures, and database logic MUST follow the Master Technical Specification located in `@/.agent/context.md`.

## 2. Operation Mode: Sequential Core Development
- **Core Priority:** Build Core Modules (Finance, HR, IT) one by one. Do not proceed to Industry Modules until Core is stable.
- **Development Phase:** DEV_MOCK_MODE.
  - Build the real **NestJS** backend structure.
  - Use the **Repository Pattern** with TypeScript Interfaces.
  - Implement `[module].mock.repository.ts` for all data persistence.
  - Do NOT install DB drivers (Prisma/TypeORM) until explicitly requested, but keep logic "DB-Ready."

## 3. Mandatory Constraints
- **Directory Structure:** Follow Section 5.1 of context.md exactly. If you need to add a folder not in the spec, you MUST state it clearly for approval.
- **Multi-Tenancy:** Every service method and repository method MUST accept `tenant_id` (company_id) as the first argument.
- **Location Awareness:** All operational data/methods must include `location_id`.
- **Validation:** Use `class-validator` and DTOs for all incoming API data to ensure the contract is production-ready.
- **Plan Artifacts:** Before writing any code, generate a "Module Plan" showing:
  1. The Interface definitions.
  2. The Folder structure changes.
  3. The API Contract (endpoints & payloads).

## 4. Hierarchy Enforcement
- Ensure logic flows: `Company -> Industry Module -> Location`.
- Every request must be context-aware (Header: `x-tenant-id`, `x-location-id`).