# Design Document

## Overview

This design describes the technical architecture for a comprehensive production-readiness audit system for the Zenvix Business Flow Suite v2. The system uses a three-layer approach: (1) static analysis scripts that scan source code for interactive elements and API usage patterns, (2) Playwright-based E2E tests that exercise critical business workflows against the live backend, and (3) a report aggregation engine that consolidates findings into a single actionable markdown report.

The audit tooling integrates into the existing project infrastructure (TypeScript, Vitest for unit/property tests, Playwright for E2E, NestJS backend, React/Vite frontend) without introducing new frameworks.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Audit Orchestrator                             │
│                 scripts/audit/run-full-audit.ts                   │
├────────────────┬──────────────────┬─────────────────────────────┤
│  Static Analysis│  E2E Workflow    │  Report Generator            │
│  Layer          │  Layer           │  Layer                       │
├────────────────┼──────────────────┼─────────────────────────────┤
│ • Element       │ • Playwright     │ • JSON → Markdown            │
│   Scanner       │   Test Suites    │ • Scoring Engine             │
│ • API Mapper    │ • Workflow        │ • Priority Classifier        │
│ • Stub Detector │   Runners        │ • Executive Summary          │
│ • Modal Finder  │ • Result          │   Generator                  │
│                 │   Collectors      │                              │
└────────────────┴──────────────────┴─────────────────────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
   audit-results/      audit-results/       docs/production-
   static/*.json       e2e/*.json           readiness-report.md
```

### Directory Structure

```
scripts/audit/
├── run-full-audit.ts          # Orchestrator: runs all phases sequentially
├── analyzers/
│   ├── element-scanner.ts     # Scans TSX/TS for interactive elements
│   ├── stub-detector.ts       # Classifies handlers as stub/partial/functional
│   ├── modal-scanner.ts       # Finds Dialog/Sheet/Drawer/Modal usage
│   ├── api-mapper.ts          # Maps frontend API calls to backend routes
│   └── perf-analyzer.ts       # Identifies N+1, missing pagination, etc.
├── types/
│   └── audit-types.ts         # Shared TypeScript interfaces
├── utils/
│   ├── file-walker.ts         # Recursive file glob with filtering
│   ├── ast-parser.ts          # TypeScript AST parsing utilities
│   └── route-registry.ts     # Builds backend route map from NestJS decorators
└── reporters/
    ├── json-collector.ts      # Writes intermediate JSON results
    ├── markdown-reporter.ts   # Generates final markdown report
    └── scoring-engine.ts      # Calculates go-live readiness scores

tests/playwright/audit/
├── workflows/
│   ├── retail-pos.spec.ts     # Retail POS end-to-end
│   ├── inventory.spec.ts      # Inventory lifecycle
│   ├── procurement.spec.ts    # Procurement chain
│   ├── hr.spec.ts             # HR lifecycle
│   ├── finance.spec.ts        # Finance lifecycle
│   ├── sales.spec.ts          # Sales pipeline
│   ├── fnb.spec.ts            # F&B order lifecycle
│   ├── marketing.spec.ts      # Marketing campaign lifecycle
│   ├── it-service.spec.ts     # IT ticketing lifecycle
│   ├── security.spec.ts       # Security & RBAC lifecycle
│   ├── audit-trail.spec.ts    # Logging & audit trail
│   ├── compliance.spec.ts     # Compliance audit lifecycle
│   ├── settings.spec.ts       # Settings persistence
│   ├── license.spec.ts        # License & subscription lifecycle
│   └── core-dashboard.spec.ts # Core navigation & dashboard
├── utils/
│   ├── workflow-helpers.ts    # Shared workflow step utilities
│   └── result-collector.ts   # Captures pass/fail per step
└── fixtures/
    └── test-data.ts           # Seeded test data references

audit-results/                 # Generated output (gitignored)
├── static/
│   ├── elements.json          # All interactive elements found
│   ├── modals.json            # All modal instances found
│   ├── api-map.json           # Frontend→Backend API mapping
│   ├── stubs.json             # Classified stubs
│   └── perf-issues.json       # Performance concerns
├── e2e/
│   └── workflow-results.json  # Pass/fail per workflow step
└── final/
    └── summary.json           # Aggregated scoring data

docs/
└── production-readiness-report.md  # Final human-readable report
```

## Component Design

### 1. Element Scanner (`scripts/audit/analyzers/element-scanner.ts`)

**Purpose:** Recursively scan all `.tsx`/`.ts` files under `src/pages/` and `src/components/` to find every interactive element.

**Algorithm:**
1. Walk file tree using glob pattern `src/{pages,components}/**/*.{ts,tsx}`
2. For each file, parse with TypeScript Compiler API (`ts.createSourceFile`)
3. Visit AST nodes to find:
   - JSX elements with `onClick`, `onSubmit`, `onPress`, `onChange` (on interactive elements)
   - `<Button>`, `<Link>`, `<a>` elements
   - Components wrapped in `forwardRef` that accept click handlers
4. Extract metadata: file path, line number, handler expression text, parent component name
5. Output: array of `InteractiveElement` objects

**Key Interface:**
```typescript
interface InteractiveElement {
  id: string;                    // unique hash of file:line:handler
  filePath: string;              // relative path from project root
  lineNumber: number;
  elementType: 'button' | 'link' | 'form-submit' | 'clickable';
  handlerName: string;           // e.g., "handleDelete", "() => toast(...)"
  handlerBody: string;           // full handler source text
  parentComponent: string;       // enclosing component name
  layer: 'auth' | 'core' | 'retail' | 'fnb' | 'industry' | 'portal';
  pagePath: string;              // page route if determinable
}
```

### 2. Stub Detector (`scripts/audit/analyzers/stub-detector.ts`)

**Purpose:** Classify each interactive element found by the scanner.

**Classification Rules (in order of priority):**

| Pattern Detected | Classification |
|-----------------|----------------|
| Handler body is empty `() => {}` | stub |
| Handler only calls `toast()`, `console.log()`, `alert()` | stub |
| Handler body contains only `// TODO`, `// FIXME` comments | stub |
| Handler calls API but doesn't handle response (no `.then`, no `onSuccess`, no state update) | partially_working |
| Handler opens modal whose submit is a stub | partially_working |
| Handler calls API endpoint not in backend route registry | broken |
| Handler calls API that returns 4xx/5xx in known route map | broken |
| Handler calls working API AND updates UI state | fully_functional |

**Static vs. Dynamic Classification:**
- Static analysis covers: stubs, TODO comments, empty handlers (deterministic)
- Dynamic verification covers: API response codes, actual runtime behavior (requires E2E)
- The stub detector marks elements it cannot classify statically as `needs_dynamic_verification`

### 3. Modal Scanner (`scripts/audit/analyzers/modal-scanner.ts`)

**Purpose:** Find all modal/dialog instances and classify their completeness.

**Detection Patterns:**
- Import statements for: `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Modal`, `Popover` from `@radix-ui/*` or `src/components/ui/*`
- Usage of `<DialogContent>`, `<SheetContent>`, `<DrawerContent>` components
- Trigger elements that control modal open state (`DialogTrigger`, state-controlled open props)

**Output Interface:**
```typescript
interface ModalInstance {
  id: string;
  filePath: string;
  lineNumber: number;
  modalType: 'Dialog' | 'AlertDialog' | 'Sheet' | 'Drawer' | 'Popover';
  triggerElement: string;        // the element that opens this modal
  hasForm: boolean;              // contains form fields
  hasSubmitHandler: boolean;     // submit button has a handler
  submitClassification: Classification;  // stub/partial/functional
  hasValidation: boolean;        // uses zod/react-hook-form validation
  hasCancelHandler: boolean;     // close/cancel properly handled
  parentPage: string;
  layer: string;
}
```

### 4. API Mapper (`scripts/audit/analyzers/api-mapper.ts`)

**Purpose:** Cross-reference frontend API calls with backend route definitions.

**Frontend Scan Strategy:**
1. Find all `useQuery`, `useMutation` hooks from `@tanstack/react-query`
2. Find all `fetch()`, `axios.*()` calls
3. Find custom API utility usage (detect patterns in `src/lib/api*` or `src/core/api*`)
4. Extract: HTTP method, URL/path pattern, file location

**Backend Route Registry Builder:**
1. Scan `backend/src/**/*.controller.ts` files
2. Parse NestJS decorators: `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`
3. Combine controller-level `@Controller('path')` with method-level path
4. Build map: `{ method: string, path: string, controllerFile: string }`

**Matching Algorithm:**
1. Normalize all paths (remove trailing slashes, expand param patterns like `:id` to `*`)
2. For each frontend call, find matching backend route by method + path pattern
3. Classify: `connected` (exact match), `disconnected` (no match), `mock_data` (no API call, uses static data)

**Output Interface:**
```typescript
interface ApiMapping {
  frontendFile: string;
  frontendLine: number;
  httpMethod: string;
  endpoint: string;
  backendMatch: string | null;    // matched controller file, or null
  classification: 'connected' | 'disconnected' | 'mock_data';
  todoComments: string[];         // nearby TODO/FIXME comments
  businessCriticality: 'critical' | 'high' | 'medium' | 'low';
}
```

### 5. Performance Analyzer (`scripts/audit/analyzers/perf-analyzer.ts`)

**Purpose:** Static analysis of backend queries and frontend state patterns for production load concerns.

**Backend Checks:**
- Scan Prisma usage for `findMany()` without `take`/`skip` (missing pagination)
- Detect nested `include` > 2 levels deep (potential N+1)
- Find `@Query()` handlers that don't accept pagination params
- Check for missing `@UseInterceptors(CacheInterceptor)` on read-heavy endpoints

**Frontend Checks:**
- Find `useQuery` hooks without `keepPreviousData` or pagination params
- Detect components rendering large lists without virtualization
- Find missing `Suspense`/error boundary wrappers
- Check socket.io-client usage for reconnection config

**Output Interface:**
```typescript
interface PerfIssue {
  type: 'n_plus_1' | 'missing_pagination' | 'no_error_boundary' | 'no_cache' | 'socket_config';
  filePath: string;
  lineNumber: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}
```

### 6. E2E Workflow Tests (`tests/playwright/audit/workflows/*.spec.ts`)

**Purpose:** Execute critical business workflows against the live backend to verify end-to-end functionality.

**Test Structure Pattern:**
```typescript
// Each workflow file follows this pattern:
test.describe('Module Workflow', () => {
  const results: WorkflowStepResult[] = [];

  test.afterAll(async () => {
    // Write results to audit-results/e2e/
    await writeWorkflowResults('module-name', results);
  });

  test('Step 1: Create entity', async ({ page }) => {
    // Navigate, fill form, submit
    // Assert data persisted
    // Record pass/fail
  });

  test('Step 2: Transition state', async ({ page }) => {
    // Depends on Step 1 entity
    // Verify state change
  });
  // ... sequential steps
});
```

**Workflow Step Result Interface:**
```typescript
interface WorkflowStepResult {
  workflow: string;           // e.g., 'retail-pos'
  step: number;
  description: string;       // human-readable step name
  status: 'pass' | 'fail' | 'skip' | 'stub_detected';
  errorMessage?: string;     // if failed
  failurePoint?: string;     // exact UI element or API that failed
  remediationNote?: string;  // what needs fixing
  duration: number;          // ms
}
```

**E2E Environment:**
- Runs against the configured Playwright base URL (`http://150.109.15.108:3010`)
- Uses existing auth setup (`tests/playwright/setup/auth.setup.ts`)
- Sequential execution (workers: 1) to avoid data conflicts
- Test data seeded via existing Prisma seed scripts

### 7. Report Generator (`scripts/audit/reporters/markdown-reporter.ts`)

**Purpose:** Aggregate all JSON results into a single `docs/production-readiness-report.md`.

**Report Structure:**
```markdown
# Production Readiness Report — Zenvix Business Flow Suite v2

## Executive Summary
- Overall readiness: X%
- Modules ready: N/M
- Critical blockers: N
- Top 10 blockers (table with priority, module, description, effort estimate)

## Module Reports
### [Module Name]
#### Interactive Elements
| Classification | Count |
|...|...|

#### Workflow Test Results
| Step | Status | Notes |
|...|...|...|

#### API Integration
| Status | Count |
|...|...|

#### Go-Live Readiness: X% (GO / NO-GO)
#### Blockers
- P0: ...
- P1: ...
- P2: ...
```

**Scoring Engine Logic:**
```typescript
function calculateReadinessScore(module: ModuleAuditData): number {
  const weights = {
    functionalElements: 0.3,    // % of elements classified as functional
    workflowPass: 0.35,         // % of workflow steps passing
    apiConnected: 0.2,          // % of API calls connected
    noCriticalPerf: 0.15,       // absence of critical perf issues
  };

  return (
    weights.functionalElements * (module.functional / module.totalElements) +
    weights.workflowPass * (module.workflowsPassed / module.workflowsTotal) +
    weights.apiConnected * (module.apiConnected / module.apiTotal) +
    weights.noCriticalPerf * (module.criticalPerfIssues === 0 ? 1 : 0)
  ) * 100;
}
```

**Go/No-Go Threshold:**
- Score ≥ 80% AND zero P0 blockers → GO
- Score ≥ 60% OR has P0 blockers → NO-GO (with remediation list)
- Score < 60% → NO-GO (major work needed)

### 8. Audit Orchestrator (`scripts/audit/run-full-audit.ts`)

**Purpose:** Single entry point that runs all audit phases in sequence and produces the final report.

**Execution Phases:**
```
Phase 1: Static Analysis (parallel)
  ├── Element Scanner
  ├── Modal Scanner
  ├── API Mapper
  └── Performance Analyzer

Phase 2: Classification
  └── Stub Detector (processes Phase 1 output)

Phase 3: E2E Workflows (sequential)
  └── Playwright test suite execution

Phase 4: Report Generation
  ├── Aggregate all JSON results
  ├── Calculate scores
  └── Generate markdown report
```

**CLI Interface:**
```bash
# Run full audit
npx tsx scripts/audit/run-full-audit.ts

# Run only static analysis
npx tsx scripts/audit/run-full-audit.ts --phase static

# Run only E2E workflows
npx tsx scripts/audit/run-full-audit.ts --phase e2e

# Run only report generation (from existing JSON)
npx tsx scripts/audit/run-full-audit.ts --phase report

# Target specific modules
npx tsx scripts/audit/run-full-audit.ts --modules retail,finance,hr
```

## Data Models

### Audit Result Schema (stored in `audit-results/final/summary.json`)

```typescript
interface AuditSummary {
  timestamp: string;
  version: string;
  modules: Record<string, ModuleAuditData>;
  overallScore: number;
  goLiveReady: boolean;
  blockers: Blocker[];
}

interface ModuleAuditData {
  name: string;
  layer: string;
  elements: {
    total: number;
    functional: number;
    partial: number;
    stub: number;
    broken: number;
  };
  modals: {
    total: number;
    functional: number;
    stub: number;
  };
  api: {
    total: number;
    connected: number;
    disconnected: number;
    mockData: number;
  };
  workflows: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  perfIssues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  readinessScore: number;
  goNoGo: 'go' | 'no-go';
}

interface Blocker {
  id: string;
  priority: 'P0' | 'P1' | 'P2';
  module: string;
  description: string;
  type: 'stub' | 'broken' | 'disconnected_api' | 'perf' | 'workflow_fail';
  filePath: string;
  estimatedEffort: 'hours' | 'days' | 'weeks';
  remediation: string;
}
```

### Module Registry (maps page paths to modules)

```typescript
const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  auth:        { layer: 'auth',     pagePaths: ['src/pages/auth/'] },
  dashboard:   { layer: 'core',     pagePaths: ['src/pages/core/Dashboard.tsx'] },
  finance:     { layer: 'core',     pagePaths: ['src/pages/core/finance/', 'src/pages/core/Finance.tsx'] },
  hr:          { layer: 'core',     pagePaths: ['src/pages/core/HR/'] },
  inventory:   { layer: 'core',     pagePaths: ['src/pages/core/inventory/', 'src/pages/core/InventoryModule.tsx'] },
  it:          { layer: 'core',     pagePaths: ['src/pages/core/it/'] },
  license:     { layer: 'core',     pagePaths: ['src/pages/core/license/'] },
  logistics:   { layer: 'core',     pagePaths: ['src/pages/core/logistics/'] },
  logs:        { layer: 'core',     pagePaths: ['src/pages/core/logs/'] },
  marketing:   { layer: 'core',     pagePaths: ['src/pages/core/marketing/'] },
  payment:     { layer: 'core',     pagePaths: ['src/pages/core/payment/'] },
  procurement: { layer: 'core',     pagePaths: ['src/pages/core/procurement/', 'src/pages/core/ProcurementEntry.tsx'] },
  retail:      { layer: 'retail',   pagePaths: ['src/pages/core/retail/', 'src/pages/retail/'] },
  sales:       { layer: 'core',     pagePaths: ['src/pages/core/sales/'] },
  security:    { layer: 'core',     pagePaths: ['src/pages/core/Security.tsx'] },
  settings:    { layer: 'core',     pagePaths: ['src/pages/core/settings/', 'src/pages/core/Settings.tsx'] },
  warehouse:   { layer: 'core',     pagePaths: ['src/pages/core/warehouse/'] },
  compliance:  { layer: 'core',     pagePaths: ['src/pages/core/compliance/'] },
  audit:       { layer: 'core',     pagePaths: ['src/pages/core/audit/'] },
  comms:       { layer: 'core',     pagePaths: ['src/pages/core/comms/'] },
  tools:       { layer: 'core',     pagePaths: ['src/pages/core/tools/'] },
  fnb:         { layer: 'fnb',      pagePaths: ['src/pages/fnb/'] },
  industry:    { layer: 'industry', pagePaths: ['src/pages/industry/'] },
  portal:      { layer: 'portal',   pagePaths: ['src/pages/portal/'] },
};
```

## Sequence Diagram — Full Audit Run

```
Developer          Orchestrator       Static Analyzers    Playwright         Reporter
    │                   │                    │                │                  │
    │── run-full-audit ─▶                   │                │                  │
    │                   │── scan elements ──▶│                │                  │
    │                   │── scan modals ────▶│                │                  │
    │                   │── map APIs ───────▶│                │                  │
    │                   │── analyze perf ───▶│                │                  │
    │                   │                    │                │                  │
    │                   │◀── elements.json ──│                │                  │
    │                   │◀── modals.json ────│                │                  │
    │                   │◀── api-map.json ───│                │                  │
    │                   │◀── perf.json ──────│                │                  │
    │                   │                    │                │                  │
    │                   │── classify stubs ─▶│                │                  │
    │                   │◀── stubs.json ─────│                │                  │
    │                   │                    │                │                  │
    │                   │── run workflows ───────────────────▶│                  │
    │                   │                    │                │── test retail ──▶│
    │                   │                    │                │── test finance ─▶│
    │                   │                    │                │── ... ──────────▶│
    │                   │◀── workflow-results.json ───────────│                  │
    │                   │                    │                │                  │
    │                   │── generate report ─────────────────────────────────────▶
    │                   │◀── report.md ──────────────────────────────────────────│
    │                   │                    │                │                  │
    │◀── done ──────────│                   │                │                  │
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AST Parsing | TypeScript Compiler API (`typescript` package) | Already a devDependency; full JSX/TSX support; no new dependency |
| E2E Framework | Playwright | Already configured in project with auth setup and existing test patterns |
| Test Runner (unit/property) | Vitest + fast-check | Already in project; property tests validate audit correctness properties |
| Report Format | Markdown | Readable in GitHub, can be committed, no extra tooling needed |
| Intermediate Storage | JSON files in `audit-results/` | Simple, inspectable, allows re-running individual phases |
| CLI Execution | `tsx` (TypeScript execution) | Already a devDependency; runs `.ts` scripts directly |
| File Globbing | `node:fs` + glob patterns | Zero new dependencies; Node.js built-in `fs.readdir` recursive |

## Correctness Property Tests

Property-based tests using `fast-check` validate the audit system's correctness:

### Property 1: Classification Completeness
```typescript
// Every element output by the scanner receives exactly one classification
test.prop([fc.array(elementArbitrary)])(
  'all scanned elements get exactly one classification',
  (elements) => {
    const classified = stubDetector.classify(elements);
    expect(classified.length).toBe(elements.length);
    classified.forEach(el => {
      expect(['fully_functional', 'partially_working', 'stub', 'broken'])
        .toContain(el.classification);
    });
  }
);
```

### Property 2: Workflow Coverage
```typescript
// Every workflow defined in the registry produces a result entry
test.prop([fc.constantFrom(...WORKFLOW_NAMES)])(
  'every registered workflow produces results',
  (workflowName) => {
    const results = loadWorkflowResults();
    expect(results.some(r => r.workflow === workflowName)).toBe(true);
  }
);
```

### Property 3: API Mapping Accuracy
```typescript
// If a frontend call and backend route share the same method+path, classification is 'connected'
test.prop([apiCallArbitrary, routeArbitrary])(
  'matching method+path always classified as connected',
  (call, route) => {
    if (call.method === route.method && pathMatches(call.path, route.path)) {
      const result = apiMapper.classify(call, [route]);
      expect(result.classification).toBe('connected');
    }
  }
);
```

### Property 4: Report Consistency
```typescript
// Sum of per-module element counts equals total count in summary
test.prop([fc.array(moduleDataArbitrary, { minLength: 1 })])(
  'module counts sum to total',
  (modules) => {
    const report = generateReport(modules);
    const sumFunctional = modules.reduce((s, m) => s + m.elements.functional, 0);
    expect(report.totalFunctional).toBe(sumFunctional);
  }
);
```

## npm Scripts Integration

```json
{
  "scripts": {
    "audit": "tsx scripts/audit/run-full-audit.ts",
    "audit:static": "tsx scripts/audit/run-full-audit.ts --phase static",
    "audit:e2e": "npx playwright test tests/playwright/audit/",
    "audit:report": "tsx scripts/audit/run-full-audit.ts --phase report",
    "test:audit-props": "vitest run --testPathPattern=audit.*\\.pbt\\.test"
  }
}
```

## Components and Interfaces

### Component: ElementScanner
- **Path:** `scripts/audit/analyzers/element-scanner.ts`
- **Interface:** `scanElements(rootDir: string): Promise<InteractiveElement[]>`
- **Dependencies:** TypeScript Compiler API, FileWalker utility
- **Consumes:** `.tsx`/`.ts` source files under `src/pages/` and `src/components/`
- **Produces:** `audit-results/static/elements.json`

### Component: StubDetector
- **Path:** `scripts/audit/analyzers/stub-detector.ts`
- **Interface:** `classify(elements: InteractiveElement[]): ClassifiedElement[]`
- **Dependencies:** ElementScanner output, RouteRegistry
- **Consumes:** `elements.json`, backend route map
- **Produces:** `audit-results/static/stubs.json`

### Component: ModalScanner
- **Path:** `scripts/audit/analyzers/modal-scanner.ts`
- **Interface:** `scanModals(rootDir: string): Promise<ModalInstance[]>`
- **Dependencies:** TypeScript Compiler API, FileWalker utility
- **Consumes:** `.tsx`/`.ts` source files
- **Produces:** `audit-results/static/modals.json`

### Component: ApiMapper
- **Path:** `scripts/audit/analyzers/api-mapper.ts`
- **Interface:** `mapApis(frontendDir: string, backendDir: string): Promise<ApiMapping[]>`
- **Dependencies:** TypeScript Compiler API, RouteRegistry
- **Consumes:** Frontend source files, NestJS controller files
- **Produces:** `audit-results/static/api-map.json`

### Component: PerfAnalyzer
- **Path:** `scripts/audit/analyzers/perf-analyzer.ts`
- **Interface:** `analyzePerformance(projectRoot: string): Promise<PerfIssue[]>`
- **Dependencies:** TypeScript Compiler API, FileWalker
- **Consumes:** Backend Prisma usage files, frontend state files
- **Produces:** `audit-results/static/perf-issues.json`

### Component: RouteRegistry
- **Path:** `scripts/audit/utils/route-registry.ts`
- **Interface:** `buildRouteRegistry(backendDir: string): Promise<BackendRoute[]>`
- **Dependencies:** TypeScript Compiler API
- **Consumes:** `backend/src/**/*.controller.ts`
- **Produces:** In-memory route map used by ApiMapper and StubDetector

### Component: MarkdownReporter
- **Path:** `scripts/audit/reporters/markdown-reporter.ts`
- **Interface:** `generateReport(summary: AuditSummary): string`
- **Dependencies:** ScoringEngine, JSON result files
- **Consumes:** All `audit-results/**/*.json` files
- **Produces:** `docs/production-readiness-report.md`

### Component: ScoringEngine
- **Path:** `scripts/audit/reporters/scoring-engine.ts`
- **Interface:** `calculateReadinessScore(module: ModuleAuditData): number`
- **Dependencies:** None (pure function)
- **Consumes:** ModuleAuditData objects
- **Produces:** Readiness score (0-100) and go/no-go classification

### Component: AuditOrchestrator
- **Path:** `scripts/audit/run-full-audit.ts`
- **Interface:** CLI entry point with `--phase` and `--modules` flags
- **Dependencies:** All analyzers, Playwright runner, MarkdownReporter
- **Consumes:** CLI arguments
- **Produces:** Orchestrates all phases sequentially and produces final report

### Component: WorkflowE2ETests
- **Path:** `tests/playwright/audit/workflows/*.spec.ts`
- **Interface:** Playwright test suites executed via `npx playwright test`
- **Dependencies:** Playwright, auth setup, test data fixtures
- **Consumes:** Live application at configured base URL
- **Produces:** `audit-results/e2e/workflow-results.json`

## Testing Strategy

### Unit Tests (Vitest)
- **StubDetector classification logic:** Test each classification rule in isolation with known handler body patterns.
- **ScoringEngine calculations:** Test score calculation with edge cases (zero elements, all stubs, mixed modules).
- **RouteRegistry parsing:** Test NestJS decorator parsing against sample controller files.
- **ApiMapper matching:** Test path normalization and matching algorithm with param patterns.

### Property-Based Tests (Vitest + fast-check)
- **Classification Completeness:** Every generated element receives exactly one classification.
- **API Mapping Accuracy:** Matching method+path always produces 'connected' classification.
- **Report Consistency:** Sum of per-module counts always equals totals in summary.
- **Score Bounds:** Readiness scores always fall within 0-100 range.

### Integration Tests (Vitest)
- **Full static analysis pipeline:** Run ElementScanner → StubDetector on a known test fixture directory and verify output structure.
- **Report generation pipeline:** Feed known JSON fixtures through MarkdownReporter and verify markdown structure.

### E2E Tests (Playwright)
- **Workflow test suites:** Each of the 15 workflow specs exercises the application end-to-end against the live backend.
- **Result collection:** Verify that workflow results are properly written to JSON for report aggregation.

## Correctness Properties

### Property 1: Classification Completeness

**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

For any set of `InteractiveElement` objects passed to `StubDetector.classify()`, the output array has the same length and every element has exactly one of the four valid classifications (`fully_functional`, `partially_working`, `stub`, `broken`).

### Property 2: Workflow Coverage

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15**

For every workflow name registered in the system, the `workflow-results.json` contains at least one entry with that workflow name after a full E2E run.

### Property 3: API Mapping Accuracy

**Validates: Requirements 4.1, 4.2**

For any frontend API call and backend route that share the same HTTP method and matching path pattern, `ApiMapper.classify()` returns `connected`. For any call with no matching route, it returns `disconnected`.

### Property 4: Report Consistency

**Validates: Requirements 6.1, 6.2, 6.4**

The sum of all per-module element counts (functional + partial + stub + broken) for each module equals the module's `total` field. The overall readiness score is the weighted average of module scores.

### Property 5: Score Boundedness

**Validates: Requirements 5.6, 6.2**

`calculateReadinessScore()` always returns a value in the range [0, 100] for any valid `ModuleAuditData` input, including edge cases with zero totals.

## Error Handling

- **Static analysis errors** (unparseable files): Log warning, skip file, include in report as "unanalyzable"
- **E2E test failures**: Capture screenshot + error message, mark step as `fail`, continue to next step
- **Backend unreachable during E2E**: Mark all steps as `skip` with reason "backend unavailable"
- **Missing directories**: If `src/pages/core/marketing/` doesn't exist yet, report module as "not implemented" with 0% score

## Security Considerations

- Audit scripts run read-only against source code (no file mutations)
- E2E tests use a dedicated test account (existing auth.setup.ts pattern)
- No secrets or credentials are written to report files
- `audit-results/` directory is added to `.gitignore` (intermediate JSON may contain file paths)
- Final report at `docs/production-readiness-report.md` is safe to commit (no sensitive data)
