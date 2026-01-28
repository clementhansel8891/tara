// ============================================================================
// CONTRIBUTION PROCESSOR
// ============================================================================
//
// Validates and routes module contributions.
// Core decides persistence and consumption.
//
// ============================================================================

import type { AnyContributionEnvelope } from "./types";
import { contributionRegistry } from "./registry";

/**
 * Process a single contribution emitted by a module.
 *
 * - Validates payload using type-specific handler
 * - Enforces tenant + module boundary
 * - Routes data into core services (future)
 */
export function processContribution(
  contribution: AnyContributionEnvelope,
): void {
  switch (contribution.type) {
    case "financial_transaction": {
      const handler = contributionRegistry.financial_transaction;
      if (!handler.validate(contribution.payload)) {
        throw new Error("Invalid financial transaction payload");
      }
      break;
    }

    case "inventory_movement": {
      const handler = contributionRegistry.inventory_movement;
      if (!handler.validate(contribution.payload)) {
        throw new Error("Invalid inventory movement payload");
      }
      break;
    }

    case "work_log": {
      const handler = contributionRegistry.work_log;
      if (!handler.validate(contribution.payload)) {
        throw new Error("Invalid work log payload");
      }
      break;
    }

    case "device_event": {
      const handler = contributionRegistry.device_event;
      if (!handler.validate(contribution.payload)) {
        throw new Error("Invalid device event payload");
      }
      break;
    }

    default: {
      // Exhaustiveness guard — will fail compilation if a new type is added
      const _exhaustive: never = contribution;
      throw new Error("Unsupported contribution type");
    }
  }

  // --------------------------------------------------------------------------
  // tenantId and moduleId are ALWAYS available here:
  //
  // contribution.tenantId
  // contribution.moduleId
  // --------------------------------------------------------------------------
}
