# Implementation Plan

## Overview

This task list follows the exploratory bugfix workflow for the UI Color Consistency Fix. It replaces all hardcoded Tailwind color classes across 45 pages with design token equivalents, restoring WCAG AA compliance in both light and dark mode. Tasks are ordered: explore the bug → preserve baseline behavior → implement the fix → validate.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3.1"] },
    { "wave": 4, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6"] },
    { "wave": 5, "tasks": ["3.7", "3.8"] },
    { "wave": 6, "tasks": ["4"] }
  ]
}
```

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Hardcoded Tailwind Color Classes Present in JSX
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate hardcoded color classes are present and produce WCAG AA contrast failures
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases — `isBugCondition(element) = true` — to ensure reproducibility across all 45 pages
  - Implement the `isBugCondition(className)` helper that returns `true` when the className string contains any token from `allHardcoded` (all text-/bg-/border- hardcoded color families from the design)
  - Write a property-based test: for all sampled elements with `isBugCondition = true`, assert the rendered `className` contains NO token from `allHardcoded` (this assertion will fail on unfixed code)
  - Include scoped concrete cases:
    - Layer B Scan — `core-it`: assert no rendered element carries `text-blue-*`; expect ~4,967 counterexamples
    - Layer B Scan — `core-security`: assert no rendered element carries a hardcoded color class
    - Layer B Scan — `core-dashboard`: assert `text-emerald-*`, `bg-indigo-*`, `text-rose-*` are absent
    - Contrast Ratio Check — Dark Mode: render under `.dark` class; assert all text contrast ratios ≥ 4.5:1 (normal) or ≥ 3:1 (large); expect thousands of failures
    - Edge Case — `text-gray-400`: assert it is absent from all classNames (produces ~3.1:1 on dark background)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g., "`text-blue-600` appears in `core-it` table cell className", "`text-gray-400` contrast on `hsl(225 60% 3%)` ≈ 3.1:1", "`bg-indigo-900` near-invisible on light background")
  - Mark task complete when test is written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Buggy Elements Render Identically Before and After Fix
  - **IMPORTANT**: Follow the observation-first methodology
  - Observe behavior on UNFIXED code for all elements where `isBugCondition(element) = false`:
    - Observe: components using `text-foreground`, `bg-background`, `text-primary`, `bg-card`, `border-border` render correctly in both themes
    - Observe: spacing/typography/layout utilities (`p-4`, `text-sm`, `gap-2`, `flex`, `grid`) are unaffected by any color replacement
    - Observe: Recharts `fill`, `stroke`, and inline `style` color props render unchanged
    - Observe: theme toggle fires and token-based colors update within a single render cycle
    - Observe: `bg-orange-*` / `text-orange-*` in warning contexts convey warning semantic; in destructive contexts convey destructive semantic
  - Write property-based tests capturing observed behavior:
    - **Property 2a — Already-Correct Token Classes**: for all elements with only token classes, assert `render(element) = render'(element)`
    - **Property 2b — Non-Color Utility Preservation**: generate random non-color utility className strings; assert replacement function returns input unchanged
    - **Property 2c — No Over-Replacement**: generate className strings mixing hardcoded color classes with non-color utilities; assert only color tokens are replaced, all non-color tokens survive verbatim
    - **Property 2d — Idempotency**: apply the replacement function twice to any input; assert the second application is a no-op
    - **Property 2e — Recharts Prop Preservation**: assert Recharts `fill`, `stroke`, and inline `style` props are unchanged in all chart components
    - **Property 2f — Orange Context Preservation**: assert `bg-orange-*`/`text-orange-*` in warning contexts becomes `bg-warning`/`text-warning`; in destructive contexts becomes `bg-destructive`/`text-destructive`
  - Verify all preservation tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and all passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Fix — Replace all hardcoded Tailwind color classes with design token equivalents

  - [x] 3.1 Implement the `isBugCondition` helper and replacement mapping utility
    - Create a utility function `isBugCondition(className: string): boolean` that matches all hardcoded color families defined in the design
    - Create a `replaceHardcodedColors(className: string, context?: 'warning' | 'destructive'): string` function applying the authoritative replacement mapping from the design
    - Mapping: `text-blue-*` / `text-indigo-*` / `text-violet-*` / `text-purple-*` → `text-primary`
    - Mapping: `text-emerald-*` / `text-green-*` → `text-success`
    - Mapping: `text-red-*` / `text-rose-*` → `text-destructive`
    - Mapping: `text-amber-*` / `text-yellow-*` / `text-orange-*` (warning) → `text-warning`; (destructive) → `text-destructive`
    - Mapping: `text-gray-*` / `text-zinc-*` / `text-neutral-*` / `text-slate-*` → `text-muted-foreground`
    - Mapping: `bg-indigo-*` / `bg-blue-*` / `bg-violet-*` / `bg-purple-*` → `bg-primary`
    - Mapping: `bg-emerald-*` / `bg-green-*` → `bg-success`
    - Mapping: `bg-red-*` / `bg-rose-*` → `bg-destructive`
    - Mapping: `bg-amber-*` / `bg-yellow-*` / `bg-orange-*` (warning) → `bg-warning`
    - Mapping: `bg-gray-*` / `bg-zinc-*` / `bg-neutral-*` / `bg-slate-*` → `bg-muted`
    - Mapping: `border-blue-*` / `border-indigo-*` → `border-primary`
    - Mapping: `border-gray-*` / `border-zinc-*` → `border-border`
    - Write unit tests: verify `isBugCondition` returns `true` for all hardcoded families and `false` for token classes, non-color utilities, and empty strings
    - Write unit tests: verify each replacement mapping, including edge cases (empty className, non-color-only, mixed token + hardcoded, partial fix scenario)
    - Write unit tests: verify `text-orange-*` context detection routes to `text-warning` vs. `text-destructive` correctly
    - _Bug_Condition: `isBugCondition(element)` — element.className contains any token from allHardcoded_
    - _Expected_Behavior: `render'(element).className` contains no token from allHardcoded; contrast ratio ≥ 4.5:1 (normal) or ≥ 3:1 (large) in both light and dark mode_
    - _Preservation: elements where `isBugCondition = false` satisfy `render(element) = render'(element)`_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.2 Replace hardcoded color classes in `core-it` page (highest priority — ~4,967 violations)
    - Replace all `text-blue-600` occurrences → `text-primary` in `src/pages/core-it/` and any related components
    - Verify data table column classes, chart legend labels, and badge variants
    - Do NOT alter numeric suffixes on non-color utilities (e.g. `p-4`, `text-sm`, `gap-2`)
    - Do NOT modify Recharts `fill`, `stroke`, or inline `style` props
    - _Bug_Condition: `isBugCondition(element)` where element carries `text-blue-*`_
    - _Expected_Behavior: `text-primary` in all previously-`text-blue-600` elements; zero Layer B violations on `core-it`_
    - _Preservation: all non-color utilities and already-correct tokens unchanged_
    - _Requirements: 1.5, 2.1, 2.8, 2.9, 3.4, 3.5_

  - [x] 3.3 Replace hardcoded color classes in `core-security` page (~4,963 dark-mode contrast failures)
    - Replace `bg-indigo-*` → `bg-primary`, `text-gray-*` → `text-muted-foreground`, and all other hardcoded classes per mapping table
    - Verify badge variants and any component that contributes to the 4,963 dark-mode contrast failures
    - Do NOT modify Recharts props or `src/index.css`
    - _Bug_Condition: `isBugCondition(element)` where element carries `bg-indigo-*`, `text-gray-*`, or other hardcoded color families_
    - _Expected_Behavior: zero Layer A violations in dark mode on `core-security`_
    - _Preservation: all non-color utilities and already-correct tokens unchanged_
    - _Requirements: 1.4, 1.6, 2.2, 2.5, 2.6, 2.8, 3.1, 3.4_

  - [x] 3.4 Replace hardcoded color classes in `core-dashboard` page (~112 violations)
    - Replace `text-emerald-*` → `text-success`, `bg-indigo-*` → `bg-primary`, `text-rose-*` → `text-destructive`
    - Verify stat cards, KPI cards, and chart backgrounds
    - _Bug_Condition: `isBugCondition(element)` where element carries `text-emerald-*`, `bg-indigo-*`, `text-rose-*`_
    - _Expected_Behavior: zero Layer B violations on `core-dashboard`; stat card colors `text-success` / `text-destructive`, chart backgrounds `bg-primary`_
    - _Preservation: all non-color utilities and already-correct tokens unchanged_
    - _Requirements: 1.7, 2.2, 2.3, 2.6, 2.8, 3.1, 3.4_

  - [x] 3.5 Replace hardcoded color classes across remaining 42 pages
    - Apply the full replacement mapping table from the design to all remaining page files under `src/pages/`
    - For each `bg-orange-*` / `text-orange-*` occurrence, examine surrounding semantics before replacing with `bg-warning`/`text-warning` vs. `bg-destructive`/`text-destructive`
    - Do NOT modify Recharts props, `src/index.css`, or `tailwind.config.*`
    - _Bug_Condition: `isBugCondition(element) = true` across remaining pages_
    - _Expected_Behavior: all 45 pages return `isBugCondition = false` for every rendered element_
    - _Preservation: orange context semantic intent preserved (3.6, 3.7); non-color utilities unchanged (3.4); Recharts props unchanged (3.5)_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.6 Replace hardcoded color classes in shared components (`src/components/`)
    - Audit all reusable UI components for hardcoded color classes (violations here multiply across all pages)
    - Apply full replacement mapping; handle `orange-*` context-sensitively
    - Verify the component library renders correctly under both light and dark themes
    - _Bug_Condition: `isBugCondition(element) = true` in shared components_
    - _Expected_Behavior: all shared components are token-only; no multiplication of Layer B violations across pages_
    - _Preservation: component APIs, props, and non-color utilities unchanged_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.4_

  - [x] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Hardcoded Color Classes Replaced by Design Tokens
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior; when it passes it confirms the fix is correct
    - Run the bug condition exploration test (Layer B scans for `core-it`, `core-security`, `core-dashboard`, full-page scan, contrast ratio check, `text-gray-400` edge case)
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — zero hardcoded color class counterexamples, WCAG AA contrast met)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Buggy Elements Render Identically Before and After Fix
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests (2a through 2f: token classes, non-color utilities, no-over-replacement, idempotency, Recharts props, orange context)
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions — non-buggy elements are unaffected)
    - Confirm zero regressions across all 45 pages

- [x] 4. Run integration tests and final checkpoint
  - Run full light-mode render of all 45 pages; assert zero Layer B violations (no hardcoded color class in any rendered `className`)
  - Run full dark-mode render of all 45 pages; assert zero Layer A violations (all contrast ratios ≥ WCAG AA thresholds)
  - Run theme toggle end-to-end test on each page; assert all visible elements update color without a page reload (Requirement 3.3)
  - Run `core-it` regression test: assert zero `text-blue-*` occurrences; data table renders correctly with `text-primary`
  - Run `core-security` regression test: assert zero contrast failures in dark mode
  - Run `core-dashboard` regression test: assert stat card colors (`text-success`, `text-destructive`) and chart backgrounds (`bg-primary`) are present and contrast-compliant
  - Ensure all tests pass — ask the user if questions arise
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

## Notes

- **Out of scope**: Recharts `fill`/`stroke`/inline `style` props, `src/index.css`, `tailwind.config.*`
- **Orange handling**: `bg-orange-*` / `text-orange-*` must be examined per-usage context before mapping to `bg-warning`/`text-warning` vs. `bg-destructive`/`text-destructive`
- **Priority order**: `core-it` (~4,967 violations) → `core-security` (~4,963 dark-mode failures) → `core-dashboard` (112 violations) → remaining 42 pages → shared components
- **Design token reference**: See design.md Replacement Mapping table for the authoritative class-to-token mapping
- **Non-color classes**: Do NOT alter non-color Tailwind utilities (spacing, typography, layout, animation); only color families are in scope
