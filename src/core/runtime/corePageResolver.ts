// ============================================================================
// CORE PAGE RESOLVER (PHASE 3 — ROUTE CONTRACT)
// ============================================================================
//
// Purpose:
// - Resolve ALL Core pages
// - Core pages are ALWAYS active
// - Core pages are FIRST-CLASS routable contracts
//
// Rules:
// - Core pages MUST provide React components
// - Routes MUST live under /core/...
// - No tenant can disable Core
//
// ============================================================================

import type React from "react";

/* ============================================================================ */
/* IMPORT CORE PAGE COMPONENTS                                                  */
/* ============================================================================ */

import Dashboard from "@/pages/core/Dashboard";
import Staff from "@/pages/core/Staff";
import Reports from "@/pages/core/Reports";
import Settings from "@/pages/core/Settings";
import Admin from "@/pages/core/Admin";

/* ============================================================================ */
/* CORE PAGE CONTRACT TYPE                                                      */
/* ============================================================================ */

export interface CorePageDefinition {
  id: string;
  title: string;

  /**
   * Canonical Core route.
   *
   * MUST live under:
   *   /core/<page>
   */
  route: string;

  icon?: string;

  /**
   * Navigation grouping
   */
  section: "office" | "administration" | "system";

  /**
   * Whether page appears in navigation
   */
  visible: boolean;

  /**
   * React component bound to this page.
   *
   * Phase 3 Enforcement:
   * - App.tsx derives routes directly from this
   */
  component: React.ComponentType;
}

/* ============================================================================ */
/* STATIC CORE PAGE DEFINITIONS (LOCKED)                                        */
/* ============================================================================ */

const CORE_PAGES: readonly CorePageDefinition[] = Object.freeze([
  {
    id: "dashboard",
    title: "Dashboard",
    route: "/core/dashboard",
    icon: "dashboard",
    section: "office",
    visible: true,
    component: Dashboard,
  },

  {
    id: "admin",
    title: "Administration",
    route: "/core/admin",
    icon: "shield",
    section: "administration",
    visible: true,
    component: Admin,
  },

  {
    id: "staff",
    title: "Staff",
    route: "/core/staff",
    icon: "users",
    section: "administration",
    visible: true,
    component: Staff,
  },

  {
    id: "reports",
    title: "Reports",
    route: "/core/reports",
    icon: "chart",
    section: "office",
    visible: true,
    component: Reports,
  },

  {
    id: "settings",
    title: "Settings",
    route: "/core/settings",
    icon: "settings",
    section: "system",
    visible: true,
    component: Settings,
  },
]);

/* ============================================================================ */
/* RESOLVER API                                                                 */
/* ============================================================================ */

/**
 * Resolve all Core pages.
 *
 * Core is absolute:
 * - Always exists
 * - Always active
 * - Always routable
 */
export function resolveCorePages(): readonly CorePageDefinition[] {
  return CORE_PAGES;
}
