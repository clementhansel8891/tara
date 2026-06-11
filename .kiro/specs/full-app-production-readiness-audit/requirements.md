# Requirements Document

## Introduction

The Zenvix Business Flow Suite v2 is a multi-module enterprise application covering retail, finance, HR, inventory, logistics, marketing, procurement, sales, warehouse, compliance, audit, IT, security, F&B, clinic, and farming verticals. Before going live with real users under heavy load, the application requires a systematic production-readiness audit that identifies all stubbed interactions, broken workflows, disconnected API integrations, and non-functional UI elements across the entire frontend and backend.

This audit will produce a complete inventory of every interactive element (buttons, modals, forms, navigation flows) across all pages, classify each as fully functional, partially working, stubbed, or broken, and verify that critical end-to-end business workflows complete successfully against the real backend.

## Glossary

- **Stub**: A UI element or handler that shows a toast/alert like "Coming soon" or does nothing when clicked — not connected to real logic.
- **Broken**: An element that attempts an action but fails (throws error, API 404/500, infinite loading, crashes).
- **Partially Working**: An element that executes some logic but is incomplete (e.g., form submits but response isn't handled, modal opens but can't save).
- **Fully Functional**: An element that completes its intended workflow end-to-end with correct data persistence and user feedback.
- **Layer**: A functional grouping of pages (core, retail, fnb, industry, portal, auth).
- **Workflow**: A multi-step user journey that spans multiple actions/pages (e.g., Create PO → Approve → Receive Goods → Update Inventory).

---

## Requirements

### Requirement 1: Button & Interactive Element Audit

**User Story:** As a QA engineer, I want a comprehensive inventory of every button, link, and clickable action across all application pages, so that I can identify which elements are stubs, broken, or fully functional.

#### Acceptance Criteria

1. WHEN the audit script scans all `.tsx`/`.ts` files under `src/pages/` and `src/components/` THEN the system SHALL produce a report listing every `onClick`, `onSubmit`, `onPress`, button component, and `<Link>` element with its file path, line number, and handler function name.
2. WHEN a button handler contains only `toast()`, `console.log()`, `alert()`, an empty function body, or a comment like `// TODO` THEN the system SHALL classify that element as "stub".
3. WHEN a button handler calls an API endpoint that returns 404, 500, or times out THEN the system SHALL classify that element as "broken".
4. WHEN a button handler calls an API endpoint that returns a success response AND the UI updates accordingly (toast success, data refresh, modal close, navigation) THEN the system SHALL classify that element as "fully functional".
5. WHEN a button handler performs a partial action (e.g., opens a modal but modal submit is stubbed, or calls API but ignores response) THEN the system SHALL classify that element as "partially working".
6. WHEN the audit is complete THEN the system SHALL produce a summary report with counts per page and per classification (stub / broken / partially working / fully functional) for all layers: auth, core, retail, fnb, industry, portal.

### Requirement 2: Modal & Dialog Audit

**User Story:** As a QA engineer, I want to verify that every modal and dialog in the application opens correctly, displays appropriate content, validates user input, submits data to the backend, and closes properly, so that I can confirm modal-based workflows are production-ready.

#### Acceptance Criteria

1. WHEN the audit scans all files for `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Modal`, `Popover` component usage THEN the system SHALL produce a list of every modal instance with its trigger element, file path, and purpose.
2. WHEN a modal is triggered THEN the system SHALL verify it opens without JavaScript errors and renders its expected form fields or content.
3. WHEN a modal form is submitted with valid data THEN the system SHALL verify the submission calls the correct API endpoint and handles the response (success toast, data refresh, modal close).
4. WHEN a modal form is submitted with invalid data THEN the system SHALL verify that client-side validation fires and prevents submission (Zod schema validation via react-hook-form).
5. WHEN a modal's submit handler is a stub (toast-only, console.log, empty function) THEN the system SHALL classify that modal as "stub" and flag it in the report.
6. WHEN a modal's cancel/close button is clicked THEN the system SHALL verify the modal closes and no side effects occur (no stale data, no orphaned state).

### Requirement 3: End-to-End Workflow Audit

**User Story:** As a product owner, I want to verify that all critical business workflows complete end-to-end against the real backend (Prisma + PostgreSQL), so that I can confirm the app handles real user operations correctly before go-live.

#### Acceptance Criteria

1. WHEN the audit tests the **Retail POS workflow** (open shift → add items to cart → apply discount → process payment → close shift → view shift report) THEN the system SHALL verify each step persists data correctly and the shift report reflects the transactions.
2. WHEN the audit tests the **Inventory workflow** (create product → set stock levels → transfer between locations → adjust stock → run stock opname/audit) THEN the system SHALL verify stock counts update correctly across locations.
3. WHEN the audit tests the **Procurement workflow** (create purchase order → approve PO → receive goods → update inventory → generate invoice) THEN the system SHALL verify the full chain persists and each status transition is correct.
4. WHEN the audit tests the **HR workflow** (create employee → assign department → submit leave request → approve leave → process payroll) THEN the system SHALL verify employee records and payroll calculations persist correctly.
5. WHEN the audit tests the **Finance workflow** (create invoice → record payment → reconcile → generate report) THEN the system SHALL verify ledger entries are correct and reports aggregate accurately.
6. WHEN the audit tests the **Sales workflow** (create lead → convert to opportunity → create quotation → convert to order → fulfill) THEN the system SHALL verify each stage transition persists and pipeline metrics update.
7. WHEN the audit tests the **F&B workflow** (take order → send to kitchen → mark prepared → serve → close bill) THEN the system SHALL verify order status transitions and kitchen display updates.
8. WHEN the audit tests the **Marketing workflow** (create campaign → define target audience → schedule campaign → execute → track open/click/conversion metrics) THEN the system SHALL verify campaign data persists, scheduling triggers correctly, and performance metrics aggregate accurately.
9. WHEN the audit tests the **IT Service Management workflow** (create support ticket → assign to technician → escalate if SLA breached → resolve → close ticket → generate SLA compliance report) THEN the system SHALL verify ticket state transitions, SLA timer calculations, and report generation are correct.
10. WHEN the audit tests the **Security workflow** (configure access policies → assign roles to users → audit access logs → detect anomalies → create incident → respond/resolve incident) THEN the system SHALL verify RBAC enforcement, access log generation, anomaly detection triggers, and incident lifecycle management persist correctly.
11. WHEN the audit tests the **Logging & Audit Trail workflow** (user actions generate audit log entries → logs are searchable/filterable → export audit trail to CSV/PDF → retention policies auto-archive/delete old logs) THEN the system SHALL verify log completeness, search accuracy, export integrity, and retention policy enforcement.
12. WHEN the audit tests the **Compliance & Audit workflow** (create audit checklist → assign auditors → conduct audit with findings → record findings with evidence → generate compliance report → track remediation) THEN the system SHALL verify checklist completion tracking, findings persistence, evidence attachments, and report accuracy.
13. WHEN the audit tests the **Settings workflow** (update system settings → changes persist across sessions → UI reflects updated settings immediately → setting changes generate audit trail entries) THEN the system SHALL verify settings persistence, real-time UI reflection, and audit trail generation for every change.
14. WHEN the audit tests the **License & Subscription workflow** (activate license key → verify feature gates enforce limits → renew subscription → handle expiry gracefully → send expiry notifications) THEN the system SHALL verify license activation, feature gating enforcement, renewal processing, graceful degradation on expiry, and notification delivery.
15. WHEN the audit tests the **Core/Dashboard workflow** (login → view dashboard with real-time metrics → navigate between all modules → receive and display notifications → persist user preferences/theme) THEN the system SHALL verify dashboard data accuracy, module navigation completeness, notification delivery, and preference persistence across sessions.
16. WHEN any workflow step fails (API error, missing endpoint, stubbed handler) THEN the system SHALL document the exact failure point, error message, and what is needed to fix it.

### Requirement 4: API Integration Audit

**User Story:** As a developer, I want to know which frontend API calls connect to real backend endpoints and which call non-existent or stubbed endpoints, so that I can prioritize backend work needed for go-live.

#### Acceptance Criteria

1. WHEN the audit scans all frontend files for API calls (fetch, axios, @tanstack/react-query hooks, custom API utilities) THEN the system SHALL produce a list of every API endpoint referenced in the frontend code.
2. WHEN the audit cross-references frontend API calls with the backend route definitions (NestJS controllers under `backend/src/`) THEN the system SHALL classify each call as "connected" (matching backend route exists) or "disconnected" (no matching backend route).
3. WHEN a frontend page uses hardcoded/mock data (static arrays, faker-generated data, `mockData` variables, JSON imports) instead of API calls THEN the system SHALL flag that page as "using mock data" and list the specific data points that need real API connections.
4. WHEN the audit finds `// TODO`, `// FIXME`, `// HACK`, or `// PLACEHOLDER` comments near API-related code THEN the system SHALL include those in the report as integration gaps.
5. WHEN the audit is complete THEN the system SHALL produce a priority-ranked list of disconnected/mock integrations sorted by business criticality (critical workflows first).

### Requirement 5: Production Load Readiness Assessment

**User Story:** As a DevOps engineer, I want to understand which parts of the application can handle concurrent users and which have performance or scalability concerns, so that I can plan capacity and identify bottlenecks before go-live.

#### Acceptance Criteria

1. WHEN the audit examines the backend for database query patterns THEN the system SHALL identify N+1 queries, missing indexes, unoptimized joins, and queries without pagination that would degrade under load.
2. WHEN the audit examines frontend state management THEN the system SHALL identify pages that fetch all records without pagination, pages with excessive re-renders, and components that don't implement proper loading/error states.
3. WHEN the audit examines WebSocket usage (socket.io-client) THEN the system SHALL verify connection handling (reconnection logic, authentication, room management) is production-ready.
4. WHEN the audit examines authentication and authorization THEN the system SHALL verify JWT token handling, refresh logic, role-based access control enforcement, and session management are complete (not stubbed).
5. WHEN the audit examines error handling THEN the system SHALL verify that all API calls have proper error boundaries, retry logic where appropriate, and user-friendly error messages (not raw error dumps).
6. WHEN the audit is complete THEN the system SHALL produce a go/no-go recommendation per module with specific blockers listed for any "no-go" modules.

### Requirement 6: Audit Report Generation

**User Story:** As a project manager, I want a single consolidated report that summarizes the production readiness of every module, so that I can make informed go-live decisions and prioritize remaining work.

#### Acceptance Criteria

1. WHEN all audits are complete THEN the system SHALL generate a markdown report at `docs/production-readiness-report.md` with sections for each module (auth, dashboard, finance, HR, inventory, IT, logistics, marketing, payment, procurement, retail, sales, security, warehouse, compliance, audit, F&B, clinic, farming, settings, tools).
2. WHEN the report is generated THEN each module section SHALL include: total interactive elements, count by classification (functional/partial/stub/broken), critical workflows tested with pass/fail status, API integration status (connected/disconnected/mock), and a go-live readiness score (0-100%).
3. WHEN the report identifies blockers THEN it SHALL categorize them as: P0 (blocks go-live, must fix), P1 (degrades experience, should fix), P2 (cosmetic/nice-to-have, can defer).
4. WHEN the report is complete THEN it SHALL include an executive summary with overall go-live readiness percentage, top 10 critical blockers, and estimated effort to resolve each.

---

## Correctness Properties

**Property 1: Classification Completeness** — Every interactive element in the application is classified into exactly one of the four categories (fully functional, partially working, stub, broken). No element is left unclassified.

**Property 2: Workflow Coverage** — Every critical business workflow defined in Requirement 3 is tested end-to-end. If a workflow cannot complete, the exact failure point is documented with a clear remediation path.

**Property 3: API Mapping Accuracy** — Every frontend API call is matched against the backend route registry. The classification (connected/disconnected/mock) is verifiable by inspecting the source.

**Property 4: Report Consistency** — The numbers in the summary report are consistent with the detailed findings (e.g., sum of per-page counts equals total counts, go-live scores are derived from the actual classification ratios).
