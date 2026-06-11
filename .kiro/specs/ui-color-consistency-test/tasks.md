# Implementation Plan: UI Color Consistency Test Suite

## Overview

Implement `tests/playwright/15_ui_color_consistency.spec.ts` — a single Playwright audit file that
visits 45 application pages across four test layers (Contrast Ratio, Hardcoded Color Classes,
Screenshot Comparison, Theme Token Compliance). Pure helper functions are extracted into a shared
utility module so they can be covered by Vitest property-based tests using `fast-check`. All output
artifacts go to `playwright-report/`. The suite never aborts on violations; it uses `expect.soft()`
for failures and `console.warn()` for warnings.

---

## Tasks

- [x] 1. Create the shared color-helpers utility module
  - Create `tests/playwright/utils/color-helpers.ts` containing all pure, self-contained helper
    functions that will be shared between the Playwright spec and the Vitest PBT suite
  - Implement `computeRelativeLuminance(r, g, b): number` — WCAG 2.1 formula
  - Implement `contrastRatio(l1, l2): number` — `(max+0.05)/(min+0.05)`
  - Implement `isLargeText(fontSize, fontWeight): boolean`
  - Implement `classifyContrastViolation(ratio, textType): boolean` — returns `true` when ratio
    is strictly below the applicable threshold (4.5 normal / 3.0 large)
  - Implement `isDecorative(attrs): boolean` — accepts a plain descriptor object so it can run
    in both Node and browser contexts; checks `ariaHidden`, `role`, `hasAccessibleLabel`,
    `width`, `height`, `opacity`
  - Implement `computePixelDiffPct(img1Data, img2Data, width, height, channels): number`
  - Implement `classifyDarkMode(pixelDiffPct: number): "DARK_MODE_WORKS" | "DARK_MODE_BROKEN"`
  - Implement `isHardcodedClass(className: string): boolean` — regex against the 21-color palette
  - Implement `suggestToken(prefix: string, color: string): string` — TOKEN_MAP lookup
  - Implement `computeLuminanceFromHSL(hslStr: string): number | null` — parse `"h s% l%"` and
    apply WCAG relative luminance
  - Implement `isTestFailure(violationType: string, critical?: boolean): boolean`
  - Export all functions and re-export the `PALETTE_COLORS` set and `TOKEN_MAP` record so the
    Playwright spec can import them without duplicating literals
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.3, 4.4, 4.5, 5.3, 5.4, 7.3, 8.1,
    8.2, 8.3, 8.4_

  - [x] 1.1 Write property test: WCAG relative luminance formula correctness (Property 1)
    - File: `tests/playwright/utils/color-helpers.pbt.test.ts`
    - **Property 1: WCAG Relative Luminance Formula Correctness**
    - Use `fc.integer({min:0,max:255})` for r, g, b
    - Assert result ∈ [0, 1]; verify black→0 and white→1 as boundary anchors
    - Assert `contrastRatio(l1, l2) === (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)`
    - Tag: `// Feature: ui-color-consistency-test, Property 1`
    - Run 100 iterations minimum
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 1.2 Write property test: contrast threshold classification (Property 2)
    - File: `tests/playwright/utils/color-helpers.pbt.test.ts`
    - **Property 2: Contrast Threshold Classification**
    - Use `fc.float({min:1.0,max:21.0})` for ratio; `fc.constantFrom("normal","large")` for
      textType
    - Assert violation iff ratio < threshold (4.5 normal / 3.0 large); assert no violation when
      ratio ≥ threshold
    - Tag: `// Feature: ui-color-consistency-test, Property 2`
    - **Validates: Requirements 2.3, 2.4**

  - [x] 1.3 Write property test: element exclusion filter completeness (Property 3)
    - File: `tests/playwright/utils/color-helpers.pbt.test.ts`
    - **Property 3: Element Exclusion Filter Completeness**
    - Use `fc.record({ariaHidden:fc.boolean(), role:fc.option(fc.constantFrom("presentation","img","button")), hasAccessibleLabel:fc.boolean(), width:fc.nat(), height:fc.nat(), opacity:fc.float({min:0,max:1})})`
    - Assert `isDecorative` returns `true` for any descriptor with `ariaHidden=true`,
      `role="presentation"`, `role="img"` + `hasAccessibleLabel=false`, `width=0`, `height=0`,
      or `opacity=0`
    - Assert `isDecorative` returns `false` when none of the above conditions hold and
      dimensions/opacity are non-zero
    - Tag: `// Feature: ui-color-consistency-test, Property 3`
    - **Validates: Requirements 2.5, 8.1, 8.2, 8.3, 8.4**

  - [x] 1.4 Write property test: hardcoded class scanner precision and recall (Property 4)
    - File: `tests/playwright/utils/color-helpers.pbt.test.ts`
    - **Property 4: Hardcoded Class Scanner Precision and Recall**
    - Use `fc.constantFrom(...PALETTE_COLORS)`, `fc.integer({min:50,max:950})`,
      `fc.constantFrom("text","bg","border")` to generate valid hardcoded class strings
    - Assert `isHardcodedClass(hardcoded)` is `true`; assert semantic tokens
      (`text-primary`, `bg-card`, `border-border`) return `false`
    - Assert every flagged class produces a non-empty `suggestToken()` result
    - Tag: `// Feature: ui-color-consistency-test, Property 4`
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 1.5 Write property test: pixel diff classification (Property 5)
    - File: `tests/playwright/utils/color-helpers.pbt.test.ts`
    - **Property 5: Pixel Diff Classification**
    - Use `fc.float({min:0,max:100})` for pixelDiffPct
    - Assert result ∈ {"DARK_MODE_WORKS","DARK_MODE_BROKEN"}; assert mutual exclusivity
    - Assert `DARK_MODE_WORKS` iff pct > 5, `DARK_MODE_BROKEN` iff pct ≤ 5
    - Assert `computePixelDiffPct` returns value in [0, 100] for any valid RGBA pixel arrays
    - Tag: `// Feature: ui-color-consistency-test, Property 5`
    - **Validates: Requirements 4.3, 4.4, 4.5**

  - [x] 1.6 Write property test: background token luminance gating (Property 6)
    - File: `tests/playwright/utils/color-helpers.pbt.test.ts`
    - **Property 6: Background Token Luminance Gating**
    - Use `fc.tuple(fc.integer({min:0,max:360}), fc.integer({min:0,max:100}), fc.integer({min:0,max:100}))` to generate HSL triples; format as `"H S% L%"` strings
    - Assert dark-mode violation when luminance ≥ 0.20; light-mode violation when luminance ≤ 0.80
    - Assert no violation when luminance < 0.20 in dark mode and > 0.80 in light mode
    - Tag: `// Feature: ui-color-consistency-test, Property 6`
    - **Validates: Requirements 5.3, 5.4**

  - [x] 1.7 Write property test: violation severity classification (Property 8)
    - File: `tests/playwright/utils/color-helpers.pbt.test.ts`
    - **Property 8: Violation Severity Classification**
    - Use `fc.constantFrom("ContrastViolation","HardcodedViolation","TokenViolation","ScreenshotResult")` and `fc.boolean()` for `critical`
    - Assert `isTestFailure` returns `true` for ContrastViolation, HardcodedViolation, and
      critical TokenViolation; `false` for ScreenshotResult and non-critical TokenViolation
    - Assert the function is pure (same inputs always produce same output)
    - Tag: `// Feature: ui-color-consistency-test, Property 8`
    - **Validates: Requirements 7.3, 5.6, 5.7**

- [x] 2. Define TypeScript interfaces and report data structures
  - Create `tests/playwright/utils/color-report-types.ts` with all TypeScript interfaces from the
    design: `PageEntry`, `ContrastViolation`, `HardcodedViolation`, `ScreenshotResult`,
    `TokenViolation`, `LayerAResult`, `LayerBResult`, `LayerCResult`, `LayerDResult`,
    `PageReport`, `ColorReport`
  - Export all interfaces for use in both the spec file and the PBT suite
  - _Requirements: 6.1, 6.2_

- [x] 3. Implement Node.js-side report helpers
  - Create `tests/playwright/utils/color-report-helpers.ts`
  - Implement `initPageReport(entry: PageEntry): PageReport` — returns a blank `PageReport` with
    empty arrays for all layer fields
  - Implement `ensureDirectories(outDir: string): void` — creates
    `playwright-report/screenshots/light/` and `playwright-report/screenshots/dark/` if absent
  - Implement `writeReportJSON(report: ColorReport, outDir: string): Promise<void>` — writes
    `ui-color-report.json`; wraps `fs.writeFile` in try/catch, logs on failure, never rethrows
  - Implement `writeReportHTML(report: ColorReport, outDir: string): Promise<void>` — generates
    `ui-color-summary.html` with per-page, per-layer summary tables; wraps in try/catch, never
    rethrows
  - Implement `printConsoleSummary(report: ColorReport): void` — logs a console table with total
    violation counts per layer per page
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 4. Implement the page registry (PAGES constant)
  - Create `tests/playwright/utils/color-pages.ts`
  - Define and export the `PAGES: PageEntry[]` array with all 45 entries covering
    `Core_Module_Pages`, `Retail_Management_Pages`, and `Retail_Operational_Pages` as enumerated
    in the requirements glossary
  - Each entry has: `route` (e.g. `"/core/finance/ledger"`), `name` (slug for file names), and
    `group` enum
  - _Requirements: 1.1, 1.2_

- [x] 5. Implement Layer A — Contrast Ratio Check
  - In the main spec file `tests/playwright/15_ui_color_consistency.spec.ts`, add
    `test.describe("Layer A — Contrast Ratio Check")` with a single test that iterates over
    `PAGES`
  - Inside `page.evaluate()`, inline all helper functions from `color-helpers.ts` (WCAG luminance,
    contrast ratio, `parseRGB`, `getEffectiveBgColor`, `isDecorative`, `isLargeText`, the full
    element selector, and the scanner loop) — these must be fully self-contained with no Node.js
    closures
  - Navigate each page in light mode → call `evaluateContrast` → store results in
    `pageReport.layerA.light`
  - Toggle dark (`document.documentElement.classList.add('dark')`) → call `evaluateContrast`
    again → store in `pageReport.layerA.dark`
  - Restore light (`classList.remove('dark')`)
  - For each contrast violation, call `expect.soft(violation.pass).toBe(true)` so failing
    elements are marked without aborting the run
  - Wrap each page's entire layer-A block in try/catch; on error, populate
    `pageReport.layerA.error` and continue
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 7.1, 7.2,
    8.1, 8.2, 8.3, 8.4_

- [x] 6. Implement Layer B — Hardcoded Color Class Audit
  - In the same spec file, add `test.describe("Layer B — Hardcoded Color Class Audit")`
  - Inside `page.evaluate()`, inline `PALETTE_COLORS`, `HARDCODED_RE`, `TOKEN_MAP`, and the
    scanner loop (one scan per page in light mode — class names are mode-independent)
  - For each `HardcodedViolation` found, call `expect.soft(violations.length).toBe(0)` per page
  - Wrap in try/catch; populate `pageReport.layerB.error` on failure
  - _Requirements: 1.1, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2_

- [x] 7. Implement Layer C — Screenshot Comparison
  - In the same spec file, add `test.describe("Layer C — Screenshot Comparison")`
  - Call `ensureDirectories` before the loop to guarantee screenshot dirs exist
  - Navigate each page in light mode → `page.screenshot({fullPage:true})` → save to
    `playwright-report/screenshots/light/{page.name}.png`
  - Toggle dark → screenshot → save to `playwright-report/screenshots/dark/{page.name}.png`
  - Import `{ decode as decodePNG } from "fast-png"` and call `computePixelDiffPct` on the two
    PNG buffers using the Node-side implementation from `color-helpers.ts`
  - Call `classifyDarkMode(pct)` to set `ScreenshotResult.verdict`
  - Emit `console.warn()` for `DARK_MODE_BROKEN` verdict (not `expect.soft()`) per design
  - Store result in `pageReport.layerC.screenshot`
  - Wrap in try/catch; populate `pageReport.layerC.error` on failure
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.6, 7.1, 7.2_

- [x] 8. Implement Layer D — Theme Token Compliance
  - In the same spec file, add `test.describe("Layer D — Theme Token Compliance")`
  - Inside `page.evaluate(mode => ...)`, inline `TOKENS_TO_CHECK`, `CRITICAL_TOKENS`,
    `hslToRGB`, `computeLuminanceFromHSL`, and the token resolution loop
  - Navigate each page in light mode → call `evaluateTokens(page, "light")` → store in
    `pageReport.layerD.light`
  - Toggle dark → call `evaluateTokens(page, "dark")` → store in `pageReport.layerD.dark`
  - For each `TokenViolation` with `critical: true`, call `expect.soft(violation.compliant).toBe("yes")`
  - For non-critical violations, emit `console.warn()` only
  - Wrap in try/catch; populate `pageReport.layerD.error` on failure
  - _Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.1, 7.2_

- [x] 9. Checkpoint — verify layers compile and first-page smoke test passes
  - Ensure all tests pass, ask the user if questions arise.
  - Run `npx playwright test 15_ui_color_consistency --grep "Layer A" --headed=false` against the
    live VPS to verify at least the first page completes without a crash
  - Confirm the module-level `report` accumulator is populated after the test

- [x] 10. Implement report generation describe block and wiring
  - Add `test.describe("Report Generation")` with a single test that calls, in order:
    `writeReportJSON(report, outDir)`, `writeReportHTML(report, outDir)`,
    `printConsoleSummary(report)`
  - Declare the module-level `report: ColorReport` accumulator at the top of the spec file;
    initialize with `{ generatedAt: "", totalPages: PAGES.length, pages: [] }`
  - Call `initPageReport(entry)` at the start of each page loop iteration and
    `report.pages.push(pageReport)` at its end, inside every layer's describe block
  - Wire `report.generatedAt = new Date().toISOString()` at the start of the Report Generation
    test
  - Ensure all four layer describe blocks populate the shared `report` object so the Report
    Generation test sees complete data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.4_

  - [x] 10.1 Write property test: report completeness invariant (Property 7)
    - File: `tests/playwright/utils/color-helpers.pbt.test.ts`
    - **Property 7: Report Completeness Invariant**
    - Use `fc.array(fc.record({route:fc.string(),name:fc.string(),group:fc.constantFrom("core","retail-management","retail-operational")}), {minLength:1,maxLength:50})` to generate
      page arrays
    - Build a synthetic `ColorReport` via `initPageReport` for each entry
    - Assert `report.pages.length === pages.length`
    - Assert each `PageReport` has non-null `layerA`, `layerB`, `layerC`, `layerD` fields
    - Tag: `// Feature: ui-color-consistency-test, Property 7`
    - **Validates: Requirements 6.2, 7.1, 7.4**

- [x] 11. Final checkpoint — full run and artifact validation
  - Ensure all tests pass, ask the user if questions arise.
  - Run `npx playwright test 15_ui_color_consistency` against the live VPS; verify that
    `playwright-report/ui-color-report.json` and `playwright-report/ui-color-summary.html` are
    created after the run
  - Verify screenshot directories `playwright-report/screenshots/light/` and
    `playwright-report/screenshots/dark/` contain PNG files
  - Run `npx vitest --run tests/playwright/utils/color-helpers.pbt.test.ts` and confirm all
    property-based tests pass

---

## Notes

- Tasks marked with `*` are optional PBT sub-tasks and can be skipped for a faster MVP
- `fast-check` and `fast-png` are already present in `node_modules` — no new dependencies needed
- All `page.evaluate()` functions must be fully self-contained; no Node.js closures or imports
  can be referenced inside the browser context
- The `tests/vitest.config.ts` already includes `tests/**/*.{test,spec}.{ts,tsx}`, so the PBT
  file at `tests/playwright/utils/color-helpers.pbt.test.ts` will be picked up automatically
- Property tests use the `test.prop` API from `@fast-check/vitest` or `fc.assert(fc.property(...))`
  with 100+ iterations; check which fast-check/vitest integration is available before writing
- Each layer's `test.describe` accumulates results into the module-level `report` object; since
  `workers: 1` in `playwright.config.ts`, shared module-level state is safe
- Navigation for each page uses `waitUntil: "domcontentloaded"` + `page.waitForTimeout(1500)` to
  let React hydrate before layer evaluations run
- All violation records use `expect.soft()` so the run never aborts mid-page; the report is
  always written even when many violations are found

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "3", "4"] },
    { "id": 2, "tasks": ["5", "6", "7", "8"] },
    { "id": 3, "tasks": ["10"] },
    { "id": 4, "tasks": ["10.1"] },
    { "id": 5, "tasks": ["11"] }
  ]
}
```
