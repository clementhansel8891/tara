# Implementation Plan

## Overview

This plan follows the exploratory bugfix workflow for the Retail module stabilization spec.
It addresses two defect families from the design: the E-Commerce Hierarchy Defect (e-commerce
modeled as standalone, out-of-hierarchy entities) and the Functional Stability Defect (broken
UI actions / operational flows). Tests are written BEFORE the fix: a bug condition exploration
test (Property 1) that must fail on unfixed code, and preservation property tests (Properties 2
and 3) that must pass on unfixed code. The fix is then applied and both test sets are re-run.

## Tasks

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - E-Commerce Registers As Virtual Branch And Actions Complete
  - **CRITICAL**: These tests MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when they fail**
  - **NOTE**: These tests encode the expected behavior - they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist before any fix
  - **Scoped PBT Approach**: For the deterministic defects (type union, stubbed handlers), scope the property to concrete failing cases for reproducibility; for the registration payloads, generate random valid inputs
  - Encode the Bug Condition from design (`isBugCondition`): Family A (e-commerce hierarchy) and Family B (functional stability)
  - Family A tests (assertions match Expected Behavior / Property 1):
    - For all valid e-commerce registration inputs, assert the result is a `RetailStore` with `type: "ecommerce"` that participates in the branch hierarchy (will fail - `RetailStore.type` has no `"ecommerce"` member; design "E-commerce-as-branch test")
    - Assert the management page exposes a single unified "register e-commerce as branch" entry point (will fail - flat lists only; design "Unified entry point test")
    - Assert the store/branch list renders e-commerce with a virtual type indicator and parent-child relationship (will fail; design "Hierarchy view test")
  - Family B tests (assertions match Expected Behavior / Property 1):
    - Simulate POS checkout / shift open / stock opname end-to-end and assert a resolved API call fires, data persists, and success/error feedback shows (will fail where handlers are stubbed/broken; design "Operational flow test")
    - Click a management action (e.g., Pricing Desk) and assert a resolved API call plus loading and success/error feedback (will fail on stub implementations; design "Management action test")
    - With no stores/channels configured, assert a guided onboarding call-to-action renders when `isConfigured === false` (edge case; design "Empty-state onboarding test")
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct - it proves the bugs exist)
  - Document counterexamples found (e.g., "`RetailStore.type` rejects `'ecommerce'`; connector created with `branchIds[]`", "Pricing Desk action handler fires no resolved API call / shows no feedback") to understand root cause
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Physical, Operational, Context, And Contract Behavior
  - **IMPORTANT**: Follow observation-first methodology - record actual outputs of the UNFIXED code first, then assert them
  - Observe and capture baseline behavior on UNFIXED code for inputs where `isBugCondition` returns false:
    - Physical-store CRUD: observe `POST`/`PUT /retail/stores/:id` create/update results for `"flagship"`, `"satellite"`, `"warehouse"` with full configs (3.1, 3.2)
    - Shift/checkout: observe `POST /retail/shifts/open` (conflict rejection, `opening_cash`) and `POST /retail/checkout` (shift validation, order/items, inventory, payment) (3.3, 3.4)
    - Context: observe `RetailContext` auto-selection, `localStorage` persistence, and absence of re-render loops with existing stores (3.5)
    - Legacy endpoints: observe `ecommerce-hub` connector/channel CRUD, API key rotation, credential management, connection testing responses (2.5, 3.6) - **Property 3: Legacy E-Commerce Endpoint Compatibility**
    - Page contracts: snapshot `ModuleContract.getPages()` (all 30+ definitions, routes, icons, groupings, permissions) (3.7)
    - Role gating: observe SUPERADMIN/OWNER/ADMIN fleet-view branch-gating bypass (3.8)
  - Write property-based tests that generate random non-buggy inputs across these domains and assert outputs equal the observed baseline (original-vs-fixed equivalence; from Preservation Requirements in design)
  - Property-based testing generates many test cases for stronger preservation guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms the baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix for e-commerce hierarchy and functional stability defects

  - [x] 3.1 Add virtual-branch type to the data model
    - Extend `RetailStore.type` to `"flagship" | "satellite" | "warehouse" | "ecommerce"` in `src/core/types/retail/retail.ts`
    - Allow an `"ecommerce"` store to carry `operational_config`, `supply_config`, and `channel_binding` like a physical branch
    - _Bug_Condition: isBugCondition(input) Family A - register_or_manage_ecommerce with standalone/out-of-hierarchy entity_
    - _Expected_Behavior: expectedBehavior(result) - e-commerce represented as RetailStore{type:"ecommerce"} in hierarchy_
    - _Preservation: physical RetailStore types and configs unchanged (3.1)_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Implement unified e-commerce registration path
    - In `backend/src/modules/retail/ecommerce-hub.service.ts` / `retail.service.ts`, provide a single registration operation that creates an `"ecommerce"` `RetailStore` (virtual branch) and optionally binds a `RetailChannel` to it
    - Ensure new e-commerce presence enters the branch hierarchy rather than as a standalone, branch-linked entity
    - _Bug_Condition: isBugCondition(input) Family A - no unified entry point / entity not in hierarchy_
    - _Expected_Behavior: expectedBehavior(result) - registration via single unified entry point places entity in hierarchy_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Preserve backward-compatible legacy mapping
    - In `src/core/services/retail/ecommerceHubService.ts` and the corresponding backend controller/service, keep `/retail/ecommerce-hub/connectors`, `/retail/ecommerce-hub/channels`, and legacy `ecommerce-stores` responding as before, internally mapping to the virtual-branch model where appropriate
    - _Bug_Condition: isBugCondition(input) Family A (legacy registration path)_
    - _Expected_Behavior: expectedBehavior(result) - backward-compatible response or transparent mapping (Property 3)_
    - _Preservation: legacy ecommerce-hub CRUD/key/credential/test operations unchanged (3.6)_
    - _Requirements: 2.5_

  - [x] 3.4 Add unified UI entry point and hierarchy view
    - In the e-commerce management page and store/branch list component(s) under `src/pages/retail/`, add a single "Register e-commerce" entry point that creates a virtual branch
    - Render e-commerce entities alongside physical branches with a clear physical-vs-virtual type indicator and parent-child relationships
    - _Bug_Condition: isBugCondition(input) Family A - flat lists, no register-as-branch CTA_
    - _Expected_Behavior: expectedBehavior(result) - unified entry point + hierarchy view with type indicator_
    - _Requirements: 2.3, 2.4_

  - [x] 3.5 Repair broken management and operational actions/flows
    - For each affected management action (Store Dashboard, Infrastructure Control, Device Control, Pricing Desk, Order Fulfillment, Inventory Visibility, Compliance Audit) and each operational flow (POS checkout, refund, stock opname, receiving, shift open/close, cash movement, self-service kiosk): wire the handler to a resolved API endpoint, add loading state, persist results, and surface success/error feedback
    - Add any missing backend handlers/persistence (opname, receiving, cash movement, kiosk, refund)
    - _Bug_Condition: isBugCondition(input) Family B - handlerIsStub / apiEndpointUnresolvedOrBroken / backendImplementationMissing / no persistence+feedback_
    - _Expected_Behavior: expectedBehavior(result) - resolved API call + loading + persistence + success/error feedback, full end-to-end flow_
    - _Preservation: already-working shift-open and checkout flows unchanged (3.3, 3.4)_
    - _Requirements: 2.6, 2.7_

  - [x] 3.6 Add guided onboarding for empty state
    - In `RetailContext` consumers (not the ref pattern itself), when `isConfigured === false`, route the user to a guided wizard / call-to-action to create the first physical or e-commerce location
    - **MUST NOT** modify the ref-based anti-loop logic in `src/pages/retail/context/RetailContext.tsx`
    - _Bug_Condition: isBugCondition(input) Family B - no onboarding consumer of isConfigured_
    - _Expected_Behavior: expectedBehavior(result) - guided onboarding CTA renders when no locations configured_
    - _Preservation: RetailContext auto-select and ref-based anti-loop behavior unchanged (3.5)_
    - _Requirements: 2.8_

  - [x] 3.7 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - E-Commerce Registers As Virtual Branch And Actions Complete
    - **IMPORTANT**: Re-run the SAME tests from task 1 - do NOT write new tests
    - The tests from task 1 encode the expected behavior; when they pass, they confirm the expected behavior is satisfied
    - Run the bug condition exploration tests from task 1
    - **EXPECTED OUTCOME**: Tests PASS (confirms both bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Physical, Operational, Context, And Contract Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run the preservation property tests from task 2 (including Property 3 legacy endpoint compatibility)
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after the fix (physical CRUD, shift/checkout, context, legacy endpoints, page contracts, role gating)
    - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run the full test suite (exploration, preservation, unit, property-based, integration)
  - Confirm fix checking holds for all buggy inputs and preservation checking holds for all non-buggy inputs
  - Ensure all tests pass, ask the user if questions arise

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"],
      "description": "Write tests before the fix: exploration tests fail on unfixed code, preservation tests pass on unfixed code"
    },
    {
      "wave": 2,
      "tasks": ["3.1"],
      "description": "Add virtual-branch type to the data model (foundation for hierarchy work)"
    },
    {
      "wave": 3,
      "tasks": ["3.2", "3.5", "3.6"],
      "description": "Unified registration path plus action/flow repairs and onboarding (3.5 and 3.6 are independent of the hierarchy chain)"
    },
    {
      "wave": 4,
      "tasks": ["3.3", "3.4"],
      "description": "Backward-compatible legacy mapping and unified UI entry point + hierarchy view"
    },
    {
      "wave": 5,
      "tasks": ["3.7", "3.8"],
      "description": "Re-run exploration and preservation tests to confirm fix and no regressions"
    },
    {
      "wave": 6,
      "tasks": ["4"],
      "description": "Checkpoint - ensure the full test suite passes"
    }
  ]
}
```

## Notes

- Tasks 1 and 2 MUST be completed before any task under 3. Exploration tests confirm the
  bugs exist (fail on unfixed code); preservation tests capture the baseline (pass on unfixed
  code) using the observation-first methodology.
- Property 1 (Bug Condition / Expected Behavior) is validated by the same test in tasks 1
  and 3.7 - do not write a new test in 3.7.
- Property 2 (Preservation) and Property 3 (Legacy Endpoint Compatibility) are validated by
  the same tests in tasks 2 and 3.8 - do not write new tests in 3.8.
- The ref-based anti-loop logic in `RetailContext.tsx` must remain untouched (preservation 3.5).
- For long-running test/watch commands, run them manually in your terminal; prefer single-run
  flags (e.g., `vitest --run`) over watch mode.
