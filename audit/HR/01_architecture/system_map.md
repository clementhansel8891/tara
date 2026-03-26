# HR System Map

## Overview
The HR module is a core component of the Zenvix enterprise system, responsible for employee lifecycle management, workforce optimization, and compliance. It follows a layered NestJS architecture with a command-based execution model for critical state changes.

## Layers

### 1. API Surface (Controllers)
- **HRController**: Main entry point for RESTful operations. Handles employees, attendance, leave, payroll, and organizational structure.
- **WorkflowController**: Shared controller for workflow-related operations (likely inbox/tasks).

### 2. Service Layer (Business Logic)
- **HRService**: Orchestrates core HR operations.
- **Specialized Services**:
    - `TalentSourcingService`: Recruitment and lead management.
    - `ComplianceService`: Regulatory tracking and reporting.
    - `WorkforcePlannerService`: Headcount and budget planning.
    - `PayrollConsolidationService`: Aggregates payroll data for processing.
    - `AnalyticsService`: Dashboarding and KPI reporting.
    - `SuccessionService`: Career planning and internal mobility.
    - `LearningService`: Training and skill development.
    - `PerformancePredictorService`: AI-driven performance modeling.

### 3. Command Layer (Phase 1)
Implement explicit command handlers for high-integrity state transitions:
- `HireEmployeeCommandHandler`
- `PromoteEmployeeCommandHandler`
- `TransferEmployeeCommandHandler`
- `TerminateEmployeeCommandHandler`
- `SuspendEmployeeCommandHandler`
- `ExecutePayrollCommandHandler`

### 4. Data Access Layer (Repositories)
- **IHRRepository**: Abstract interface for HR operations.
- **HRDbRepository**: Prisma-backed implementation for production.
- **HRMockRepository**: Memory-backed implementation for testing and rapid development.

### 5. Interceptors & Guards
- **HRMutationInterceptor**: Log and audit all write operations.
- **TenantInterceptor**: Injects `tenant_id` from headers into the request context.
- **ModuleStateGuard**: Ensures the HR module is active for the tenant.
- **TenantGuard**: Enforces isolation boundaries.

## Component Relationships
- **PrismaService** is used globally for DB persistence.
- **AuditModule** is used for forensic logging of HR actions.
- **FileProcessingModule** handles bulk imports/exports.
- **ComplianceEngineModule** provides the rules for regulatory validation.
