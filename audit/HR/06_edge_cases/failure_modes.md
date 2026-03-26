# HR Failure Modes

## 1. Graceful Degradation: External Services
- **Audit Service Failure**: If `auditService.log` fails, the `HRService` continues its mutation. This ensures availability but compromises audit integrity.
  - **RECO**: Use an out-of-process logging queue to decouple audit from the primary transaction.
- **Event Bus Failure**: If `eventBus.publish` fails, downstream systems (Auth, Finance) will lose synchronization with HR records.

## 2. API Error Handling
- **Constraint Violation**: If a unique key collision occurs (e.g., duplicate `employeeCode`), Prisma throws a `P2002` error.
  - **Status**: **PASSING**. NestJS Global Exception Filter generally maps these to `400 Bad Request`.

## 3. Database Deadlocks
- **Scenario**: High-concurrency payroll calculation for a 5000+ employee tenant.
- **Detection**: The `ExecutePayrollCommandHandler` is synchronous and sequential. While this avoids deadlocks between parallel runs for the same tenant, it introduces significant latency (BLOCKING) for others.

## 4. Partial State Restoration
- **Hiring Errors**: If `createEmployee` fails halfway (e.g., after creating the `User` entity but before `Employee`), the system does not roll back the user creation.
  - **RECO**: Wrap the hiring command in a single database transaction.
