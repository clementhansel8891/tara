

# Fix Finance Module -- Align with HR Patterns

## Problem Summary

The Finance module has ~50+ build errors caused by three root issues:

1. **Wrong import paths** -- Finance services/stores import from non-existent paths like `@/types/payablesTypes`, `@/services/payablesService`, `@/utils/apiClient` instead of the correct `@/core/...` paths
2. **Missing `apiClient`** -- Services use an `apiClient` (axios-style) that doesn't exist. The HR pattern uses mock repositories with localStorage, not HTTP calls
3. **Type mismatches** -- Workflow entity types, permission keys, contract statuses, and review statuses don't match their type definitions
4. **Missing zustand dependency** -- Stores import `zustand` which isn't installed
5. **Wrong route import paths** -- Finance pages are at `src/pages/core/finance/` (lowercase) but imported as `src/pages/core/Finance/` (uppercase)

## Fix Strategy

Follow the stable HR pattern: services call mock repositories directly (no HTTP client), stores are removed (use hooks instead), and all types stay in `src/core/types/finance/`.

---

## Technical Details

### Phase 1: Fix Route Imports (coreRoutes.tsx)

- Change import paths from `@/pages/core/Finance/...` to `@/pages/core/finance/...`
- Change permission strings from `core.finance.access` / `core.finance.treasury` to valid `PermissionKey` values: `finance.workspace.access` / `finance.treasury.view`

### Phase 2: Rewrite Finance Services to Use Mock Repo (like HR)

All 6 finance services currently use a non-existent `apiClient`. Rewrite each to call `mockFinanceRepo` directly, matching the HR service pattern:

- **ledgerService.ts** -- Use `mockFinanceRepo.listJournalEntries()`, `createJournalEntry()`, etc. Fix imports to use `@/core/types/finance/ledger`
- **payablesService.ts** -- Use `mockFinanceRepo.listPayables()`, `createPayable()`. Fix import from `../types/payablesTypes` to `@/core/types/finance/payables`
- **paymentsService.ts** -- Use `mockFinanceRepo.listPaymentRequests()`, `createPaymentRequest()`. Fix imports
- **payrollService.ts** -- Use mock repo pattern. Fix import from `../types/payrollTypes` to `@/core/types/finance/payrollTypes`
- **receivablesService.ts** -- Use `mockFinanceRepo.listReceivables()`, `createReceivable()`. Fix imports
- **workflowService.ts** -- This duplicates the HR workflow service. Remove the file and have finance use `@/core/services/hr/workflowService` (the canonical one)
- **treasuryService.ts** -- Remove import of non-existent `@/services/treasuryService`. Already uses mock repo as fallback; make mock repo the primary path

### Phase 3: Fix financeService.ts Type Errors

- Add `as const` assertions on mapped alert objects so `type` and `severity` fields match the `FinanceAlert` union types
- Add `"PAYMENT"` and `"TREASURY_TRANSFER"` to `WorkflowEntityType` in `src/core/tools/workflows/workflowTypes.ts`

### Phase 4: Remove Zustand Stores (Replace with Hooks)

The 6 store files all import `zustand` which isn't installed. Since the project already has corresponding hooks in `src/hooks/finance/`, delete the stores:

- Delete `src/core/store/ledgerStore.ts`
- Delete `src/core/store/payablesStore.ts`
- Delete `src/core/store/paymentsStore.ts`
- Delete `src/core/store/payrollStore.ts`
- Delete `src/core/store/receivablesStore.ts`
- Delete `src/core/store/treasuryStore.ts`

Then fix the hooks to use correct import paths (e.g., `@/core/services/finance/...` and `@/core/types/finance/...`).

### Phase 5: Fix HR Type Mismatches (Non-Finance but Blocking Build)

These are pre-existing HR issues that also need fixing:

- **mockStaffRepo.ts (line 127)** -- Add `as const` satisfies or type assertion for the `status` field so it matches `StaffStatus`
- **repositoryRegistry.ts (line 20)** -- Fix the generic constraint on `getRepo` to handle partial registry
- **analyticsService.ts (line 27)** -- `"signed"` is not a valid `ContractStatus`. Change to `"active"` (the equivalent in the type system)
- **hrWorkstreamService.ts (line 56)** -- `Contract` type doesn't have `departmentId`. Use a fallback like `contract.employeeId ?? "HR"`
- **legalService.ts** -- `"signed"` and `"pending"` are not valid `ContractRecord` statuses. Map to `"active"` and `"draft"` respectively
- **performanceService.ts (line 23)** -- `"completed"` is valid in `ReviewCycleStatus` but not in `PerformanceReview.status`. Change filter to `!== "approved"`
- **performanceService.ts (line 78)** -- `"calibrating"` is not a valid `ReviewCycleStatus`. Use `"active"` instead
- **peopleService.ts (line 25)** -- `Roles.STAFF` doesn't exist. Use `Roles.HR_STAFF` or check with `isStaffRole()`
- **staffService.ts (lines 33, 44)** -- `.includes()` type mismatch with `Role`. Use a type-safe check with array cast
- **payrollService.ts (line 21)** -- Same `.includes()` type mismatch. Cast the array or widen the type

### Phase 6: Fix Hook Import Paths

Update `src/hooks/finance/` hooks that reference wrong paths:
- `usePayables.ts` -- Fix `@/services/payablesService` to `@/core/services/finance/payablesService`
- `useLedger.ts` -- Fix `@/services/ledgerService` and `@/types/ledgerTypes` to correct `@/core/...` paths

---

## Files Changed Summary

| Category | Files | Action |
|----------|-------|--------|
| Routes | `coreRoutes.tsx` | Fix imports + permissions |
| Finance Services | 7 files in `services/finance/` | Rewrite to use mock repo |
| Workflow Types | `workflowTypes.ts` | Add PAYMENT, TREASURY_TRANSFER |
| Stores | 6 files in `core/store/` | Delete (replaced by hooks) |
| Hooks | 2 files in `hooks/finance/` | Fix import paths |
| HR Services | 6 files | Fix type mismatches |
| HR Core | `mockStaffRepo.ts`, `repositoryRegistry.ts` | Fix type assertions |

Total: ~22 files modified, 6 files deleted

