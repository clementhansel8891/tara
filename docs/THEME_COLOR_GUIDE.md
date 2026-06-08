# ZENVIX THEME COLOR SYSTEM

## Overview

This document describes the unified color system for the Zenvix Business Flow Suite v2. All colors MUST use HSL variables defined in `src/index.css` to ensure consistency across light and dark modes.

## Design System Principles

- **Vibrant**: High-contrast, energetic color palette
- **Glassmorphic**: Translucent layers with backdrop blur
- **Professional**: Clean, modern, enterprise-grade aesthetics
- **Accessible**: WCAG 2.1 AA compliant contrast ratios

## Color Variables

### Core Palette

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--background` | `210 50% 98%` | `225 60% 3%` | Page background |
| `--foreground` | `224 71% 4%` | `210 40% 98%` | Primary text |
| `--surface-1` | `210 50% 98%` | `225 60% 3%` | Card backgrounds |
| `--surface-2` | `0 0% 100%` | `224 71% 6%` | Input backgrounds |
| `--surface-3` | `215 25% 95%` | `224 71% 10%` | Secondary surfaces |

### Semantic Colors

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--primary` | `243 85% 55%` | `243 75% 65%` | Main brand color, primary actions |
| `--secondary` | `215 20% 94%` | `217 33% 12%` | Secondary actions, subtle elements |
| `--success` | `142 76% 36%` | `142 70% 50%` | Success states, positive actions |
| `--warning` | `38 92% 50%` | `38 92% 60%` | Warnings, attention needed |
| `--destructive` | `0 84% 60%` | `0 72% 51%` | Errors, destructive actions |
| `--info` | `199 89% 48%` | `199 89% 60%` | Informational elements |

### Text Colors

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--muted-foreground` | `215 16% 35%` | `215 15% 75%` | Secondary text |
| `--label-foreground` | `215 16% 25%` | `215 15% 85%` | Labels, headers |

### Border Colors

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--border` | `215 20% 90%` | `217 33% 15%` | Component borders |
| `--input` | `215 20% 90%` | `217 33% 15%` | Input borders |

## Theme-Aware Components

### Status Badge

Use `StatusBadge` for status indicators that need to be theme-aware:

```tsx
import { StatusBadge } from "@/components/ui/status-badge";

// Automatic status detection
<StatusBadge status="approved" />
<StatusBadge status="pending" />
<StatusBadge status="rejected" />

// Manual variant specification
<StatusBadge variant="approved" />
<StatusBadge variant="warning" />
<StatusBadge variant="error" />
```

**Available variants:**
- `approved` / `success` - Green, success state
- `rejected` / `error` - Red, error state
- `pending` / `warning` - Amber, warning state
- `processing` / `info` - Blue, processing state
- `completed` - Green, completed state
- `failed` - Red, failed state
- `cancelled` - Gray, cancelled state

### Status Indicator

Use `StatusIndicator` for small status dots and pills:

```tsx
import { StatusIndicator, StatusDot, StatusPill } from "@/components/ui/status-indicator";

// Small dot
<StatusIndicator status="online" size="sm" />

// Status dot with glow
<StatusDot status="warning" />

// Full pill with text
<StatusPill status="processing" />
```

**Available sizes:**
- `sm` - 8x8px dot
- `md` - 12x12px dot
- `lg` - 16x16px dot

### Status Card

Use `StatusCard` for cards that display status information:

```tsx
import { StatusCard } from "@/components/ui/status-card";

<StatusCard 
  status="online"
  title="Device Status"
  description="System operational"
  icon={<Monitor className="w-5 h-5" />}
/>
```

**Available variants:**
- `online` / `success` - Green border, success styling
- `maintenance` / `warning` - Amber border, warning styling
- `offline` / `error` - Gray border, error styling

## Color Utility Functions

### getStatusBadgeClasses(status: string)

Returns the appropriate badge classes for a given status string:

```tsx
import { getStatusBadgeClasses } from "@/lib/theme-colors";

const classes = getStatusBadgeClasses("approved");
// Returns: { bg: 'bg-success/20', text: 'text-success', border: 'border-success/30' }
```

### getStatusIndicatorClasses(status: string)

Returns the appropriate indicator classes for a given status string:

```tsx
import { getStatusIndicatorClasses } from "@/lib/theme-colors";

const classes = getStatusIndicatorClasses("online");
// Returns: { bg: 'bg-success', text: 'text-success', glow: 'shadow-success/50' }
```

### getDeviceStatusCardClasses(status: string)

Returns the appropriate card classes for a given status string:

```tsx
import { getDeviceStatusCardClasses } from "@/lib/theme-colors";

const classes = getDeviceStatusCardClasses("online");
// Returns: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' }
```

## Migration Guide

### Before (Hardcoded Colors)

```tsx
// ❌ BAD: Hardcoded colors
<div className="text-red-500">Error</div>
<div className="bg-emerald-500/10">Success</div>
<div className="text-amber-600">Warning</div>
<div className="bg-blue-500/10">Info</div>
```

### After (Theme-Aware)

```tsx
// ✅ GOOD: Theme-aware colors
<StatusBadge status="error" />
<StatusBadge status="success" />
<StatusBadge status="warning" />
<StatusBadge status="info" />

// Or using utility functions
<div className={getStatusBadgeClasses("error").text}>Error</div>
<div className={getStatusBadgeClasses("success").bg}>Success</div>
```

### Component Migration Examples

#### Before

```tsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-red-500" />
  <span className="text-red-500">Error</span>
</div>
```

#### After

```tsx
<div className="flex items-center gap-2">
  <StatusIndicator status="error" size="sm" />
  <span className="text-destructive">Error</span>
</div>
```

#### Before

```tsx
<div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
  <div className="text-emerald-500">Success</div>
</div>
```

#### After

```tsx
<StatusCard status="success" title="Success" />
```

## Color Reference

### Status Color Mapping

| Status | Text Color | Background | Border |
|--------|------------|------------|--------|
| Success | `text-success` | `bg-success/10` | `border-success/20` |
| Warning | `text-warning` | `bg-warning/10` | `border-warning/20` |
| Error | `text-destructive` | `bg-destructive/10` | `border-destructive/20` |
| Info | `text-info` | `bg-info/10` | `border-info/20` |
| Primary | `text-primary` | `bg-primary/10` | `border-primary/20` |
| Muted | `text-muted-foreground` | `bg-muted/10` | `border-muted/20` |

### Badge Color Mapping

| Badge Type | Background | Text | Border |
|------------|------------|------|--------|
| Approved | `bg-success/20` | `text-success` | `border-success/30` |
| Rejected | `bg-destructive/20` | `text-destructive` | `border-destructive/30` |
| Pending | `bg-warning/20` | `text-warning` | `border-warning/30` |
| Processing | `bg-info/20` | `text-info` | `border-info/30` |
| Completed | `bg-success/20` | `text-success` | `border-success/30` |
| Failed | `bg-destructive/20` | `text-destructive` | `border-destructive/30` |
| Cancelled | `bg-muted/20` | `text-muted-foreground` | `border-muted/30` |

## Best Practices

1. **Always use theme-aware components** when displaying status information
2. **Never use hardcoded colors** like `text-red-500`, `bg-emerald-600`
3. **Use semantic status strings** like "success", "warning", "error" instead of custom values
4. **Test in both light and dark modes** to ensure proper contrast
5. **Use the utility functions** for dynamic status-based styling

## Troubleshooting

### Colors not updating in dark mode?

Ensure you're using HSL variables (`hsl(var(--variable))`) and not hardcoded RGB values.

### Badge colors not matching?

Use the `StatusBadge` component with the `status` prop instead of manually specifying classes.

### Text contrast issues?

Use `text-foreground` for primary text and `text-muted-foreground` for secondary text.

## Additional Resources

- `src/index.css` - Main theme variables
- `src/lib/theme-colors.ts` - Color utility functions
- `src/components/ui/status-badge.tsx` - Status badge component
- `src/components/ui/status-indicator.tsx` - Status indicator component
- `src/components/ui/status-card.tsx` - Status card component
