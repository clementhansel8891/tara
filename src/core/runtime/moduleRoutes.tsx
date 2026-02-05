// ============================================================================
// MODULE ROUTE BUILDER (PHASE 3)
// ============================================================================
//
// Purpose:
// - Build runtime module routes from Module Contracts
// - No hardcoded module routing in App.tsx
// - Modules own their pages + components
//
// This is the enforcement layer:
//
//   ModuleContract.getPages()
//        ↓
//     <Route> generation
//
// ============================================================================

import { Route } from "react-router-dom";

import { getAllModuleContracts } from "./moduleRegistry";

/**
 * Build all module routes.
 *
 * RULES:
 * - Derived ONLY from registered modules
 * - Uses ModulePageDefinition.component
 * - No manual routes allowed
 */
export function buildModuleRoutes(): JSX.Element[] {
  const contracts = getAllModuleContracts();

  const routes: JSX.Element[] = [];

  for (const module of contracts) {
    const pages = module.getPages(module.getDefaultConfig());

    for (const page of pages) {
      const Component = page.component;

      routes.push(
        <Route
          key={`${module.id}:${page.id}`}
          path={page.route.replace(`/m/${module.id}/`, "")}
          element={<Component />}
        />,
      );
    }
  }

  return routes;
}
