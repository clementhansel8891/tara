# HR Constraints Validation

## Primary Keys
All HR models use UUID v4 strings as primary keys (`@id @default(uuid())`). This ensures global uniqueness and prevents ID enumeration.

## Multi-Tenant Isolation
**CRITICAL**: Every HR model contains a `tenantId` field and a mandatory relation to `Company`.
- `Company` relation: `fields: [tenantId], references: [id]`.
- Indexing: `@@index([tenantId])` or `@@unique` including `tenantId` is present on all models.

## Unique Constraints
| Model | Constraint | Target Field(s) | Status |
|-------|------------|-----------------|--------|
| `Department` | `@@unique` | `[tenantId, code]` | VALID |
| `Employee` | `@@unique` | `[tenantId, employeeCode]` | VALID |
| `Employee` | `@@index` | `[email]` | WARNING: No unique constraint on email within tenant? |
| `Compensation`| `@@unique` | `[employeeId]` | VALID (1:1 with Employee) |
| `Product` | `@@unique` | `[tenantId, sku]` | VALID |

## Health Checks
- **Required Fields**: `firstName`, `lastName`, `hireDate`, `position` are strictly required in `Employee`.
- **Soft Deletes**: `deletedAt` is present in `Employee`, `AttendanceRecord`, `JobRequisition`, `Shift`, `Store`, `Compensation`.
- **Foreign Key Integrity**:
    - `Employee` -> `Department` (Required)
    - `Employee` -> `Location` (Required)
    - `AttendanceRecord` -> `Employee` (Required)
    - `PayrollLine` -> `PayrollRun` (Required)
