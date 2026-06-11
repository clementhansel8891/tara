/**
 * Scoring Engine — pure functions for calculating module readiness scores
 * and go/no-go classifications.
 *
 * No side effects, no file I/O.
 * @module scoring-engine
 */

import type { ModuleAuditData } from '../types/audit-types';

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  functionalElements: 0.30,
  workflowPass:       0.35,
  apiConnected:       0.20,
  noCriticalPerf:     0.15,
} as const;

// ---------------------------------------------------------------------------
// calculateReadinessScore
// ---------------------------------------------------------------------------

/**
 * Calculate a 0–100 readiness score for a module using a weighted formula:
 *
 * | Component          | Weight |
 * |--------------------|--------|
 * | functionalElements |  0.30  |
 * | workflowPass       |  0.35  |
 * | apiConnected       |  0.20  |
 * | noCriticalPerf     |  0.15  |
 *
 * Division by zero: any component whose denominator is 0 contributes 0 to
 * the total (the weight is effectively wasted rather than inflating the score).
 *
 * The returned value is always clamped to [0, 100].
 */
export function calculateReadinessScore(module: ModuleAuditData): number {
  // functionalElements: (functional / total) * 0.30 * 100
  const functionalRatio =
    module.elements.total > 0
      ? module.elements.functional / module.elements.total
      : 0;

  // workflowPass: (passed / total) * 0.35 * 100
  const workflowRatio =
    module.workflows.total > 0
      ? module.workflows.passed / module.workflows.total
      : 0;

  // apiConnected: (connected / total) * 0.20 * 100
  const apiRatio =
    module.api.total > 0
      ? module.api.connected / module.api.total
      : 0;

  // noCriticalPerf: (critical === 0 ? 1 : 0) * 0.15 * 100
  const noCriticalPerfRatio = module.perfIssues.critical === 0 ? 1 : 0;

  const raw =
    functionalRatio    * WEIGHTS.functionalElements * 100 +
    workflowRatio      * WEIGHTS.workflowPass       * 100 +
    apiRatio           * WEIGHTS.apiConnected       * 100 +
    noCriticalPerfRatio * WEIGHTS.noCriticalPerf    * 100;

  // Clamp to [0, 100] to guard against unexpected floating-point drift.
  return Math.min(100, Math.max(0, raw));
}

// ---------------------------------------------------------------------------
// classifyGoNoGo
// ---------------------------------------------------------------------------

/**
 * Determine whether a module is ready for go-live.
 *
 * Rules:
 * - `'go'`    → score >= 80 **AND** p0Count === 0
 * - `'no-go'` → all other cases
 */
export function classifyGoNoGo(
  score: number,
  p0Count: number,
): 'go' | 'no-go' {
  return score >= 80 && p0Count === 0 ? 'go' : 'no-go';
}
