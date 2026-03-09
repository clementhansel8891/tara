# Zenvix AI Context: Project Essence

This document provides a condensed context for AI agents working on the Zenvix Platform.

## 1. Core Principles

- **Multi-Tenant Hierarchy:** Company (L1) -> Industry Module (L2) -> Location (L3).
- **Header Reliance:** Always use `x-tenant-id` and `x-location-id`.
- **Repository Pattern:** Decouple logic from DB. Use `MockRepository` for dev and `PrismaRepository` for prod.
- **Wizard UX:** UI should be step-by-step, human-centric.
- **Audit Logging:** Every mutation must be logged.

## 2. Directory Layout

- `ROOT/backend`: NestJS backend.
  - `src/core`: Business modules.
  - `src/persistence`: Repository implementations.
  - `src/shared`: Guards, Interceptors, Filters.
- `ROOT/src`: React + Vite frontend.
  - `src/modules`: Domain-specific components/hooks.
  - `src/core`: Fundamental platform logic.

## 3. Database & State

- **Primary DB:** PostgreSQL with Prisma.
- **Local DB (Future):** Dexie/PGLite for LAN-First.
- **State Management:** React Query for server state.

## 4. Current Directive

We are building the **Retail Gateway** and **External Channel Sync**.

- Priority: Finance, HR, and IT Core Stability.
- Mode: `DEV_MOCK_MODE`.

## 5. Coding Standards

- **Validation:** Always use DTOs and `class-validator`.
- **Error Handling:** RFC 7807 problem details.
- **Multi-Tenancy:** `tenant_id` is ALWAYS the first argument in service/repository methods.
