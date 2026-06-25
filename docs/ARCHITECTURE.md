# Architecture

## System Overview

TARA is an event-driven, dual-interface HR management system built on a monorepo structure with a React frontend and NestJS backend.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌──────────────────┐    ┌─────────────────────────────┐    │
│  │  Web Interface   │    │   Mobile Interface (PWA)    │    │
│  │  (Desktop/Tablet)│    │   (Phone - 320-428px)       │    │
│  │  HR & Supervisors│    │   All Employees             │    │
│  └────────┬─────────┘    └──────────────┬──────────────┘    │
└───────────┼─────────────────────────────┼───────────────────┘
            │         Vite Proxy          │
            └──────────────┬──────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    API GATEWAY (NestJS)                       │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐   │
│  │  Auth   │  │ Throttle │  │ Validation│  │  Context  │   │
│  │  Guard  │  │  Guard   │  │   Pipe    │  │  Filter   │   │
│  └─────────┘  └──────────┘  └───────────┘  └───────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                   APPLICATION LAYER                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              7 AUTONOMOUS AGENTS                     │    │
│  │  Leave Request │ Absensi │ Clock Confirm │ Weekly   │    │
│  │  Late Report   │ Onboarding │ Saldo Cuti            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌────────────┐    │
│  │   HR Services    │  │   Payroll    │  │  Schedule  │    │
│  │  (Employee, Dept │  │  (Periods,   │  │  (Shifts,  │    │
│  │   Leave, Attend) │  │   Payslips)  │  │   Assign)  │    │
│  └──────────────────┘  └──────────────┘  └────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    EVENT BUS                          │   │
│  │  Emit → Persist → Dispatch → External Consumers     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────────┐  ┌──────────┐  ┌────────────────┐    │
│  │   PostgreSQL     │  │  Redis   │  │   Backup       │    │
│  │   + PostGIS      │  │ (Cache)  │  │   Storage      │    │
│  └──────────────────┘  └──────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Design Principles

1. **Event-Driven** — All mutations emit structured events consumed by agents and external systems (Hermes AI).
2. **Dual Interface** — Web (administrative) and Mobile (self-service) with context-based access control.
3. **Autonomous Agents** — 7 independent agents operate 24/7 with configurable enable/disable.
4. **Manual Override** — Every automated action can be performed manually by HR.
5. **Single Source of Truth** — PostgreSQL is the authoritative data store; all agents read/write the same tables.

## Module Structure

```
backend/src/
├── app.module.ts              # Root module registration
├── main.ts                    # Bootstrap & server config
├── persistence/               # Database layer (Prisma)
├── core/
│   ├── auth/                  # JWT auth, guards, context
│   ├── hr/                    # Main HR module
│   │   ├── agents/            # 7 autonomous agents
│   │   ├── services/          # Business logic
│   │   ├── controllers/       # REST endpoints
│   │   ├── events/            # WebSocket event streaming
│   │   ├── i18n/              # Internationalization
│   │   └── scope/             # Context-based filtering
│   ├── settings/              # System configuration
│   └── demo/                  # Demo mode (mock data)
└── shared/
    ├── audit/                 # Audit logging
    ├── cache/                 # In-memory cache
    └── logger/                # Structured logging
```

## Context-Based Access Control

| User | Interface | Context | Data Access |
|------|-----------|---------|-------------|
| HR_Admin | Web | Administrative | All employees, all data |
| HR_Admin | Mobile | Personal Employee | Own data only |
| Supervisor | Web | Supervisor | Team data |
| Employee | Mobile | Personal Employee | Own data only |

## Communication Patterns

- **Frontend → Backend:** REST API via Vite proxy (`/api/` → `/v1/`)
- **Real-time:** WebSocket (Socket.IO) for notifications and live updates
- **Agent → Agent:** Event Bus (NestJS EventEmitter2, in-process)
- **External:** Hermes AI consumes events via WebSocket stream
- **Notifications:** Multi-channel delivery (In-app, WhatsApp, Telegram, Email)
