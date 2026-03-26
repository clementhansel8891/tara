# HR Inconsistencies

## 1. Naming Conventions (Code vs Schema)
- **Schema**: Use `@map` to convert `camelCase` to `snake_case` (e.g., `tenantId` -> `tenant_id`).
- **Code**: `HRController` sometimes uses `id` for employee ID and other times `employeeId`.
- **Finding**: Inconsistency in parameter naming across `getCompensation(employeeId)` vs `getCase(id)`.

## 2. Payroll Run Implementation
- **Inconsistency**: Half of the payroll logic treats `PayrollRun` as a dedicated entity, while the `HRController` and `HRCase` system treat it as a generic "Case" with type `PAYROLL_RUN`.
- **Risk**: This results in fragmented data storage (some in `PayrollRun` table, some in `HRCase` descriptions).

## 3. Date Handling
- **Observation**: Some endpoints expect `ISO` strings, while others parse dates using `new Date()` without validation.
- **Risk**: Potential for timezone drift if the server and database are in different regions, specifically for attendance and clock-in records.

## 4. Return Object Structure
- **Observation**: The `HRController` returns `{ success: boolean, tenantId, data }`.
- **Finding**: Some endpoints return `message` (e.g., `promoteEmployee`), while others return raw data objects (e.g., `getEmployees`). This complicates frontend generic response handling.
