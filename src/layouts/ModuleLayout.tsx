// ============================================================================
// MODULE LAYOUT (PHASE 3)
// ============================================================================
//
// Purpose:
// - Shell wrapper for all industry modules
// - Provides consistent layout + outlet rendering
//
// Modules do NOT own layouts.
// Core owns layout enforcement.
//
// ============================================================================

import { Outlet, useParams } from "react-router-dom";

export function ModuleLayout() {
  const { moduleId } = useParams();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-3 font-semibold">
        Module: {moduleId}
      </header>

      {/* Module Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
