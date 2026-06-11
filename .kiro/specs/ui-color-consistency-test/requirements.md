# Requirements Document

## Introduction

This feature delivers a Playwright-based UI Color Consistency Test Suite for the Zenvix Business
Flow Suite v2 application (React + Tailwind CSS + shadcn/ui). The application defines a design token
system through CSS variables in `src/index.css` for both light and dark mode, but many components
bypass those tokens by using hardcoded Tailwind color classes (e.g. `text-blue-500`, `bg-red-50`,
`bg-emerald-600`) or raw hex values in `style` attributes. The consequences are visible: buttons
whose text blends into the background, visual inconsistency across pages, dark mode failures, and
charts and badges using arbitrary colors.

The test suite audits the live application at `http://150.109.15.108:3010` across all three module
groups (Core, Retail Management, Retail Operational) using four complementary test layers:
**Contrast Ratio Check** (WCAG AA), **Hardcoded Color Class Audit**, **Screenshot Comparison** (light
vs. dark), and **Theme Token Compliance**. Every violation is captured with enough detail to fix it.
The suite acts as a continuous audit, never as a pass/fail gate — it reports warnings rather than
failing the run when violations are found, and always produces its full set of output artifacts.

The single test file is `tests/playwright/15_ui_color_consistency.spec.ts`, targeting the existing
Playwright infrastructure (config at `playwright.config.ts`, auth state at
`tests/playwright/.auth/user.json`).

---

## Glossary

- **Test_Suite**: The Playwright test file `tests/playwright/15_ui_color_consistency.spec.ts` that
  implements all four test layers described in this document.
- **Page**: A single URL route in the application visited by the Test_Suite during a test run.
- **Layer**: One of the four distinct audit categories — Contrast_Check, Hardcoded_Audit,
  Screenshot_Comparison, and Token_Compliance.
- **Light_Mode**: The application theme state when the `dark` class is absent from the `<html>`
  element.
- **Dark_Mode**: The application theme state when the `dark` class is added to the `<html>` element
  via `page.evaluate()`.
- **Design_Token**: A CSS variable defined in `src/index.css` for both `:root` (Light_Mode) and
  `.dark` (Dark_Mode), specifically: `--background`, `--foreground`, `--primary`,
  `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--border`,
  `--destructive`, `--success`, `--warning`, `--card`, `--card-foreground`, `--chart-1` through
  `--chart-5`.
- **Semantic_Token_Class**: A Tailwind utility class that maps to a Design_Token, e.g.
  `text-primary`, `bg-card`, `border-border`, `text-muted-foreground`. These are compliant uses.
- **Hardcoded_Color_Class**: A Tailwind utility class whose color segment is a literal palette name
  from the set {blue, red, green, emerald, rose, amber, violet, purple, orange, yellow, gray, zinc,
  neutral, stone, cyan, teal, lime, pink, fuchsia, sky, indigo} followed by a numeric shade, e.g.
  `text-blue-500`, `bg-red-50`, `border-emerald-600`. These bypass Design_Tokens and are violations.
- **Contrast_Ratio**: The luminance ratio between a text color and its effective background color,
  computed per the WCAG 2.1 relative luminance formula.
- **WCAG_AA_Normal**: The WCAG AA minimum Contrast_Ratio for normal text: 4.5:1.
- **WCAG_AA_Large**: The WCAG AA minimum Contrast_Ratio for large text (≥18pt or ≥14pt bold): 3:1.
- **Pixel_Diff_Percentage**: The percentage of pixels that differ between the light-mode and
  dark-mode full-page screenshots of the same Page, computed by comparing the two PNG artifacts.
- **Report_JSON**: The structured output file `playwright-report/ui-color-report.json` containing
  all findings organized by Page and Layer.
- **Report_HTML**: The human-readable summary file `playwright-report/ui-color-summary.html`
  generated from the findings in Report_JSON.
- **Screenshot_Artifact**: A full-page PNG file saved under
  `playwright-report/screenshots/light/{page-name}.png` or
  `playwright-report/screenshots/dark/{page-name}.png`.
- **Decorative_Element**: An SVG icon, decorative image, or purely presentational element that
  conveys no information and is not interactive. Decorative_Elements are excluded from
  Contrast_Check analysis to avoid false positives.
- **Interactive_Element**: A button, link, input, label, badge, status indicator, or any element
  with a visible text node that a user can read or act upon.
- **Violation**: A finding from any Layer that represents a deviation from the expected design token
  or accessibility standard. Violations are warnings in the output; they do not cause the test run
  to abort.
- **Core_Module_Pages**: The set of Pages belonging to the Core module group: Dashboard, Finance
  (all sub-pages), HR (all sub-pages), IT, Sales, Marketing, Procurement, Inventory, Payment,
  Settings, Security, Audit, Logs, Tools.
- **Retail_Management_Pages**: The set of Pages belonging to the Retail Management module group:
  Store Dashboard, Inventory, Order Fulfillment, Pricing, Channels, Shift Control, Device Control.
- **Retail_Operational_Pages**: The set of Pages belonging to the Retail Operational module group:
  POS, Shift Open, Shift Close, Receiving, Refund/Return, Stock Opname, Cash Movement.
- **All_Pages**: The union of Core_Module_Pages, Retail_Management_Pages, and
  Retail_Operational_Pages.

---

## Requirements

### Requirement 1: Page Coverage

**User Story:** As a QA engineer, I want the test suite to visit every page of the application in
both light and dark mode, so that no page is silently skipped and the audit is complete.

#### Acceptance Criteria

1. THE Test_Suite SHALL visit every Page in All_Pages in Light_Mode during a test run.
2. THE Test_Suite SHALL visit every Page in All_Pages in Dark_Mode during a test run.
3. WHEN a Page navigation fails or times out, THE Test_Suite SHALL record the failure as a Violation
   for that Page and continue to the next Page without aborting the run.
4. THE Test_Suite SHALL apply a per-page timeout of 60 seconds (covering navigation, screenshot
   capture, and all Layer evaluations for that Page).
5. THE Test_Suite SHALL run with a single worker to comply with the remote server constraint defined
   in `playwright.config.ts`.
6. THE Test_Suite SHALL authenticate using the storageState at `tests/playwright/.auth/user.json`
   for all Page visits.

---

### Requirement 2: Contrast Ratio Check (Layer A)

**User Story:** As an accessibility engineer, I want every Interactive_Element on every page
evaluated for WCAG AA contrast compliance in both light and dark mode, so that unreadable
combinations are discovered and reported with enough detail to fix them.

#### Acceptance Criteria

1. WHEN the Test_Suite visits a Page in Light_Mode, THE Test_Suite SHALL compute the Contrast_Ratio
   between the text color and effective background color for every visible Interactive_Element on
   that Page.
2. WHEN the Test_Suite visits a Page in Dark_Mode, THE Test_Suite SHALL compute the Contrast_Ratio
   between the text color and effective background color for every visible Interactive_Element on
   that Page.
3. WHEN a Contrast_Ratio for normal text is below WCAG_AA_Normal (4.5:1), THE Test_Suite SHALL
   record a Violation containing: page name, element CSS selector, text color value, background
   color value, computed Contrast_Ratio, and pass/fail verdict.
4. WHEN a Contrast_Ratio for large text is below WCAG_AA_Large (3:1), THE Test_Suite SHALL record a
   Violation containing: page name, element CSS selector, text color value, background color value,
   computed Contrast_Ratio, and pass/fail verdict.
5. THE Test_Suite SHALL exclude Decorative_Elements from Contrast_Ratio computation to prevent false
   positives from SVG icons and presentational graphics.
6. IF an Interactive_Element's background color cannot be determined (transparent or inherited), THEN
   THE Test_Suite SHALL traverse the DOM upward to the nearest ancestor with a non-transparent
   background color and use that value as the effective background color.
7. THE Test_Suite SHALL record Contrast_Ratio violations as test failures so that the affected Page
   is marked as failing and the violation is surfaced for remediation.

---

### Requirement 3: Hardcoded Color Class Audit (Layer B)

**User Story:** As a frontend developer, I want every rendered DOM element scanned for Tailwind
color classes that bypass the design token system, so that each violation is reported with its
location and a recommended token replacement.

#### Acceptance Criteria

1. WHEN the Test_Suite visits a Page, THE Test_Suite SHALL scan the rendered DOM of that Page for
   elements carrying Hardcoded_Color_Class attributes of the forms `text-{color}-{shade}`,
   `bg-{color}-{shade}`, and `border-{color}-{shade}`.
2. THE Test_Suite SHALL flag only classes whose color segment matches a literal palette name from the
   defined set {blue, red, green, emerald, rose, amber, violet, purple, orange, yellow, gray, zinc,
   neutral, stone, cyan, teal, lime, pink, fuchsia, sky, indigo} — not Semantic_Token_Classes such
   as `text-primary`, `bg-card`, or `border-border`.
3. WHEN a Hardcoded_Color_Class is found, THE Test_Suite SHALL record a Violation containing: page
   name, element tag name, the violating class string, and a recommended Design_Token replacement.
4. THE Test_Suite SHALL perform the Hardcoded_Color_Class scan on Pages visited in Light_Mode (one
   scan per Page suffices because class names are mode-independent).
5. THE Test_Suite SHALL record Hardcoded_Color_Class violations as test failures so that the
   affected Page is marked as failing and the violating elements are surfaced for remediation.

---

### Requirement 4: Screenshot Comparison — Light vs. Dark (Layer C)

**User Story:** As a UI engineer, I want full-page screenshots taken for every page in both modes
and compared pixel-by-pixel, so that pages where dark mode is not functioning are identified and
flagged.

#### Acceptance Criteria

1. WHEN the Test_Suite visits a Page in Light_Mode, THE Test_Suite SHALL capture and save a
   full-page Screenshot_Artifact at `playwright-report/screenshots/light/{page-name}.png`.
2. WHEN the Test_Suite visits a Page in Dark_Mode, THE Test_Suite SHALL capture and save a
   full-page Screenshot_Artifact at `playwright-report/screenshots/dark/{page-name}.png`.
3. WHEN both Screenshot_Artifacts for a Page are available, THE Test_Suite SHALL compute the
   Pixel_Diff_Percentage between the light-mode and dark-mode screenshots.
4. WHEN a Pixel_Diff_Percentage is greater than 5%, THE Test_Suite SHALL record a verdict of
   `DARK_MODE_WORKS` for that Page, indicating dark mode is producing a visually distinct result.
5. WHEN a Pixel_Diff_Percentage is 5% or below, THE Test_Suite SHALL record a verdict of
   `DARK_MODE_BROKEN` for that Page, indicating the page looks the same in both modes.
   The `DARK_MODE_WORKS` and `DARK_MODE_BROKEN` verdicts are mutually exclusive — exactly one
   applies based on whether the percentage is strictly greater than the 5% threshold.
6. THE Test_Suite SHALL include in the Report_JSON for each Page: page name, Pixel_Diff_Percentage,
   and the `DARK_MODE_WORKS` or `DARK_MODE_BROKEN` verdict.
7. THE Test_Suite SHALL emit a `DARK_MODE_BROKEN` verdict as a warning, not as a test failure, so
   the run continues to remaining Pages.

---

### Requirement 5: Theme Token Compliance (Layer D)

**User Story:** As a frontend developer, I want the resolved values of CSS Design_Tokens verified on
every page in both modes, so that tokens that are missing, empty, or producing wrong luminance
values are caught and reported.

#### Acceptance Criteria

1. WHEN the Test_Suite visits a Page in Light_Mode, THE Test_Suite SHALL evaluate that each of the
   following Design_Tokens resolves to a non-empty, non-undefined color value: `--background`,
   `--foreground`, `--primary`, `--card`, `--border`, `--muted-foreground`.
2. WHEN the Test_Suite visits a Page in Dark_Mode, THE Test_Suite SHALL evaluate that each of the
   same six Design_Tokens resolves to a non-empty, non-undefined color value.
3. WHEN the Test_Suite evaluates `--background` in Dark_Mode, THE Test_Suite SHALL compute the
   luminance of the resolved color value and record a Violation if the luminance is 20% or above,
   indicating the background is not visibly dark.
4. WHEN the Test_Suite evaluates `--background` in Light_Mode, THE Test_Suite SHALL compute the
   luminance of the resolved color value and record a Violation if the luminance is 80% or below,
   indicating the background is not visibly light.
5. WHEN a Violation is recorded for a Design_Token, THE Test_Suite SHALL include: page name, token
   name, resolved value (or empty string if unresolved), and a `compliant: yes/no` field.
6. WHEN a Violation is recorded for a critical Design_Token (`--background`, `--foreground`,
   `--primary`), THE Test_Suite SHALL record it as a test failure so the affected Page is marked as
   failing.
7. WHEN a Violation is recorded for a non-critical Design_Token (`--card`, `--border`,
   `--muted-foreground`), THE Test_Suite SHALL emit it as a warning, not a test failure.

---

### Requirement 6: Report Generation

**User Story:** As a QA engineer, I want a complete, structured JSON report and a human-readable
HTML summary always produced after a test run, so that findings can be reviewed even when violations
exist.

#### Acceptance Criteria

1. WHEN a test run completes, THE Test_Suite SHALL write Report_JSON at
   `playwright-report/ui-color-report.json` containing all findings from all four Layers, organized
   by Page name, regardless of whether violations were found.
2. THE Report_JSON SHALL include, for each Page, a section for each Layer with its individual
   findings (Contrast_Ratio violations, Hardcoded_Color_Class violations, Screenshot_Comparison
   result, and Token_Compliance results).
3. WHEN a test run completes, THE Test_Suite SHALL write Report_HTML at
   `playwright-report/ui-color-summary.html` as a human-readable summary of all findings from
   Report_JSON.
4. THE Test_Suite SHALL output a console summary at the end of each test run showing the total
   number of violations per Layer per Page.
5. IF Report_JSON or Report_HTML cannot be written due to a filesystem error, THEN THE Test_Suite
   SHALL log the error to the console and continue without throwing an unhandled exception.
6. THE Test_Suite SHALL create the `playwright-report/screenshots/light/` and
   `playwright-report/screenshots/dark/` directories before saving Screenshot_Artifacts if those
   directories do not already exist.

---

### Requirement 7: Audit-Mode Execution (Non-Aborting)

**User Story:** As a QA engineer, I want the test suite to act as an audit tool that always
completes a full run across all pages and layers, so that a complete report is produced even when
many violations are found, while still marking individual test cases as failing when violations
require developer attention.

#### Acceptance Criteria

1. THE Test_Suite SHALL complete evaluation of all Pages and all Layers in a single run even when
   Violations are found.
2. WHEN any Layer evaluation throws an unexpected error on a specific Page in audit mode, THE
   Test_Suite SHALL catch that error, record it as a Violation for that Page and Layer, and proceed
   to the next evaluation without propagating the error as an unhandled exception that stops the run.
3. WHILE running in audit mode, THE Test_Suite SHALL treat Screenshot_Comparison and non-critical
   Token_Compliance violations as informational warnings in the test output; Contrast_Ratio,
   Hardcoded_Color_Class, and critical Token_Compliance violations SHALL be recorded as test
   failures that mark the affected test cases as failing.
4. WHILE running in audit mode, THE Test_Suite SHALL never abort the entire run early due to the
   volume of Violations found on a single Page; each Page is evaluated independently.

---

### Requirement 8: False-Positive Prevention

**User Story:** As a QA engineer, I want the test suite to avoid flagging SVG icons and purely
decorative elements as contrast violations, so that the report reflects only real accessibility
problems.

#### Acceptance Criteria

1. THE Test_Suite SHALL identify Decorative_Elements by checking for `aria-hidden="true"`,
   `role="presentation"`, `role="img"` without accessible text, or SVG elements that are
   descendants of an element marked `aria-hidden="true"`.
2. THE Test_Suite SHALL exclude all Decorative_Elements from Contrast_Ratio computation in Layer A.
3. THE Test_Suite SHALL exclude zero-size elements (elements with zero computed width or height) from
   Contrast_Ratio computation in Layer A.
4. THE Test_Suite SHALL exclude elements with a computed opacity of 0 from Contrast_Ratio
   computation in Layer A.
