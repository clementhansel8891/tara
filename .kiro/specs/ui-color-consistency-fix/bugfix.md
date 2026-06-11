# Bugfix Requirements Document

## Introduction

Components across the Zenvix Business Flow Suite v2 application use hardcoded Tailwind CSS color classes (e.g. `text-blue-600`, `bg-emerald-600`, `bg-indigo-900`) instead of the design token system defined in `src/index.css`. Because these raw Tailwind colors are static values that don't respond to the active theme, the application fails WCAG AA contrast requirements in both modes and becomes visually broken in dark mode. The audit identified over 5,400 Layer B (hardcoded color) violations and thousands of Layer A (contrast ratio) failures across 45 pages, with the most severe concentration on `core-it` (4,977 violations), `core-security` dark mode (4,963 contrast failures), and `core-dashboard` (112 violations). This fix replaces all hardcoded color classes with their corresponding design token equivalents so that colors adapt correctly to light/dark mode and meet WCAG AA contrast thresholds throughout.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a component uses a hardcoded text color class (e.g. `text-blue-600`, `text-indigo-400`, `text-indigo-600`, `text-indigo-300`, `text-emerald-600`, `text-emerald-500`, `text-rose-600`) THEN the system renders a fixed color value that does not change when the theme switches between light and dark mode

1.2 WHEN a component uses a hardcoded background color class (e.g. `bg-indigo-600`, `bg-emerald-600`, `bg-indigo-900`) THEN the system renders a static background that does not adapt to the active theme, causing color combinations that fail WCAG AA contrast requirements

1.3 WHEN a component uses a hardcoded border color class (e.g. `border-blue-*`, `border-indigo-*`, `border-gray-*`) THEN the system renders a static border color that does not respond to theme changes

1.4 WHEN the application is rendered in dark mode and components carry hardcoded color classes THEN the system produces contrast ratios below the WCAG AA threshold of 4.5:1 for normal text and 3:1 for large text, at a rate 3–5× higher than in light mode

1.5 WHEN the `core-it` page renders its data table or chart component THEN the system produces approximately 4,923 light-mode and 9,879 dark-mode contrast violations driven by the `text-blue-600` class appearing ~4,967 times

1.6 WHEN the `core-security` page is rendered in dark mode THEN the system produces approximately 4,963 contrast violations due to hardcoded color classes that are not theme-aware

1.7 WHEN the `core-dashboard` page renders its charts and stat cards THEN the system produces approximately 98 light-mode and 108 dark-mode contrast violations from hardcoded color classes including `text-emerald-*`, `bg-indigo-*`, and `text-rose-*`

### Expected Behavior (Correct)

2.1 WHEN a component needs to express a primary/brand color in text THEN the system SHALL use the `text-primary` design token, which resolves to `hsl(var(--primary))` and adapts correctly to both light mode (`243 85% 55%`) and dark mode (`243 75% 65%`)

2.2 WHEN a component needs to express a success/positive color in text or background THEN the system SHALL use `text-success` / `bg-success` design tokens, which resolve to `hsl(var(--success))` and adapt to both light mode (`142 76% 36%`) and dark mode (`142 70% 50%`)

2.3 WHEN a component needs to express a destructive/error/danger color in text or background THEN the system SHALL use `text-destructive` / `bg-destructive` design tokens, which adapt between light mode (`0 84% 60%`) and dark mode (`0 72% 51%`)

2.4 WHEN a component needs to express a warning color in text or background THEN the system SHALL use `text-warning` / `bg-warning` design tokens, which adapt between light mode (`38 92% 50%`) and dark mode (`38 92% 60%`)

2.5 WHEN a component needs to express a subdued or secondary text color THEN the system SHALL use `text-muted-foreground`, which provides sufficient contrast in both light mode (`215 16% 35%`) and dark mode (`215 15% 75%`)

2.6 WHEN a component uses a background that was previously a hardcoded indigo/blue/violet/purple shade THEN the system SHALL use `bg-primary`, and when it was a hardcoded gray/zinc/neutral shade THEN the system SHALL use `bg-muted`

2.7 WHEN a component uses a border that was previously a hardcoded blue/indigo shade THEN the system SHALL use `border-primary`, and when it was a hardcoded gray/zinc shade THEN the system SHALL use `border-border`

2.8 WHEN any text element that previously failed WCAG AA contrast is updated to use design tokens THEN the system SHALL render that element with a contrast ratio of at least 4.5:1 for normal text and at least 3:1 for large text in both light and dark mode

2.9 WHEN the `core-it` page renders its data table or chart component after the fix THEN the system SHALL produce zero Layer B (hardcoded color) violations and zero Layer A (contrast) violations by using `text-primary` in place of `text-blue-600`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a component uses a design token class that was already correct before this fix (e.g. `text-foreground`, `bg-background`, `text-primary`, `bg-card`) THEN the system SHALL CONTINUE TO render those elements with the same appearance and contrast characteristics

3.2 WHEN the application is rendered in light mode after the fix THEN the system SHALL CONTINUE TO display all UI elements with the same semantic meaning and visual hierarchy as before (primary actions remain visually distinct, success states remain green-toned, destructive states remain red-toned)

3.3 WHEN theme-toggling from light to dark mode THEN the system SHALL CONTINUE TO switch themes without a page reload, and all design-token-based colors SHALL CONTINUE TO update instantly

3.4 WHEN components use Tailwind utility classes that are unrelated to color (e.g. spacing, typography sizing, layout, animation) THEN the system SHALL CONTINUE TO apply those classes without any change to their behavior or rendering

3.5 WHEN chart components (Recharts) use programmatic color values passed as props or inline styles rather than Tailwind class names THEN the system SHALL CONTINUE TO render those chart series colors without modification, as they are out of scope for class-based token replacement

3.6 WHEN `bg-orange-*` or `text-orange-*` classes appear in a context that was intentionally warning-style THEN the system SHALL CONTINUE TO convey the same warning semantic after being replaced with `bg-warning` / `text-warning`

3.7 WHEN `bg-orange-*` or `text-orange-*` classes appear in a context that was intentionally destructive-style THEN the system SHALL CONTINUE TO convey the same destructive semantic after being replaced with `bg-destructive` / `text-destructive`

---

## Bug Condition Derivation

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition(element)
  INPUT: element — a React component or JSX element with a className string
  OUTPUT: boolean

  // Returns true when the element carries at least one hardcoded Tailwind color class
  RETURN className CONTAINS ANY OF {
    "text-blue-*", "text-indigo-*", "text-violet-*", "text-purple-*",
    "text-emerald-*", "text-green-*",
    "text-red-*", "text-rose-*",
    "text-amber-*", "text-yellow-*",
    "text-orange-*",
    "text-gray-*", "text-zinc-*", "text-neutral-*", "text-slate-*",
    "bg-indigo-*", "bg-blue-*", "bg-violet-*", "bg-purple-*",
    "bg-emerald-*", "bg-green-*",
    "bg-red-*", "bg-rose-*",
    "bg-amber-*", "bg-yellow-*",
    "bg-orange-*",
    "bg-gray-*", "bg-zinc-*", "bg-neutral-*", "bg-slate-*",
    "border-blue-*", "border-indigo-*",
    "border-gray-*", "border-zinc-*"
  }
END FUNCTION
```

**Fix Checking Property:**
```pascal
// Property: Fix Checking — hardcoded color classes are replaced by design tokens
FOR ALL element WHERE isBugCondition(element) DO
  result ← render'(element)   // render after fix
  ASSERT className(result) CONTAINS NO hardcoded Tailwind color class
  ASSERT contrastRatio(result, activeTheme) >= 4.5  // normal text
  OR     contrastRatio(result, activeTheme) >= 3.0  // large text
END FOR
```

**Preservation Checking Property:**
```pascal
// Property: Preservation Checking — non-color classes and already-correct tokens are untouched
FOR ALL element WHERE NOT isBugCondition(element) DO
  ASSERT render(element) = render'(element)
END FOR
```
