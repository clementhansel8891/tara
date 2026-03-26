# HR Request-Response Contracts

## Common Patterns
- **Multi-Tenancy**: All requests MUST include `x-tenant-id` header.
- **Responses**: Standard format: `{ success: boolean, tenantId: string, data: any, message?: string }`.
- **Validation**: Enforced via `class-validator` DTOs (e.g., `CreateEmployeeDto`, `UpdateCompensationDto`).

## Critical DTOs

### Employee Creation (`CreateEmployeeDto`)
- **Required**: `firstName`, `lastName`, `email`, `departmentId`, `hireDate`, `position`.
- **Optional**: `phone`, `locationId`, `employeeCode` (auto-generated if missing).

### Payroll Run Payload
- **Context**: Managed via `HRCase` shell.
- **Fields**: `periodStart`, `periodEnd`.
- **Status Enum**: `DRAFT` -> `IN_PROGRESS` -> `CLOSED`.

### Compliance Calculation
- **Input**: `{ module: string, period: string }`
- **Output**: Detailed JSON containing contribution breakdowns for Employer/Employee.

## Contract Integrity Issues
- **Payroll Inconsistency**: The system uses `HRCase` as a wrapper for `PayrollRun` in some endpoints, leading to untyped `metadata` stored in `description` or `title` fields (e.g., lines 1099, 1114, 1188).
- **Date Formatting**: API layer expects ISO strings, but some logic (e.g., line 1629) manually instantiates `new Date(dto.plannedHireDate)` without explicit validation of the date format.
