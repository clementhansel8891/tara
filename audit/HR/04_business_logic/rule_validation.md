# HR Rule Validation

## 1. Strategy: Layered Validation
- **DTO Validation**: `class-validator` handles structural integrity (email format, non-empty fields).
- **Service Logic**: `HRService` handles cross-entity logic (e.g., verifying department existence before hire).
- **Command Handlers**: Orchestrate cross-module rules (e.g., HR + Compliance).

## 2. Audit & Traceability Rules
- **Rule**: Every mutation must be audited with `before` and `after` states.
- **Status**: **PASSING** for `updateEmployee`, `promote`, `transfer`.
- **Status**: **FAILING** for `hireEmployee` (only logs metadata, no full state snapshot).

## 3. Event-Driven Propagation
- **Rule**: Downstream systems (Finance, IT) must be notified of HR changes.
- **Status**: **PASSING**. `EventBusService` is used consistently across all lifecycle commands.

## 4. Compliance Siloing
- **Rule**: Country-specific rules (ID, SG, AE) must be isolated.
- **Status**: **PASSING**. Logic is delegated to `ComplianceEngineService`, keeping the HR core clean.

## 5. Security & Permission Mapping
- **Rule**: Only authorized roles can approve payroll.
- **Status**: **PARTIAL**. Role check is hardcoded in `HRController.approvePayrollRun` (lines 1158-1162). This should be moved to a custom `@PayrollAdmin()` decorator or policy-based guard for better maintainability.
