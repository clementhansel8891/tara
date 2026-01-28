// ============================================================================
// CORE PAGE RESOLVER
// ============================================================================
//
// Purpose:
// - Resolve ALL Core pages
// - Core pages are ALWAYS active
// - No licensing
// - No module dependency
//
// Core represents office & administrative reality of all businesses.
//
// ============================================================================

/* ============================================================================ */
/* CORE PAGE TYPE                                                               */
/* ============================================================================ */

export interface CorePage {
  id: string;
  title: string;
  route: string;
  icon?: string;

  /**
   * Navigation grouping (e.g. "Office", "Administration")
   */
  section: "office" | "administration" | "system";

  /**
   * Whether page appears in navigation
   */
  visible: boolean;
}

/* ============================================================================ */
/* STATIC CORE PAGE DEFINITIONS                                                  */
/* ============================================================================ */
/**
 * These pages ALWAYS exist.
 * They represent baseline business reality.
 *
 * No tenant can disable these.
 */
const CORE_PAGES: readonly CorePage[] = Object.freeze([
  {
    id: "dashboard",
    title: "Dashboard",
    route: "/",
    icon: "dashboard",
    section: "office",
    visible: true,
  },
  {
    id: "organization",
    title: "Organization",
    route: "/organization",
    icon: "company",
    section: "administration",
    visible: true,
  },
  {
    id: "staff",
    title: "Staff",
    route: "/staff",
    icon: "users",
    section: "administration",
    visible: true,
  },
  {
    id: "reports",
    title: "Reports",
    route: "/reports",
    icon: "chart",
    section: "office",
    visible: true,
  },
  {
    id: "settings",
    title: "Settings",
    route: "/settings",
    icon: "settings",
    section: "system",
    visible: true,
  },
]);

/* ============================================================================ */
/* RESOLVER API                                                                 */
/* ============================================================================ */

/**
 * Resolve all Core pages.
 *
 * This function:
 * - Has NO parameters
 * - Has NO conditions
 * - Always returns the same result
 *
 * Core is non-negotiable infrastructure.
 */
export function resolveCorePages(): readonly CorePage[] {
  return CORE_PAGES;
}
