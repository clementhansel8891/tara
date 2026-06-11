# Implementation Plan: Full App Production Readiness Audit

## Overview

Build a three-layer audit tooling system in TypeScript that (1) statically analyzes source code for interactive elements and API patterns, (2) runs Playwright-based E2E tests across all critical business workflows, and (3) aggregates findings into a scored markdown report. All tooling integrates into the existing project stack (TypeScript, Vitest, Playwright, NestJS, React/Vite) without introducing new frameworks.

## Tasks

- [x] 1. Set up shared types, utilities, and project scaffolding
  - Create the `scripts/audit/` directory structure and all subdirectory placeholders
  - Create `scripts/audit/types/audit-types.ts` with all shared TypeScript interfaces: `InteractiveElement`, `ClassifiedElement`, `ModalInstance`, `ApiMapping`, `PerfIssue`, `WorkflowStepResult`, `AuditSummary`, `ModuleAuditData`, `Blocker`, `BackendRoute`, `ModuleConfig`
  - Create `scripts/audit/utils/file-walker.ts` implementing recursive file glob using Node.js `fs.readdir` with `recursive` option and extension filtering
  - Create `scripts/audit/utils/ast-parser.ts` with shared TypeScript Compiler API helpers: `createSourceFile`, `visitNodes`, JSX-aware node visitor utilities
  - Define and export `MODULE_REGISTRY` constant in `scripts/audit/types/audit-types.ts` mapping all 24 modules to their page paths and layers
  - Add the `audit-results/` directory to `.gitignore`
  - _Requirements: 1.1, 1.6, 6.1_

  - [x] 1.1 Create shared types file
    - Write all TypeScript interfaces listed above
    - Export `MODULE_REGISTRY` with all 24 module configs
    - _Requirements: 1.1, 4.1, 6.1_

  - [x] 1.2 Create file-walker utility
    - Implement `walkFiles(rootDir: string, patterns: string[]): Promise<string[]>`
    - Support glob patterns like `src/{pages,components}/**/*.{ts,tsx}`
    - Handle missing directories gracefully (return empty array, log warning)
    - _Requirements: 1.1, 5.2_

  - [x] 1.3 Create AST parser utilities
    - Implement `parseSourceFile(filePath: string): ts.SourceFile`
    - Implement `visitNodes(node: ts.Node, visitor: (node: ts.Node) => void): void`
    - Implement helpers for extracting JSX element names, handler expressions, and surrounding text
    - _Requirements: 1.1, 4.1_

- [x] 2. Implement static analysis analyzers
  - [x] 2.1 Implement RouteRegistry (`scripts/audit/utils/route-registry.ts`)
    - Scan `backend/src/**/*.controller.ts` files using the AST parser
    - Parse NestJS class decorators `@Controller('path')` and method decorators `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`
    - Combine controller prefix + method path into normalized full route: `{ method, path, controllerFile }`
    - Export `buildRouteRegistry(backendDir: string): Promise<BackendRoute[]>`
    - _Requirements: 4.1, 4.2_

  - [x] 2.2 Write unit tests for RouteRegistry
    - Test NestJS decorator parsing with sample controller fixture files
    - Test path combination (controller prefix + method path)
    - Test edge cases: no prefix, nested paths, multiple methods on same route
    - _Requirements: 4.2_

  - [x] 2.3 Implement ElementScanner (`scripts/audit/analyzers/element-scanner.ts`)
    - Walk all `.tsx`/`.ts` files under `src/pages/` and `src/components/` using FileWalker
    - Use AST parser to find JSX elements with `onClick`, `onSubmit`, `onPress`, `onChange` on interactive elements
    - Find `<Button>`, `<Link>`, `<a>` elements and `forwardRef` components accepting click handlers
    - Extract: `filePath`, `lineNumber`, `elementType`, `handlerName`, `handlerBody`, `parentComponent`, `layer`, `pagePath`
    - Assign `id` as hash of `file:line:handler`
    - Map file path to module layer using `MODULE_REGISTRY`
    - Export `scanElements(rootDir: string): Promise<InteractiveElement[]>`
    - Write results to `audit-results/static/elements.json`
    - _Requirements: 1.1_

  - [x] 2.4 Write property test for ElementScanner — Classification Completeness (Phase 1)
    - **Property 1: Classification Completeness**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**
    - Using `fast-check`, generate arbitrary arrays of `InteractiveElement` objects
    - Assert that every element passed to `StubDetector.classify()` produces an output with exactly one valid classification from `['fully_functional', 'partially_working', 'stub', 'broken', 'needs_dynamic_verification']`
    - Assert output array length equals input array length
    - Place in `scripts/audit/analyzers/__tests__/stub-detector.pbt.test.ts`

  - [x] 2.5 Implement StubDetector (`scripts/audit/analyzers/stub-detector.ts`)
    - Apply classification rules in priority order against `handlerBody`:
      1. Empty body `() => {}` → `stub`
      2. Only `toast()`, `console.log()`, `alert()` calls → `stub`
      3. Only `// TODO` / `// FIXME` comments → `stub`
      4. Calls API but no `.then`, `onSuccess`, or state update → `partially_working`
      5. Opens modal whose submit is a stub → `partially_working`
      6. Calls API endpoint not in backend route registry → `broken`
      7. Calls working API AND updates UI state → `fully_functional`
      8. Cannot be determined statically → `needs_dynamic_verification`
    - Accept route registry as dependency for rule #6
    - Export `classify(elements: InteractiveElement[], routes: BackendRoute[]): ClassifiedElement[]`
    - Write results to `audit-results/static/stubs.json`
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 2.6 Write unit tests for StubDetector classification rules
    - Test each of the 8 classification rules in isolation with known handler body strings
    - Test boundary conditions between `stub` and `partially_working`
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 2.7 Implement ModalScanner (`scripts/audit/analyzers/modal-scanner.ts`)
    - Walk `.tsx`/`.ts` files and detect imports of `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Modal`, `Popover` from `@radix-ui/*` or `src/components/ui/*`
    - Find JSX usage of `<DialogContent>`, `<SheetContent>`, `<DrawerContent>` and their trigger elements
    - Classify each modal: `hasForm`, `hasSubmitHandler`, `submitClassification`, `hasValidation`, `hasCancelHandler`
    - Export `scanModals(rootDir: string): Promise<ModalInstance[]>`
    - Write results to `audit-results/static/modals.json`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.8 Implement ApiMapper (`scripts/audit/analyzers/api-mapper.ts`)
    - Scan frontend files for: `useQuery`/`useMutation` from `@tanstack/react-query`, `fetch()`, `axios.*()`, and custom API utility calls in `src/lib/api*` / `src/core/api*`
    - Extract HTTP method, URL/path pattern, and file location for each call
    - Use `RouteRegistry` to cross-reference with backend routes
    - Normalize paths: remove trailing slashes, expand `:id`-style params to wildcard patterns
    - Classify: `connected` (exact match), `disconnected` (no match), `mock_data` (no API call, static data)
    - Capture nearby `// TODO`, `// FIXME`, `// HACK`, `// PLACEHOLDER` comments
    - Assign `businessCriticality` based on module layer and workflow criticality
    - Export `mapApis(frontendDir: string, backendDir: string): Promise<ApiMapping[]>`
    - Write results to `audit-results/static/api-map.json`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.9 Write property test for ApiMapper — API Mapping Accuracy
    - **Property 3: API Mapping Accuracy**
    - **Validates: Requirements 4.1, 4.2**
    - Using `fast-check`, generate arbitrary frontend API call objects and backend route objects
    - Assert: when `call.method === route.method` AND `pathMatches(call.path, route.path)`, then `classify()` returns `'connected'`
    - Assert: when no backend route matches the call, `classify()` returns `'disconnected'`
    - Place in `scripts/audit/analyzers/__tests__/api-mapper.pbt.test.ts`

  - [x] 2.10 Implement PerfAnalyzer (`scripts/audit/analyzers/perf-analyzer.ts`)
    - Backend checks (via AST): `findMany()` without `take`/`skip`, nested `include` > 2 levels, `@Query()` handlers without pagination params, missing `@UseInterceptors(CacheInterceptor)` on read-heavy endpoints
    - Frontend checks: `useQuery` without `keepPreviousData` or pagination, large list renders without virtualization, missing `Suspense`/error boundary wrappers, socket.io-client without reconnection config
    - Assign `severity` per issue type
    - Export `analyzePerformance(projectRoot: string): Promise<PerfIssue[]>`
    - Write results to `audit-results/static/perf-issues.json`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Checkpoint — Static analyzers complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement report generator
  - [x] 4.1 Implement ScoringEngine (`scripts/audit/reporters/scoring-engine.ts`)
    - Implement `calculateReadinessScore(module: ModuleAuditData): number` with the weighted formula:
      - `functionalElements` weight 0.30
      - `workflowPass` weight 0.35
      - `apiConnected` weight 0.20
      - `noCriticalPerf` weight 0.15
    - Handle zero-total edge cases (avoid division by zero; treat missing data as 0)
    - Implement `classifyGoNoGo(score: number, p0Count: number): 'go' | 'no-go'` using the 80%/zero-P0 threshold
    - Export both functions as pure functions (no side effects)
    - _Requirements: 5.6, 6.2_

  - [x] 4.2 Write property test for ScoringEngine — Score Boundedness
    - **Property 5: Score Boundedness**
    - **Validates: Requirements 5.6, 6.2**
    - Using `fast-check`, generate arbitrary `ModuleAuditData` objects with valid non-negative integer fields
    - Assert `calculateReadinessScore()` always returns a value in `[0, 100]`
    - Include edge cases: all zeros, all max values, mixed values
    - Place in `scripts/audit/reporters/__tests__/scoring-engine.pbt.test.ts`

  - [x] 4.3 Write unit tests for ScoringEngine
    - Test score calculation with known inputs and expected outputs
    - Test go/no-go boundary thresholds (79% vs 80%, score with/without P0 blockers)
    - Test zero-total edge cases
    - _Requirements: 5.6, 6.2_

  - [x] 4.4 Implement JsonCollector (`scripts/audit/reporters/json-collector.ts`)
    - Implement `writeResults(phase: string, fileName: string, data: unknown): Promise<void>` — writes to `audit-results/{phase}/{fileName}.json`
    - Implement `readResults<T>(phase: string, fileName: string): Promise<T>` — reads and parses JSON
    - Implement `aggregateSummary(modules: ModuleAuditData[]): AuditSummary` — produces `summary.json`
    - Create `audit-results/` directory and subdirs if they don't exist
    - _Requirements: 6.1, 6.4_

  - [x] 4.5 Write property test for JsonCollector — Report Consistency
    - **Property 4: Report Consistency**
    - **Validates: Requirements 6.1, 6.2, 6.4**
    - Using `fast-check`, generate arbitrary arrays of `ModuleAuditData` objects
    - Assert: sum of all `module.elements.functional` across modules equals `summary.totalFunctional`
    - Assert: sum of `(functional + partial + stub + broken)` for each module equals that module's `elements.total`
    - Place in `scripts/audit/reporters/__tests__/json-collector.pbt.test.ts`

  - [x] 4.6 Implement MarkdownReporter (`scripts/audit/reporters/markdown-reporter.ts`)
    - Read all JSON from `audit-results/` using JsonCollector
    - Generate `docs/production-readiness-report.md` with:
      - Executive Summary section: overall score, modules ready count, top 10 critical blockers table
      - Per-module section with: interactive elements table, workflow test results table, API integration table, go-live score and GO/NO-GO verdict, P0/P1/P2 blocker list
    - Implement `generateReport(summary: AuditSummary): string` as a pure function returning markdown string
    - Write the string to `docs/production-readiness-report.md`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 4.7 Write unit tests for MarkdownReporter
    - Feed known `AuditSummary` fixture through `generateReport()` and assert markdown structure
    - Verify executive summary section contains overall score and top blockers
    - Verify per-module sections contain all required tables
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5. Implement Playwright E2E workflow tests
  - [x] 5.1 Create Playwright E2E test infrastructure
    - Create `tests/playwright/audit/` directory structure
    - Create `tests/playwright/audit/utils/result-collector.ts` implementing `writeWorkflowResults(workflowName: string, results: WorkflowStepResult[]): Promise<void>` writing to `audit-results/e2e/workflow-results.json`
    - Create `tests/playwright/audit/utils/workflow-helpers.ts` with shared helpers: `navigateTo()`, `fillAndSubmit()`, `assertToast()`, `assertApiCall()`, `recordStep()`
    - Create `tests/playwright/audit/fixtures/test-data.ts` with seeded entity references (IDs, names) for existing test data
    - Configure sequential execution (`workers: 1`) in playwright config for audit test suite
    - _Requirements: 3.1, 3.16_

  - [x] 5.2 Implement core and dashboard workflow tests (`tests/playwright/audit/workflows/core-dashboard.spec.ts`)
    - Step 1: Login with test credentials using existing auth setup
    - Step 2: Verify dashboard renders with real-time metrics (no loading spinners stuck)
    - Step 3: Navigate to each of the 20 modules and assert page loads without JS errors
    - Step 4: Verify notification delivery and display
    - Step 5: Set and persist user preferences/theme across session
    - Record pass/fail for each step via `recordStep()`
    - _Requirements: 3.15_

  - [x] 5.3 Implement retail POS workflow test (`tests/playwright/audit/workflows/retail-pos.spec.ts`)
    - Steps: open shift → add items to cart → apply discount → process payment → close shift → verify shift report reflects transactions
    - _Requirements: 3.1_

  - [x] 5.4 Implement inventory workflow test (`tests/playwright/audit/workflows/inventory.spec.ts`)
    - Steps: create product → set stock levels → transfer between locations → adjust stock → run stock opname/audit → verify stock counts update
    - _Requirements: 3.2_

  - [x] 5.5 Implement procurement workflow test (`tests/playwright/audit/workflows/procurement.spec.ts`)
    - Steps: create PO → approve PO → receive goods → update inventory → generate invoice → verify status transitions
    - _Requirements: 3.3_

  - [x] 5.6 Implement HR workflow test (`tests/playwright/audit/workflows/hr.spec.ts`)
    - Steps: create employee → assign department → submit leave request → approve leave → process payroll → verify persistence
    - _Requirements: 3.4_

  - [x] 5.7 Implement finance workflow test (`tests/playwright/audit/workflows/finance.spec.ts`)
    - Steps: create invoice → record payment → reconcile → generate report → verify ledger entries
    - _Requirements: 3.5_

  - [x] 5.8 Implement sales workflow test (`tests/playwright/audit/workflows/sales.spec.ts`)
    - Steps: create lead → convert to opportunity → create quotation → convert to order → fulfill → verify pipeline metrics
    - _Requirements: 3.6_

  - [x] 5.9 Implement F&B workflow test (`tests/playwright/audit/workflows/fnb.spec.ts`)
    - Steps: take order → send to kitchen → mark prepared → serve → close bill → verify status transitions
    - _Requirements: 3.7_

  - [x] 5.10 Implement marketing workflow test (`tests/playwright/audit/workflows/marketing.spec.ts`)
    - Steps: create campaign → define target audience → schedule → execute → verify metrics aggregate
    - _Requirements: 3.8_

  - [x] 5.11 Implement IT service management workflow test (`tests/playwright/audit/workflows/it-service.spec.ts`)
    - Steps: create ticket → assign technician → escalate on SLA breach → resolve → close → verify SLA report
    - _Requirements: 3.9_

  - [x] 5.12 Implement security workflow test (`tests/playwright/audit/workflows/security.spec.ts`)
    - Steps: configure access policies → assign roles → audit access logs → detect anomaly → create incident → resolve → verify RBAC and log persistence
    - _Requirements: 3.10_

  - [x] 5.13 Implement audit trail workflow test (`tests/playwright/audit/workflows/audit-trail.spec.ts`)
    - Steps: generate user actions → search/filter logs → export to CSV/PDF → verify retention policy behavior
    - _Requirements: 3.11_

  - [x] 5.14 Implement compliance workflow test (`tests/playwright/audit/workflows/compliance.spec.ts`)
    - Steps: create checklist → assign auditors → conduct audit → record findings with evidence → generate compliance report → track remediation
    - _Requirements: 3.12_

  - [x] 5.15 Implement settings workflow test (`tests/playwright/audit/workflows/settings.spec.ts`)
    - Steps: update system settings → reload and verify persistence → assert UI reflects changes immediately → verify audit trail entry generated
    - _Requirements: 3.13_

  - [x] 5.16 Implement license workflow test (`tests/playwright/audit/workflows/license.spec.ts`)
    - Steps: activate license key → verify feature gates → renew subscription → simulate expiry → verify graceful degradation and notifications
    - _Requirements: 3.14_

  - [x] 5.17 Write property test for workflow coverage — Workflow Coverage
    - **Property 2: Workflow Coverage**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15**
    - Using `fast-check`, generate arbitrary workflow names from the registered `WORKFLOW_NAMES` constant
    - After loading `workflow-results.json` fixture, assert every registered workflow name has at least one result entry
    - Place in `tests/playwright/audit/__tests__/workflow-coverage.pbt.test.ts`

- [x] 6. Checkpoint — E2E tests and report generator complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement audit orchestrator and wire everything together
  - [x] 7.1 Implement AuditOrchestrator (`scripts/audit/run-full-audit.ts`)
    - Parse CLI args: `--phase` (static | e2e | report | all) and `--modules` (comma-separated module names)
    - Phase 1 (static): run ElementScanner, ModalScanner, ApiMapper, PerfAnalyzer in parallel (`Promise.all`)
    - Phase 2 (classify): run StubDetector on Phase 1 ElementScanner output
    - Phase 3 (e2e): invoke `npx playwright test tests/playwright/audit/` as child process, await completion
    - Phase 4 (report): run JsonCollector aggregation then MarkdownReporter
    - Handle errors per phase: log warning on failure, continue to next phase, include error in report
    - Handle `--modules` filter by passing allowed module names to each analyzer
    - _Requirements: 1.6, 6.1_

  - [x] 7.2 Add npm scripts to `package.json`
    - Add `"audit": "tsx scripts/audit/run-full-audit.ts"`
    - Add `"audit:static": "tsx scripts/audit/run-full-audit.ts --phase static"`
    - Add `"audit:e2e": "npx playwright test tests/playwright/audit/"`
    - Add `"audit:report": "tsx scripts/audit/run-full-audit.ts --phase report"`
    - Add `"test:audit-props": "vitest run --testPathPattern=audit.*\\.pbt\\.test"`
    - _Requirements: 6.1_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all unit tests, property-based tests, and integration tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design document uses TypeScript throughout; all implementation tasks use TypeScript
- E2E workflow tests (tasks 5.2–5.16) require the live backend at `http://150.109.15.108:3010` and existing auth setup (`tests/playwright/setup/auth.setup.ts`)
- Property-based tests use `fast-check` (already in project) and run via `vitest run`
- `audit-results/` is gitignored; `docs/production-readiness-report.md` is safe to commit
- Static analyzers handle missing directories gracefully (module reported as "not implemented", 0% score)
- The orchestrator runs static analysis phases in parallel (Phase 1) but E2E workflows run sequentially (`workers: 1`) to avoid data conflicts

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1"] },
    { "id": 3, "tasks": ["2.4", "2.5", "4.2", "4.3"] },
    { "id": 4, "tasks": ["2.6", "2.7", "2.8", "2.10", "4.4", "5.1"] },
    { "id": 5, "tasks": ["2.9", "4.5", "4.6", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "5.11", "5.12", "5.13", "5.14", "5.15", "5.16"] },
    { "id": 6, "tasks": ["4.7", "5.17"] },
    { "id": 7, "tasks": ["7.1"] },
    { "id": 8, "tasks": ["7.2"] }
  ]
}
```
