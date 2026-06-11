# Retail Module Stabilization Bugfix Design

## Overview

The Retail module carries two classes of defects that block production use:

1. **E-Commerce Hierarchy Defect (architectural):** E-commerce presence is modeled as
   three overlapping, standalone systems — legacy `ecommerce-stores`, `ecommerce-hub`
   connectors, and `ecommerce-hub` channels — each of which *links to* branches via
   `branchIds[]` / `branch_id` rather than *living inside* the branch hierarchy. The
   `RetailStore.type` union is `"flagship" | "satellite" | "warehouse"` with no
   `"ecommerce"` member, so there is no way to register e-commerce as a (virtual) branch.
   The result is no unified entry point, confusing UX, and e-commerce entities sitting
   outside the branch tree.

2. **Functional Stability Defect (breadth):** Numerous Management-plane and
   Operational-plane pages have non-functional action buttons, incomplete flows, broken
   or unresolved API calls, or missing backend handlers, so end-to-end workflows
   (POS checkout, refund, stock opname, receiving, shift open/close, cash movement,
   self-service kiosk, and management actions) do not complete.

The fix strategy is to (a) introduce e-commerce as a first-class virtual branch
(`RetailStore` with `type: "ecommerce"`) participating in the standard hierarchy with a
single unified registration entry point, while keeping the legacy `ecommerce-hub`
endpoints backward compatible by internally mapping to the new structure, and (b) repair
each broken UI action / flow so it performs a real API call with loading and
success/error feedback and persists data end-to-end.

Crucially, the bug condition methodology drives this work: every change must demonstrably
fix inputs where the bug manifests (fix checking) while leaving all non-buggy inputs —
existing physical-store creation/update, working shift/checkout flows, the ref-based
context anti-loop pattern, page contracts, and role gating — byte-for-byte unchanged
(preservation checking).

## Glossary

- **Bug_Condition (C)**: The condition that triggers a defect — an input that either
  (a) attempts to create/manage e-commerce presence and is forced into a standalone,
  out-of-hierarchy entity with no unified entry point, or (b) invokes a UI action /
  operational flow whose intended operation does not complete (no API call, unresolved
  endpoint, missing backend handler, or no persistence/feedback).
- **Property (P)**: The desired behavior when `C` holds — e-commerce is registered as a
  virtual branch (`RetailStore` with `type: "ecommerce"`) within the hierarchy via a
  single entry point, and every UI action / operational flow completes end-to-end with
  proper API integration, persistence, and user feedback.
- **Preservation**: Behavior that must remain unchanged — physical-store CRUD, working
  shift open / checkout flows, `RetailContext` auto-select and anti-loop ref pattern,
  backward-compatible `ecommerce-hub` CRUD/key/credential/test operations, the full
  `ModuleContract.getPages()` set, and privileged-role branch-gating bypass.
- **RetailStore**: Entity in `src/core/types/retail/retail.ts` whose `type` union is
  currently `"flagship" | "satellite" | "warehouse"`; the fix adds `"ecommerce"` to make
  it a virtual branch.
- **RetailChannel**: Sales channel entity (`RetailChannel` in the same types file) carrying
  an optional `branchId`; used to bind a channel to a branch in the hierarchy.
- **RetailContext**: React context in `src/pages/retail/context/RetailContext.tsx` that
  loads stores/channels, auto-selects an active location, exposes `isConfigured`, and uses
  refs to avoid an infinite re-render loop.
- **EcommerceHub**: Backend controller/service (`backend/src/modules/retail/ecommerce-hub.*`)
  exposing `/retail/ecommerce-hub/connectors` and `/retail/ecommerce-hub/channels`.

## Bug Details

### Bug Condition

The bug manifests in two overlapping families of inputs. The first family is any request to
create or manage e-commerce presence: the system constructs a standalone entity
(`EcommerceConnector`, `EcommerceChannel`, or legacy ecommerce store) that links *to*
branches instead of placing the entity *inside* the branch hierarchy as a virtual branch,
and the management UI exposes no unified entry point to register e-commerce as a branch.
The second family is any UI action or operational flow whose handler is a stub, points at
an unresolved/broken endpoint, lacks a backend implementation, or omits persistence and
user feedback — so the intended operation does not complete.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type RetailAction
         (an e-commerce registration request OR a UI/operational action invocation)
  OUTPUT: boolean

  // Family A: e-commerce hierarchy defect
  LET isEcommerceHierarchyBug =
        input.intent == "register_or_manage_ecommerce"
        AND ( resultingEntityIsStandalone(input)            // links TO branches
              OR NOT existsUnifiedHierarchyEntryPoint(input) // no "register as branch"
              OR NOT ecommerceAppearsInBranchHierarchy(input) )

  // Family B: functional stability defect
  LET isFunctionalStabilityBug =
        input.intent == "invoke_ui_or_operational_action"
        AND ( handlerIsStub(input)
              OR apiEndpointUnresolvedOrBroken(input)
              OR backendImplementationMissing(input)
              OR NOT (operationPersisted(input) AND userFeedbackShown(input)) )

  RETURN isEcommerceHierarchyBug OR isFunctionalStabilityBug
END FUNCTION
```

### Examples

- **Standalone connector (1.1):** `POST /retail/ecommerce-hub/connectors` creates an
  `EcommerceConnector` with `branchIds[]` linking to branches. *Expected:* e-commerce is
  registered as a `RetailStore` with `type: "ecommerce"` inside the hierarchy.
- **Out-of-tree channel (1.2):** `POST /retail/ecommerce-hub/channels` creates an
  `EcommerceChannel` with `branchIds[]`, leaving it outside the branch tree. *Expected:*
  the channel is associated within the hierarchy (sub-entity of a branch or its own
  virtual branch) with visible parent-child relationships.
- **No unified entry point (1.4, 1.5):** The management page lists connectors/channels as
  flat lists with no "register e-commerce as a branch" option and three competing systems.
  *Expected:* one unified entry point that places e-commerce in the hierarchy.
- **Dead operational button (1.6):** Pressing "Open Shift" / "Checkout" / "Stock Opname"
  produces no completed flow due to a missing/incomplete backend or broken data flow.
  *Expected:* the full flow completes with persistence and feedback.
- **Dead management button (1.7):** Clicking an action on Store Dashboard / Pricing Desk /
  Order Fulfillment shows no response or an error due to a stub. *Expected:* the operation
  executes with loading and success/error feedback.
- **No onboarding (1.8, edge case):** `RetailContext` finds no stores/channels, sets
  `isConfigured: false`, and shows no guided path. *Expected:* a guided onboarding wizard /
  clear call-to-action to create the first location.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Physical `RetailStore` creation for `"flagship"`, `"satellite"`, `"warehouse"` must keep
  full `operational_config`, `supply_config`, `infrastructure_registry`, and
  `channel_binding` capabilities (3.1).
- `PUT /retail/stores/:id` must continue to update all fields (name, code, address,
  configs, governance) with no data loss (3.2).
- `POST /retail/shifts/open` for a physical store must still create the shift record,
  reject conflicting open shifts, and return the shift with `opening_cash` (3.3).
- `POST /retail/checkout` with a valid active shift must still validate shift status,
  create the order with all items, update inventory, process payment, and return the
  completed order (3.4).
- `RetailContext` with existing stores/channels must still auto-select the stored or first
  store, persist selection via `localStorage`, and avoid infinite re-render loops via the
  ref-based pattern (3.5).
- Existing `ecommerce-hub` connector/channel endpoints must keep CRUD, API key rotation,
  credential management, and connection testing working for backward compatibility (3.6).
- `ModuleContract.getPages()` must still return all 30+ page definitions with correct
  routes, icons, menu groupings, and permissions for both planes (3.7).
- Privileged roles (SUPERADMIN, OWNER, ADMIN) must still bypass branch-gating and see the
  full fleet (3.8).

**Scope:**
All inputs that do NOT satisfy `isBugCondition` must be completely unaffected by this fix.
This includes:
- Physical-store create/read/update requests already producing correct results.
- Shift open and checkout flows that already complete correctly for physical stores.
- Already-working `ecommerce-hub` CRUD/key/credential/test calls.
- Context loads where stores/channels already exist and auto-selection already works.
- Page-contract resolution and role-based gating that already behave correctly.

**Note:** The actual expected correct behavior for buggy inputs is defined in the
Correctness Properties section (Property 1). This section focuses on what must NOT change.

## Hypothesized Root Cause

Based on the bug description and the code inspected, the most likely issues are:

1. **Missing virtual-branch type in the data model**: `RetailStore.type` is
   `"flagship" | "satellite" | "warehouse"` only. Without an `"ecommerce"` member,
   e-commerce cannot be represented as a branch, forcing standalone connector/channel
   entities that link via `branchIds[]` / `branch_id`.

2. **Three competing e-commerce subsystems**: Legacy `ecommerce-stores`,
   `ecommerce-hub` connectors, and `ecommerce-hub` channels evolved independently with no
   single registration path, so the UI exposes flat lists and no "register as branch" CTA.

3. **Stubbed / unwired UI actions**: Management and operational action handlers are either
   placeholder stubs, call endpoints that are unresolved or broken, or fire an API call
   but never surface loading/success/error state or persist results.

4. **Missing or incomplete backend handlers**: Some operational endpoints (opname,
   receiving, cash movement, kiosk, refund) lack complete server-side implementations or
   data persistence, so flows cannot complete end-to-end.

5. **No onboarding branch for the empty state**: `RetailContext` computes
   `isConfigured: false` when no stores/channels exist but no component consumes that to
   route the user into a guided first-location creation flow.

## Correctness Properties

Property 1: Bug Condition - E-Commerce Registers As Virtual Branch And Actions Complete

_For any_ input where the bug condition holds (`isBugCondition` returns true), the fixed
system SHALL produce the corrected behavior: an e-commerce registration request SHALL
create/represent the entity as a `RetailStore` with `type: "ecommerce"` (a virtual branch)
that participates in the standard branch hierarchy with the same configuration capabilities
as a physical branch, reachable through a single unified entry point and visible in the
store/branch list with a clear type indicator; and a UI/operational action invocation SHALL
execute its intended operation through a resolved API call, display loading state, persist
data, and present success/error feedback, completing the full end-to-end flow. When no
locations are configured, the system SHALL present a guided onboarding call-to-action.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8**

Property 2: Preservation - Existing Physical, Operational, Context, And Contract Behavior

_For any_ input where the bug condition does NOT hold (`isBugCondition` returns false), the
fixed system SHALL produce exactly the same result as the original system, preserving
physical-store creation and update, working shift-open and checkout flows, the
`RetailContext` auto-selection and ref-based anti-loop behavior, backward-compatible
`ecommerce-hub` CRUD/key/credential/test operations, the complete `ModuleContract.getPages()`
set, and privileged-role branch-gating bypass.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

Property 3: Preservation - Legacy E-Commerce Endpoint Compatibility

_For any_ call to a legacy e-commerce endpoint (`/retail/ecommerce-hub/connectors`,
`/retail/ecommerce-hub/channels`, legacy `ecommerce-stores`), the fixed system SHALL either
return a backward-compatible response or transparently map the request onto the new
hierarchy model without breaking existing callers, preserving the observable contract for
clients that have not migrated.

**Validates: Requirements 2.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/core/types/retail/retail.ts`

**Function/Type**: `RetailStore`

**Specific Changes**:
1. **Add virtual-branch type**: Extend `RetailStore.type` to
   `"flagship" | "satellite" | "warehouse" | "ecommerce"` and allow an `"ecommerce"`
   store to carry `operational_config`, `supply_config`, and `channel_binding` like a
   physical branch.

2. **Unified e-commerce registration path**:
   - **File**: `backend/src/modules/retail/ecommerce-hub.service.ts` /
     `backend/src/modules/retail/retail.service.ts`
   - Provide a single registration operation that creates an `"ecommerce"` `RetailStore`
     (virtual branch) and optionally binds a `RetailChannel` to it, so new e-commerce
     presence enters the branch hierarchy rather than as a standalone, branch-linked entity.

3. **Backward-compatible legacy mapping**:
   - **File**: `src/core/services/retail/ecommerceHubService.ts` and the corresponding
     backend controller/service.
   - Keep `/retail/ecommerce-hub/connectors`, `/retail/ecommerce-hub/channels`, and legacy
     `ecommerce-stores` responding as before, internally mapping to the virtual-branch model
     where appropriate (Property 3 preservation).

4. **Unified UI entry point + hierarchy view**:
   - **File**: the e-commerce management page and the store/branch list component(s) under
     `src/pages/retail/`.
   - Add a single "Register e-commerce" entry point that creates a virtual branch, and
     render e-commerce entities alongside physical branches with a clear physical-vs-virtual
     type indicator and parent-child relationships.

5. **Repair broken actions and flows**:
   - For each affected management action (Store Dashboard, Infrastructure Control, Device
     Control, Pricing Desk, Order Fulfillment, Inventory Visibility, Compliance Audit) and
     each operational flow (POS checkout, refund, stock opname, receiving, shift open/close,
     cash movement, self-service kiosk), wire the handler to a resolved API endpoint, add
     loading state, persist results, and surface success/error feedback. Add any missing
     backend handlers/persistence.

6. **Guided onboarding for empty state**:
   - **File**: `src/pages/retail/context/RetailContext.tsx` consumers (not the ref pattern
     itself).
   - When `isConfigured === false`, route the user to a guided wizard / call-to-action to
     create the first physical or e-commerce location. The ref-based anti-loop logic in
     `RetailContext` MUST remain untouched (preservation 3.5).

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that
demonstrate the bugs on the UNFIXED code, then verify the fix works for buggy inputs (fix
checking) and preserves existing behavior for non-buggy inputs (preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix.
Confirm or refute the root-cause hypotheses. If refuted, re-hypothesize.

**Test Plan**: Write tests that (a) attempt to register e-commerce and assert it becomes a
hierarchy-participating virtual branch reachable via a unified entry point, and (b) invoke
each affected UI/operational action and assert the intended API call fires, data persists,
and feedback is shown. Run these on the UNFIXED code to observe failures.

**Test Cases**:
1. **E-commerce-as-branch test**: Register e-commerce and assert a `RetailStore` with
   `type: "ecommerce"` exists in the hierarchy (will fail on unfixed code — type union has
   no `"ecommerce"`).
2. **Unified entry point test**: Assert the management page exposes a single "register
   e-commerce as branch" action (will fail on unfixed code — flat lists only).
3. **Hierarchy view test**: Assert the store/branch list shows e-commerce with a virtual
   type indicator and parent-child relationship (will fail on unfixed code).
4. **Operational flow test**: Simulate POS checkout / shift open / stock opname end-to-end
   and assert persistence + feedback (will fail where handlers are stubbed/broken).
5. **Management action test**: Click a management action (e.g., Pricing Desk) and assert a
   resolved API call + success/error feedback (will fail on stub implementations).
6. **Empty-state onboarding test (edge case)**: With no stores/channels, assert a guided
   call-to-action renders (may fail on unfixed code).

**Expected Counterexamples**:
- `RetailStore.type` rejects `"ecommerce"`; e-commerce entities carry `branchIds[]`/`branch_id`.
- Action handlers do not fire a resolved API call, do not persist, or show no feedback.
- Possible causes: missing model type, three competing subsystems, stubbed handlers,
  unresolved/missing backend endpoints, no onboarding consumer of `isConfigured`.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function
produces the expected behavior (Property 1).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedSystem(input)
  ASSERT expectedBehavior(result)
  // e-commerce registration -> RetailStore{type:"ecommerce"} in hierarchy via unified entry point
  // UI/operational action  -> resolved API call + persistence + success/error feedback
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed
function produces the same result as the original function (Properties 2 and 3).

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalSystem(input) = fixedSystem(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking
because:
- It generates many test cases automatically across the input domain.
- It catches edge cases that manual unit tests might miss.
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs.

**Test Plan**: Observe behavior on UNFIXED code first for physical-store CRUD, shift/checkout
flows, context auto-selection, legacy `ecommerce-hub` operations, page contracts, and role
gating; then write property-based tests capturing that behavior and re-run against the fix.

**Test Cases**:
1. **Physical-store CRUD preservation**: Observe physical-store create/update on unfixed
   code, then verify identical results after the fix (3.1, 3.2).
2. **Shift/checkout preservation**: Observe shift open and checkout on unfixed code, then
   verify identical validation, persistence, and responses after the fix (3.3, 3.4).
3. **Context anti-loop preservation**: Observe auto-selection, `localStorage` persistence,
   and absence of re-render loops on unfixed code with existing stores; verify unchanged
   after the fix (3.5).
4. **Legacy endpoint preservation**: Observe `ecommerce-hub` CRUD/key/credential/test
   responses on unfixed code, then verify backward-compatible responses after the fix
   (2.5, 3.6).
5. **Page-contract preservation**: Snapshot `ModuleContract.getPages()` on unfixed code,
   then verify the same 30+ definitions after the fix (3.7).
6. **Role-gating preservation**: Observe SUPERADMIN/OWNER/ADMIN fleet visibility on unfixed
   code, then verify unchanged bypass after the fix (3.8).

### Unit Tests

- E-commerce registration creates a `RetailStore` with `type: "ecommerce"` in the hierarchy.
- Each repaired UI/operational action invokes a resolved API call and renders feedback.
- Empty-state onboarding renders when `isConfigured === false`.
- Physical-store create/update and shift/checkout edge cases (conflicting open shift,
  invalid shift status) behave as before.

### Property-Based Tests

- Generate random valid e-commerce registration payloads and assert the result is always a
  hierarchy-participating virtual branch (fix checking, Property 1).
- Generate random non-buggy inputs (physical-store CRUD, working shift/checkout, legacy
  hub calls) and assert original-vs-fixed equivalence (preservation, Properties 2 & 3).
- Generate random store/channel population states and assert `isConfigured` and
  auto-selection behavior are unchanged.

### Integration Tests

- Full flow: register e-commerce as a virtual branch, then operate it (channel binding,
  inventory, checkout) end-to-end through the unified entry point.
- Context switching: switch between physical and e-commerce/virtual branches and confirm
  state, persistence, and gating behave correctly.
- Visual feedback: confirm loading and success/error states appear for management and
  operational actions, and that the onboarding CTA leads to a created first location.
