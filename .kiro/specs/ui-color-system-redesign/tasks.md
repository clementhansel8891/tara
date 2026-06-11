# Implementation Plan: UI Color System Redesign

## Overview

This plan implements the complete color system redesign for Zenvix Business Flow Suite v2. The work proceeds in layers: first establishing the CSS variable foundation and Tailwind config, then adding domain-specific tokens, then remediating broken classes across the codebase, and finally validating correctness with property-based tests.

## Tasks

- [x] 1. Define core CSS custom properties in `src/index.css`
  - [x] 1.1 Define light-mode `:root` block with all core, semantic, surface, sidebar, and chart variables (52 variables total)
    - Declare `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground` with warm amber/coral palette values
    - Declare `--surface-1` (warm off-white H:40 S:25% L:98%), `--surface-2` (pure white), `--surface-3` (warm cream H:40 S:20% L:94%)
    - Declare `--card`/`--card-foreground`, `--popover`/`--popover-foreground` matching surface-2 and foreground
    - Declare `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--destructive`, `--destructive-foreground`, `--info`, `--info-foreground`
    - Declare `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`
    - Declare `--border`, `--input`, `--ring`
    - Declare all 8 sidebar variables
    - Declare `--chart-1` through `--chart-5` with HSL values aligned to CHART_COLORS hex constants
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 5.1, 5.2, 9.5_

  - [x] 1.2 Define dark-mode `.dark` block with all core, semantic, surface, sidebar, and chart variables (52 variables total)
    - Declare `--background` as deep navy (H:224 S:47% L:5%), `--foreground` as near-white
    - Declare `--primary` as blue-purple (H:245 S:75% L:65%), `--primary-foreground` as near-white
    - Declare `--surface-1` matching background, `--surface-2` at +4% L, `--surface-3` at +8% L
    - Declare dark-mode semantic colors (success, warning, destructive, info) with brighter luminance values
    - Ensure `--warning-foreground` on `--warning` background achieves WCAG AA contrast (≥4.5:1)
    - Declare all 8 sidebar variables for dark mode
    - Declare `--chart-1` through `--chart-5` with HSL values aligned to CHART_COLORS_DARK hex constants
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 5.1, 5.2, 9.5_

  - [x] 1.3 Define POS, FNB status, and license domain tokens in both `:root` and `.dark`
    - Declare `--pos-background`, `--pos-card`, `--pos-accent` in both mode blocks
    - Declare `--status-empty` (neutral gray), `--status-ordering` (amber), `--status-served` (green), `--status-billed` (blue), `--status-occupied` (brand accent)
    - Declare `--license-active` (success hue), `--license-trial` (warning hue), `--license-expired` (destructive hue)
    - Ensure all five FNB status colors are visually distinguishable (ΔH ≥ 30° or ΔL ≥ 15%)
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.4, 12.1, 12.2_

- [x] 2. Configure Tailwind color mappings in `tailwind.config.ts`
  - [x] 2.1 Remove `white` and `slate` overrides from `extend.colors`
    - Delete `white: "hsl(var(--surface-2))"` entry
    - Delete entire `slate` override object that remaps shades to CSS variables
    - Verify `text-white` and `bg-white` will now resolve to `#ffffff`
    - _Requirements: 5.4, 6.1, 6.2, 6.3, 6.4_

  - [x] 2.2 Map all shadcn/ui tokens in `extend.colors`
    - Map flat tokens: `border`, `input`, `ring`, `background`, `foreground`
    - Map nested tokens: `primary`, `secondary`, `destructive`, `muted`, `accent`, `popover`, `card` (each with DEFAULT + foreground)
    - Map sidebar tokens: `sidebar` object with 8 entries
    - _Requirements: 5.3_

  - [x] 2.3 Map semantic, surface, and domain tokens in `extend.colors`
    - Map `success`, `warning`, `info` (each with DEFAULT + foreground)
    - Map `surface-1`, `surface-2`, `surface-3` as flat entries
    - Map `pos.background`, `pos.card`, `pos.accent`
    - Map `status.empty`, `status.ordering`, `status.served`, `status.billed`, `status.occupied`
    - Map `license.active`, `license.trial`, `license.expired`
    - Map `chart` object with keys 1–5
    - _Requirements: 4.2, 7.4, 8.3, 12.3_

- [x] 3. Checkpoint — Verify color foundation compiles
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create chart colors module
  - [x] 4.1 Create or verify `src/lib/chart-colors.ts` with `CHART_COLORS` and `CHART_COLORS_DARK` exports
    - Export `CHART_COLORS` with 5 hex values: indigo-600, green-600, amber-600, purple-600, sky-600
    - Export `CHART_COLORS_DARK` with 5 hex values: indigo-400, green-400, amber-400, purple-400, sky-400
    - Ensure dark variants have higher luminance than light variants
    - Add named semantic keys if not already present (e.g., `primary`, `success`, `warning`, `purple`, `info`)
    - Add neutral hex constants for axis/grid use: `CHART_NEUTRAL` light (`#e2e8f0`) and dark (`#334155`)
    - _Requirements: 9.1, 9.3, 9.4_

- [x] 5. Remediate double-opacity malformed classes
  - [x] 5.1 Fix double-opacity classes in POS files
    - Replace all `bg-secondary/5/50` → `bg-secondary/10`, `bg-secondary/60/50` → `bg-secondary/30`, `bg-primary/10/50` → `bg-primary/10` etc. in:
      - `src/pages/retail/operational/pos/RetailPOS.tsx`
      - `src/pages/retail/operational/pos/ProductGrid.tsx`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.7_

  - [x] 5.2 Fix double-opacity classes in store-profile modules
    - Remediate all double-opacity patterns in:
      - `src/pages/retail/management/store-profile/StoreProfileLayout.tsx`
      - `src/pages/retail/management/store-profile/modules/StoreInfrastructureModule.tsx`
      - `src/pages/retail/management/store-profile/modules/StoreSupplyConfigModule.tsx`
      - `src/pages/retail/management/store-profile/modules/StoreOperationalConfigModule.tsx`
      - `src/pages/retail/management/store-profile/modules/StoreIdentityModule.tsx`
      - `src/pages/retail/management/store-profile/modules/StoreChannelBindingModule.tsx`
      - `src/pages/retail/management/store-profile/modules/GlobalFleetDashboard.tsx`
      - `src/pages/retail/management/store-profile/CreateStoreDialog.tsx`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 5.3 Fix double-opacity classes in staff, pricing, and command modules
    - Remediate all double-opacity patterns in:
      - `src/pages/retail/management/ShiftControl.tsx`
      - `src/pages/retail/management/StaffAssignments.tsx`
      - `src/pages/retail/management/staff-assignments/components/StaffDetailsModal.tsx`
      - `src/pages/retail/management/staff-assignments/components/RoleModificationModal.tsx`
      - `src/pages/retail/management/pricing-promo-desk/components/AuditTrailModal.tsx`
      - `src/pages/retail/management/pricing-promo-desk/components/ApprovalMatrix.tsx`
      - `src/pages/retail/management/components/command/GlobalActivityFeed.tsx`
      - `src/pages/retail/management/command-center/LocationSwitcher.tsx`
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7_

- [x] 6. Checkpoint — Verify remediation and build
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Remediate Recharts CSS variable references
  - [x] 7.1 Fix Recharts color props in finance chart components
    - Replace all `hsl(var(--*))` in `stroke`, `fill`, `stopColor` props with hex literals from `CHART_COLORS` / `CHART_COLORS_DARK` in:
      - `src/pages/core/finance/components/CfoChartsSection.tsx`
      - `src/pages/core/finance/components/CtoChartsSection.tsx`
    - Import `CHART_COLORS` and `CHART_COLORS_DARK` from `@/lib/chart-colors`
    - Use `useTheme()` or dark-mode detection to swap color sets
    - Replace `hsl(var(--border))` / `hsl(var(--muted-foreground))` in axis/grid props with neutral hex constants
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 7.2 Fix Recharts color props in dashboard chart components
    - Replace all `hsl(var(--*))` in `stroke`, `fill`, `stopColor` props with hex literals in:
      - `src/components/dashboard/FinancialTrajectoryChart.tsx`
      - `src/components/dashboard/ArApWaterfallChart.tsx`
    - Import `CHART_COLORS` and `CHART_COLORS_DARK` from `@/lib/chart-colors`
    - Use `useTheme()` or dark-mode detection to swap color sets
    - Replace neutral variable references with hardcoded hex for axis/grid elements
    - _Requirements: 9.2, 9.6, 11.1, 11.2, 11.3, 11.4_

- [x] 8. Checkpoint — Verify full build and visual integrity
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Property-based and unit tests
  - [x] 9.1 Write property test: CSS Variable HSL Range Conformance
    - **Property 1: CSS Variable HSL Range Conformance**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**
    - Parse `index.css` and use `fast-check` to generate token names from required set
    - Assert each token's H, S, L values fall within design-specified ranges

  - [x] 9.2 Write property test: Semantic Color Token Completeness
    - **Property 2: Semantic Color Token Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
    - For each semantic name in {success, warning, destructive, info, muted, accent}, verify both `--{name}` and `--{name}-foreground` exist in both modes
    - Assert hue falls within semantically appropriate range

  - [x] 9.3 Write property test: WCAG AA Contrast for Semantic Pairs
    - **Property 3: WCAG AA Contrast for Semantic Pairs**
    - **Validates: Requirements 3.7**
    - Compute contrast ratio for each semantic foreground/background pair in dark mode
    - Assert ratio ≥ 4.5:1

  - [x] 9.4 Write property test: Surface Layer Visual Distinctness
    - **Property 4: Surface Layer Visual Distinctness**
    - **Validates: Requirements 4.3, 4.4**
    - Assert ΔL ≥ 2% between adjacent surfaces in light mode
    - Assert ΔL ≥ 3% between adjacent surfaces in dark mode

  - [x] 9.5 Write property test: shadcn/ui Variable Completeness
    - **Property 5: shadcn/ui Variable Completeness**
    - **Validates: Requirements 5.1, 5.2**
    - Verify all 27 required shadcn variables exist in both `:root` and `.dark`

  - [x] 9.6 Write property test: Tailwind Config Token Mapping Completeness
    - **Property 6: Tailwind Config Token Mapping Completeness**
    - **Validates: Requirements 5.3, 5.4, 6.1, 6.2**
    - Parse `tailwind.config.ts` and assert all required tokens are mapped
    - Assert no `white` or `slate` override exists

  - [x] 9.7 Write property test: Status Color Distinguishability
    - **Property 7: Status Color Distinguishability**
    - **Validates: Requirements 8.2, 8.4**
    - For each pair of status colors, assert ΔH ≥ 30° or ΔL ≥ 15%

  - [x] 9.8 Write property test: No CSS Variable References in Recharts SVG Props
    - **Property 8: No CSS Variable References in Recharts SVG Props**
    - **Validates: Requirements 9.2, 9.6, 11.1, 11.2, 11.3, 11.4**
    - Scan Recharts files for `hsl(var(--` in stroke/fill/stopColor props
    - Assert zero matches

  - [x] 9.9 Write property test: No Double-Opacity Class Patterns
    - **Property 9: No Double-Opacity Class Patterns**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7**
    - Scan all `.tsx` files under `src/` for regex `(bg|text|border|ring)-[\w-]+/\d+/\d+`
    - Assert zero matches

  - [x] 9.10 Write property test: Dark Chart Variants Brighter Than Light
    - **Property 10: Dark Chart Variants Brighter Than Light**
    - **Validates: Requirements 9.4**
    - For each chart color index 1–5, assert dark hex luminance > light hex luminance

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major phase
- Property tests validate universal correctness properties from the design document
- The chart-colors module may already exist — task 4.1 verifies and updates it as needed
- All 17+ remediation files are split across 3 sub-tasks by module area to keep each task focused
- Recharts remediation requires theme-aware color selection via `useTheme()` hook

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "4.1"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 4, "tasks": ["7.1", "7.2"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8", "9.9", "9.10"] }
  ]
}
```
