# Requirements Document

## Introduction

The Zenvix Business Flow Suite v2 has a broken color system resulting from a mechanical find-and-replace operation that converted hardcoded Tailwind palette classes into semantic token references. This produced three categories of defects: (1) malformed double-opacity Tailwind classes (e.g., `bg-secondary/5/50`), (2) undefined CSS variables (e.g., `--pos-background` references that were never defined), and (3) Recharts chart components that receive CSS variable strings like `hsl(var(--primary))` which Recharts cannot resolve because it renders to SVG outside the browser CSS cascade.

This spec defines a complete, clean color system for the app — covering palette definition, CSS variable declarations, Tailwind config alignment, semantic token coverage, and targeted file-by-file repairs.

## Glossary

- **Color_System**: The combination of CSS custom property definitions in `index.css`, the Tailwind `extend.colors` config in `tailwind.config.ts`, and component-level color class usage across `src/`
- **Semantic_Token**: A named color that communicates intent (e.g., `--primary`, `--success`) rather than a raw palette value (e.g., `blue-600`)
- **Surface_Layer**: One of three background depth levels — `surface-1` (page), `surface-2` (card/panel), `surface-3` (inset/input) — used to create visual hierarchy
- **Double_Opacity_Class**: A malformed Tailwind class containing two slash-opacity suffixes, e.g., `bg-secondary/5/50`, which Tailwind cannot parse and generates no CSS for
- **Chart_Color**: A hex color value used in a Recharts component `stroke`, `fill`, or `stopColor` prop — must be a literal hex string, not a CSS variable reference
- **CSS_Variable**: A custom property defined in `:root` or `.dark` in `index.css` using the pattern `--name: H S% L%` (bare HSL triplet, consumed by Tailwind as `hsl(var(--name))`)
- **shadcn_Token**: A CSS variable consumed by shadcn/ui's component library — must remain defined in `index.css` for shadcn components to render correctly
- **POS_Module**: The retail point-of-sale screens under `src/layouts/POSLayout.tsx` and `src/pages/retail/operational/pos/`
- **FNB_Status_Color**: One of five table-state colors (`empty`, `ordering`, `served`, `billed`, `occupied`) used in the FNB module's table management UI
- **Recharts_File**: Any `.tsx` file that imports from `"recharts"` and passes color values directly to SVG props

## Requirements

### Requirement 1: Palette Definition — Light Mode

**User Story:** As a designer, I want a warm, professional light-mode palette with amber/coral primary accent and warm cream surfaces, so that the app feels approachable and distinctive during daytime use.

#### Acceptance Criteria

1. THE Color_System SHALL define a `--primary` CSS variable for light mode using an amber/coral hue in the range H: 30–45, S: 85–100%, L: 50–58%
2. THE Color_System SHALL define a `--primary-foreground` CSS variable for light mode as near-white (L ≥ 95%) to ensure contrast on the primary color
3. THE Color_System SHALL define three Surface_Layer variables for light mode: `--surface-1` as a warm off-white (H: 35–45, S: 20–30%, L: 97–99%), `--surface-2` as pure white (0 0% 100%), and `--surface-3` as a warm light cream (H: 35–45, S: 15–25%, L: 93–96%)
4. THE Color_System SHALL define `--foreground` for light mode as a near-black dark text (L ≤ 8%) with sufficient contrast ratio against all three surface layers
5. THE Color_System SHALL define `--muted-foreground` for light mode at L: 35–45% to provide readable secondary text that does not compete with primary content
6. THE Color_System SHALL define `--border` and `--input` for light mode as warm light gray (H: 35–45, S: 15–25%, L: 88–92%)
7. THE Color_System SHALL define `--secondary` for light mode as a warm light tint (H: 35–45, S: 15–25%, L: 92–96%) and `--secondary-foreground` as a dark foreground (L ≤ 8%)

### Requirement 2: Palette Definition — Dark Mode

**User Story:** As a designer, I want a cool, professional dark-mode palette with deep navy backgrounds and blue-purple accents, so that the app feels premium and comfortable for extended use at night.

#### Acceptance Criteria

1. THE Color_System SHALL define `--background` for dark mode as a deep navy (H: 222–228, S: 47–60%, L: 3–6%)
2. THE Color_System SHALL define a `--primary` CSS variable for dark mode using a cool blue-purple hue (H: 240–250, S: 70–80%, L: 60–68%) that reads clearly against dark surfaces
3. THE Color_System SHALL define three Surface_Layer variables for dark mode: `--surface-1` matching `--background`, `--surface-2` slightly lighter (L +3–5%), and `--surface-3` slightly lighter still (L +7–10%)
4. THE Color_System SHALL define `--foreground` for dark mode as near-white (L ≥ 96%) for high contrast against all surface layers
5. THE Color_System SHALL define `--muted-foreground` for dark mode at L: 65–75% for legible secondary text
6. THE Color_System SHALL define `--border` and `--input` for dark mode as subtle dark borders (H: 215–225, S: 30–40%, L: 13–18%)
7. THE Color_System SHALL define `--secondary` for dark mode as a dark navy tint (H: 215–225, S: 30–40%, L: 10–14%) and `--secondary-foreground` as near-white (L ≥ 96%)

### Requirement 3: Semantic Color Tokens

**User Story:** As a developer, I want a complete set of named semantic tokens for all intent-based UI states, so that I can apply colors by meaning without guessing which palette value to use.

#### Acceptance Criteria

1. THE Color_System SHALL define `--success` / `--success-foreground` tokens for both `:root` and `.dark` representing a green hue suitable for positive states and confirmations
2. THE Color_System SHALL define `--warning` / `--warning-foreground` tokens for both `:root` and `.dark` representing an amber hue suitable for caution states
3. THE Color_System SHALL define `--destructive` / `--destructive-foreground` tokens for both `:root` and `.dark` representing a red hue suitable for errors and irreversible actions
4. THE Color_System SHALL define `--info` / `--info-foreground` tokens for both `:root` and `.dark` representing a cyan/sky hue suitable for informational states
5. THE Color_System SHALL define `--muted` / `--muted-foreground` tokens for both `:root` and `.dark`
6. THE Color_System SHALL define `--accent` / `--accent-foreground` tokens for both `:root` and `.dark`
7. WHEN `--warning-foreground` is used on a `--warning` background in dark mode, THE Color_System SHALL ensure the foreground color achieves WCAG AA contrast (4.5:1 for normal text)

### Requirement 4: Surface System

**User Story:** As a developer, I want three named surface layers that create visual depth, so that I can stack cards, panels, and inputs without hardcoding background colors.

#### Acceptance Criteria

1. THE Color_System SHALL define `--surface-1`, `--surface-2`, and `--surface-3` as CSS variables in both `:root` and `.dark` blocks
2. THE Color_System SHALL map `surface-1`, `surface-2`, `surface-3` as Tailwind color tokens in `tailwind.config.ts` so classes like `bg-surface-2` are usable
3. WHEN a card sits on `surface-1`, THE Color_System SHALL make `surface-2` visually distinct from `surface-1` (ΔL ≥ 2% in light mode, ΔL ≥ 3% in dark mode)
4. WHEN an input sits inside a card on `surface-2`, THE Color_System SHALL make `surface-3` visually distinct from `surface-2` (ΔL ≥ 2% in light mode, ΔL ≥ 3% in dark mode)

### Requirement 5: shadcn/ui CSS Variable Compatibility

**User Story:** As a developer, I want all shadcn/ui component CSS variables to remain defined, so that shadcn components like Dialog, Select, Popover, and Sidebar continue to render with correct colors.

#### Acceptance Criteria

1. THE Color_System SHALL define all shadcn/ui required variables in both `:root` and `.dark`: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`
2. THE Color_System SHALL define all sidebar CSS variables in both `:root` and `.dark`: `--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`
3. THE tailwind.config.ts `extend.colors` SHALL map all shadcn tokens (border, input, ring, background, foreground, primary, secondary, destructive, muted, accent, popover, card, sidebar) to `hsl(var(--token-name))` expressions
4. WHEN the `white` color override is present in `tailwind.config.ts`, THE Color_System SHALL remove it so that `text-white` and `bg-white` resolve to literal white (`#ffffff`) and not `hsl(var(--surface-2))`

### Requirement 6: Tailwind Config — White and Slate Override Fix

**User Story:** As a developer, I want `text-white` to render actual white text (not a surface color), so that components that intentionally use white text on dark/colored backgrounds display correctly.

#### Acceptance Criteria

1. THE tailwind.config.ts SHALL NOT contain `white: "hsl(var(--surface-2))"` in the `extend.colors` block — this entry SHALL be removed
2. THE tailwind.config.ts SHALL NOT contain a `slate` color override object that remaps slate shades to CSS variable references — this entire block SHALL be removed
3. WHEN the `white` and `slate` overrides are removed, THE Color_System SHALL verify that all existing uses of `text-white` in the codebase resolve to `#ffffff` as intended
4. WHEN the `slate` override is removed, THE Color_System SHALL verify that existing uses of `border-slate-100`, `border-slate-200` etc. revert to Tailwind's built-in slate palette values (which is the correct behavior for these utility classes)

### Requirement 7: POS-Specific CSS Variables

**User Story:** As a developer, I want `--pos-background`, `--pos-card`, and `--pos-accent` to be defined in `index.css`, so that the POS layout and components that reference these tokens compile and render without errors.

#### Acceptance Criteria

1. THE Color_System SHALL define `--pos-background` in both `:root` and `.dark` using an appropriate surface value (e.g., matching `--surface-1` or a slightly warm tint in light mode, `--background` equivalent in dark mode)
2. THE Color_System SHALL define `--pos-card` in both `:root` and `.dark` as a card-level surface (matching `--surface-2` or `--card`)
3. THE Color_System SHALL define `--pos-accent` in both `:root` and `.dark` matching the `--primary` token so POS elements use the brand accent
4. THE tailwind.config.ts SHALL map `pos.background`, `pos.card`, and `pos.accent` to their respective CSS variable references so `bg-pos-background`, `bg-pos-card`, and `text-pos-accent` are valid utility classes

### Requirement 8: FNB Status Colors

**User Story:** As a developer, I want five table-status color tokens (empty, ordering, served, billed, occupied) defined and mapped in Tailwind, so that the FNB module's table grid renders meaningful status indicators.

#### Acceptance Criteria

1. THE Color_System SHALL define `--status-empty`, `--status-ordering`, `--status-served`, `--status-billed`, and `--status-occupied` in both `:root` and `.dark`
2. THE Color_System SHALL assign semantically appropriate hues: empty → neutral gray, ordering → amber/yellow, served → green, billed → blue/cyan, occupied → primary brand color
3. THE tailwind.config.ts SHALL map `status.empty`, `status.ordering`, `status.served`, `status.billed`, and `status.occupied` to their respective `hsl(var(--status-*))` references
4. WHEN status colors are used as backgrounds, THE Color_System SHALL ensure each status color is visually distinguishable from the others in both light and dark mode

### Requirement 9: Chart Colors for Recharts

**User Story:** As a developer, I want five named hex chart colors that are hardcoded as constants, so that Recharts SVG renders them correctly without depending on the CSS variable cascade.

#### Acceptance Criteria

1. THE Color_System SHALL provide a `CHART_COLORS` constant exported from a shared file (e.g., `src/lib/chart-colors.ts`) containing five hardcoded hex color values
2. WHEN a Recharts component uses `stroke`, `fill`, or `stopColor` props, THE Recharts_File SHALL reference `CHART_COLORS[n]` or a direct hex literal — never `hsl(var(--chart-n))`
3. THE chart hex colors SHALL be visually consistent with the overall brand palette: chart-1 maps to a primary-tone blue/indigo, chart-2 to green/success-tone, chart-3 to amber/warning-tone, chart-4 to purple/violet-tone, chart-5 to cyan/info-tone
4. THE chart hex colors SHALL be defined separately for light mode preference and dark mode preference, with the dark variants being brighter (higher L%) to read against dark backgrounds
5. THE `--chart-1` through `--chart-5` CSS variables SHALL remain defined in `index.css` for any non-Recharts usage (e.g., CSS gradients or utility classes), with HSL values aligned to the hex chart colors
6. WHEN SVG `<linearGradient>` `stopColor` props inside Recharts `<defs>` reference color, THE Recharts_File SHALL use hex literals (not `hsl(var(...))`) for the `stopColor` attribute

### Requirement 10: Double-Opacity Class Remediation

**User Story:** As a developer, I want all malformed double-opacity Tailwind classes removed from the codebase, so that those elements actually receive background/text colors instead of rendering as transparent.

#### Acceptance Criteria

1. THE Color_System SHALL replace every instance of a Double_Opacity_Class pattern `{utility}-{token}/{n1}/{n2}` with a valid single-opacity class `{utility}-{token}/{n1}` or the semantically correct replacement
2. WHEN `bg-secondary/5/50` is used as a subtle tinted background, THE remediation SHALL replace it with `bg-secondary/10` (a low-opacity secondary tint)
3. WHEN `bg-secondary/60/50` is used as a medium tinted surface, THE remediation SHALL replace it with `bg-secondary/30` or `bg-muted/50`
4. WHEN `bg-primary/10/50` is used as a faint primary tint, THE remediation SHALL replace it with `bg-primary/10`
5. WHEN `bg-success/10/50` is used as a faint success tint, THE remediation SHALL replace it with `bg-success/10`
6. WHEN `text-primary/10/70` is used as dimmed primary text, THE remediation SHALL replace it with `text-primary/60`
7. THE following files SHALL have all Double_Opacity_Class patterns remediated:
   - `src/pages/retail/operational/pos/RetailPOS.tsx`
   - `src/pages/retail/operational/pos/ProductGrid.tsx`
   - `src/pages/retail/management/ShiftControl.tsx`
   - `src/pages/retail/management/StaffAssignments.tsx`
   - `src/pages/retail/management/store-profile/StoreProfileLayout.tsx`
   - `src/pages/retail/management/store-profile/modules/StoreInfrastructureModule.tsx`
   - `src/pages/retail/management/store-profile/modules/StoreSupplyConfigModule.tsx`
   - `src/pages/retail/management/store-profile/modules/StoreOperationalConfigModule.tsx`
   - `src/pages/retail/management/store-profile/modules/StoreIdentityModule.tsx`
   - `src/pages/retail/management/store-profile/modules/StoreChannelBindingModule.tsx`
   - `src/pages/retail/management/store-profile/modules/GlobalFleetDashboard.tsx`
   - `src/pages/retail/management/store-profile/CreateStoreDialog.tsx`
   - `src/pages/retail/management/staff-assignments/components/StaffDetailsModal.tsx`
   - `src/pages/retail/management/staff-assignments/components/RoleModificationModal.tsx`
   - `src/pages/retail/management/pricing-promo-desk/components/AuditTrailModal.tsx`
   - `src/pages/retail/management/pricing-promo-desk/components/ApprovalMatrix.tsx`
   - `src/pages/retail/management/components/command/GlobalActivityFeed.tsx`
   - `src/pages/retail/management/command-center/LocationSwitcher.tsx`

### Requirement 11: Recharts CSS Variable Remediation

**User Story:** As a developer, I want all `hsl(var(--...))` references inside Recharts SVG props replaced with literal values, so that charts render their colors correctly in all browsers.

#### Acceptance Criteria

1. THE following Recharts_Files SHALL have all `stroke="hsl(var(--*))"`, `fill="hsl(var(--*))"`, and `stopColor="hsl(var(--*))"` prop values replaced with hardcoded hex equivalents from `CHART_COLORS` or semantic hex constants:
   - `src/pages/core/finance/components/CfoChartsSection.tsx`
   - `src/pages/core/finance/components/CtoChartsSection.tsx`
   - `src/components/dashboard/FinancialTrajectoryChart.tsx`
   - `src/components/dashboard/ArApWaterfallChart.tsx`
2. WHEN `hsl(var(--primary))` is used in a Recharts prop, THE remediation SHALL replace it with the primary chart hex color (`CHART_COLORS[0]` or equivalent)
3. WHEN `hsl(var(--success))` is used in a Recharts prop, THE remediation SHALL replace it with the success chart hex color (`CHART_COLORS[1]` or equivalent)
4. WHEN `hsl(var(--border))` or `hsl(var(--muted-foreground))` is used in a Recharts axis/grid prop, THE remediation SHALL replace it with a hardcoded neutral hex that works on both light and dark backgrounds

### Requirement 12: License Color Tokens

**User Story:** As a developer, I want `--license-active`, `--license-trial`, and `--license-expired` tokens defined, so that license status indicators across the admin UI render correctly.

#### Acceptance Criteria

1. THE Color_System SHALL define `--license-active`, `--license-trial`, and `--license-expired` in both `:root` and `.dark`
2. THE Color_System SHALL assign semantically appropriate values: active → success hue, trial → warning hue, expired → destructive hue
3. THE tailwind.config.ts SHALL map `license.active`, `license.trial`, and `license.expired` to `hsl(var(--license-*))` so utility classes are available
