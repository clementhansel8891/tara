# Bugfix Requirements Document

## Introduction

The application's UI coloring is inconsistent. Across many pages, tabs, and components the code uses raw Tailwind palette classes (`text-red-*`, `bg-amber-*`, `text-emerald-*`, `bg-sky-*`, `border-indigo-*`, etc., including opacity variants like `/10`, `/20`) and inline hex colors (`style={{ color: "#10b981" }}`) instead of the global theme tokens defined in `src/index.css` (`:root` for light, `.dark` for dark). Because Tailwind also overrides `white` and the `slate` scale to resolve to theme HSL variables, mixing raw palette classes with theme tokens produces visuals that drift between light and dark mode and read inconsistently page-to-page.

A previous ad-hoc attempt to fix this made things worse. A mechanical 1:1 find-and-replace script (`scripts/fix-theme-colors.cjs`) collapsed every palette color onto a single semantic token (amber→warning, sky→info, indigo/blue→primary, emerald/green→success, rose→destructive). This destroyed intentional categorical/decorative color variety (for example, `GlobalKpiRow.tsx` used a distinct accent per KPI so each card was visually distinguishable; collapsing them made the cards look identical and "weird"), created hex/token mismatches (inline `style` hex left untouched while surrounding classes were swapped), and gave decorative accents accidental semantic meaning (cards reading as alerts/warnings). The script also did not introduce the bug, but a pre-existing invalid Tailwind class `bg-primary/50/10` remains in the code.

This bugfix re-plans the work by first understanding the global theme and how each page consumes it, then defining a documented color taxonomy that distinguishes **semantic** color (status meaning) from **categorical/decorative** color (visual variety), and applying it in a context-aware, per-file manner rather than via a blanket script. The damaging uncommitted changes from the failed attempt are reverted before the correct fix is applied.

The bug is triggered by any rendered UI element whose color is specified outside the global theme, or whose color was incorrectly collapsed onto a semantic token. The fix is correct when colors resolve to the global theme, semantic and categorical colors are used appropriately, both light and dark modes render correctly, no hex/token mismatches remain, and intentional visual distinguishability is preserved.

## Bug Analysis

### Current Behavior (Defect)

The following describes what currently happens. Clauses 1.1–1.4 describe the original inconsistency bug; clauses 1.5–1.8 describe the regressions introduced by the failed previous attempt.

1.1 WHEN a page or component renders an element styled with a raw Tailwind palette class (e.g. `text-red-500`, `bg-amber-500/10`, `text-emerald-400`, `bg-sky-500/20`, `border-indigo-500/30`) THEN the system renders a color that does not come from the global theme tokens and does not adapt consistently between light and dark mode.

1.2 WHEN a component sets a color via an inline hex value (e.g. `style={{ color: "#10b981" }}` or `style={{ backgroundColor: "#6366f1" }}` or a `--progress-foreground` hex) THEN the system renders a hardcoded color that ignores the global theme and does not change with the active mode.

1.3 WHEN the same conceptual status (e.g. success, error, warning, info) is shown on different pages THEN the system renders it with different colors because each page hardcodes its own palette choice, so coloring is not uniform across pages, tabs, and components.

1.4 WHEN an element uses the invalid Tailwind class `bg-primary/50/10` (present in `OperationalGateway.tsx`, `SelfServiceKiosk.tsx`, and `ShiftCloseTerminal.tsx`) THEN the system fails to apply the intended background because the class does not resolve to a valid utility.

1.5 WHEN `GlobalKpiRow.tsx` (and similar multi-item cards) renders after the failed find-replace THEN the system shows multiple cards with the same collapsed token accent (e.g. several `bg-primary/20`), so cards that were intentionally distinguishable now look identical.

1.6 WHEN a component's surrounding accent/border classes were swapped to semantic tokens but its inline hex icon color was left unchanged (e.g. `accent: "bg-success/20"` next to `color: "#10b981"`, or `border: "hover:border-primary/30"` next to `color: "#6366f1"`) THEN the system renders a visible clash between the token color and the hex color.

1.7 WHEN a decorative/categorical accent was mechanically mapped to a semantic token (e.g. a neutral decorative blue mapped to `primary`, or a decorative amber mapped to `warning`) THEN the system makes the element read as a semantic state (action/caution/alert) that it does not actually represent.

1.8 WHEN the failed attempt produced malformed opacity tokens (e.g. `bg-muted/40/20`) THEN the system fails to apply the intended background because the class is invalid.

### Expected Behavior (Correct)

2.1 WHEN a page or component renders an element that previously used a raw Tailwind palette class THEN the system SHALL render its color from a global theme token (semantic token for status meaning, or a categorical token such as `chart-1..5` / an intentionally defined categorical palette for decorative variety) so the color resolves to `src/index.css` variables.

2.2 WHEN a component previously set a color via an inline hex value THEN the system SHALL source that color from a global theme token or theme CSS variable (e.g. `hsl(var(--success))`) so it adapts with the active mode, with no hex value left that conflicts with a sibling token.

2.3 WHEN the same conceptual status is shown on different pages THEN the system SHALL render it with the same semantic token consistently (success→`success`, error→`destructive`, warning→`warning`, info→`info`, brand/primary action→`primary`), so coloring is uniform across pages, tabs, and components.

2.4 WHEN an element previously used the invalid class `bg-primary/50/10` THEN the system SHALL use a valid single-opacity utility (e.g. `bg-primary/10`) that resolves correctly.

2.5 WHEN a multi-item card group (e.g. `GlobalKpiRow.tsx`) is intended to be visually distinguishable THEN the system SHALL assign each item a distinct categorical theme token (e.g. `chart-1..5` or a defined categorical palette) so the items remain distinguishable while still resolving to the global theme.

2.6 WHEN an element has both an accent/border class and an icon/graphic color THEN the system SHALL source both from the same theme token (no token/hex mismatch), so the icon and its surrounding accent agree.

2.7 WHEN a color is decorative/categorical rather than a status indicator THEN the system SHALL use a categorical token (not a semantic token), so decorative elements do not falsely read as success/warning/error/info states.

2.8 WHEN any element is rendered in light mode and in dark mode THEN the system SHALL render legible, theme-consistent colors in both modes (since all tokens are defined for both `:root` and `.dark`).

2.9 WHEN the project is built/linted after the fix THEN the system SHALL contain no invalid or malformed Tailwind color classes (e.g. `bg-primary/50/10`, `bg-muted/40/20`).

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an element already uses a global theme token (e.g. `text-primary`, `bg-success/10`, `text-muted-foreground`, `border-border`, `bg-card`) THEN the system SHALL CONTINUE TO render it exactly as before.

3.2 WHEN an element intentionally conveys a true semantic status that already maps to the correct token (e.g. an error message using `text-destructive`, a success badge using `text-success`) THEN the system SHALL CONTINUE TO render that semantic color unchanged.

3.3 WHEN a chart or visualization already consumes `chart-1..5` (or other theme tokens) for its series colors THEN the system SHALL CONTINUE TO render those series colors unchanged.

3.4 WHEN layout, spacing, typography, opacity intent, glassmorphism effects, animations, and non-color styling are rendered THEN the system SHALL CONTINUE TO render them unchanged (only color sourcing is altered).

3.5 WHEN a page or component was not affected by the inconsistency or the failed attempt (already theme-correct) THEN the system SHALL CONTINUE TO render identically, with no visual diff.

3.6 WHEN the application toggles between light and dark mode on already-correct elements THEN the system SHALL CONTINUE TO switch colors as it did before.
