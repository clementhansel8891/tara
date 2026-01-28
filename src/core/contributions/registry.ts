import type { ContributionType, ContributionPayloadMap } from "./types";

/* ============================================================================ */
/* HANDLER CONTRACT                                                             */
/* ============================================================================ */

export interface ContributionHandler<TPayload> {
  validate(payload: TPayload): boolean;
}

/* ============================================================================ */
/* REGISTRY TYPE (KEYED, NOT UNION)                                              */
/* ============================================================================ */

export type ContributionRegistry = {
  [K in ContributionType]: ContributionHandler<ContributionPayloadMap[K]>;
};

/* ============================================================================ */
/* REGISTRY IMPLEMENTATION                                                      */
/* ============================================================================ */

export const contributionRegistry: ContributionRegistry = {
  financial_transaction: {
    validate(payload) {
      return payload.amount > 0;
    },
  },

  inventory_movement: {
    validate(payload) {
      return payload.quantity !== 0;
    },
  },

  work_log: {
    validate(payload) {
      return payload.durationMinutes > 0;
    },
  },

  device_event: {
    validate(payload) {
      return payload.eventType.length > 0;
    },
  },
};
