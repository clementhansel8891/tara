// ============================================================================
// CORE ROUTE BUILDER (PHASE 3)
// ============================================================================
//
// Purpose:
// - Build canonical Core routes from CorePageResolver
// - Core pages are always active
// - No licensing, no modules, no tenant conditions
//
// Core is administrative backbone.
//
// ============================================================================

import { Route } from "react-router-dom";

import { resolveCorePages } from "./corePageResolver";

// Temporary placeholder page component
function CorePlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>{title}</h1>
      <p style={{ opacity: 0.7 }}>Core page not implemented yet.</p>
    </div>
  );
}

/**
 * Build Core Routes.
 *
 * RULES:
 * - Always exists
 * - Always accessible (permissions handled elsewhere)
 * - Derived from resolver only
 */
export function buildCoreRoutes(): JSX.Element[] {
  const pages = resolveCorePages();

  return pages.map((page) => (
    <Route
      key={page.id}
      path={page.route.replace("/core/", "")}
      element={<CorePlaceholderPage title={page.title} />}
    />
  ));
}
