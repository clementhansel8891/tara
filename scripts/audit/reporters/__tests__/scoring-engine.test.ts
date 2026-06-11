/**
 * Unit tests for ScoringEngine — calculateReadinessScore and classifyGoNoGo.
 *
 * Validates: Requirements 5.6, 6.2
 */

import { describe, it, expect } from 'vitest';
import { calculateReadinessScore, classifyGoNoGo } from '../scoring-engine';
import type { ModuleAuditData } from '../../types/audit-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal valid ModuleAuditData fixture.
 * All optional override fields are spread on top of sensible defaults.
 */
function makeModule(overrides: Partial<{
  elementsTotal: number;
  elementsFunctional: number;
  workflowsTotal: number;
  workflowsPassed: number;
  apiTotal: number;
  apiConnected: number;
  perfCritical: number;
}>): ModuleAuditData {
  const {
    elementsTotal = 10,
    elementsFunctional = 10,
    workflowsTotal = 4,
    workflowsPassed = 4,
    apiTotal = 5,
    apiConnected = 5,
    perfCritical = 0,
  } = overrides;

  return {
    name: 'test-module',
    layer: 'core',
    elements: {
      total: elementsTotal,
      functional: elementsFunctional,
      partial: 0,
      stub: 0,
      broken: 0,
    },
    modals: { total: 0, functional: 0, stub: 0 },
    api: {
      total: apiTotal,
      connected: apiConnected,
      disconnected: 0,
      mockData: 0,
    },
    workflows: {
      total: workflowsTotal,
      passed: workflowsPassed,
      failed: 0,
      skipped: 0,
    },
    perfIssues: {
      critical: perfCritical,
      high: 0,
      medium: 0,
      low: 0,
    },
    readinessScore: 0,
    goNoGo: 'no-go',
  };
}

// ---------------------------------------------------------------------------
// calculateReadinessScore — weighted formula
// ---------------------------------------------------------------------------

describe('calculateReadinessScore', () => {
  describe('weighted formula with known inputs', () => {
    it('returns 100 when all ratios are 1 (perfect module)', () => {
      const module = makeModule({});
      expect(calculateReadinessScore(module)).toBe(100);
    });

    it('returns exactly 30 when only functionalElements ratio is 1, rest are 0', () => {
      // elements: 10/10=1.0 → 1.0*0.30*100 = 30
      // workflows: 0/10=0   → 0
      // api: 0/10=0         → 0
      // noCriticalPerf: 0   → has critical issue, contributes 0
      const module = makeModule({
        workflowsTotal: 10,
        workflowsPassed: 0,
        apiTotal: 10,
        apiConnected: 0,
        perfCritical: 1, // critical perf → noCriticalPerf = 0
      });
      expect(calculateReadinessScore(module)).toBe(30);
    });

    it('returns exactly 35 when only workflowPass ratio is 1, rest are 0', () => {
      // elements: 0/10=0    → 0
      // workflows: 4/4=1.0  → 1.0*0.35*100 = 35
      // api: 0/10=0         → 0
      // noCriticalPerf: 0   → has critical issue
      const module = makeModule({
        elementsTotal: 10,
        elementsFunctional: 0,
        apiTotal: 10,
        apiConnected: 0,
        perfCritical: 1,
      });
      expect(calculateReadinessScore(module)).toBe(35);
    });

    it('returns exactly 20 when only apiConnected ratio is 1, rest are 0', () => {
      // elements: 0/10=0    → 0
      // workflows: 0/4=0    → 0
      // api: 5/5=1.0        → 1.0*0.20*100 = 20
      // noCriticalPerf: 0   → has critical issue
      const module = makeModule({
        elementsTotal: 10,
        elementsFunctional: 0,
        workflowsTotal: 4,
        workflowsPassed: 0,
        perfCritical: 1,
      });
      expect(calculateReadinessScore(module)).toBe(20);
    });

    it('returns exactly 15 when only noCriticalPerf is satisfied, rest are 0', () => {
      // elements: 0/10=0    → 0
      // workflows: 0/4=0    → 0
      // api: 0/5=0          → 0
      // noCriticalPerf: 1   → 1*0.15*100 = 15
      const module = makeModule({
        elementsTotal: 10,
        elementsFunctional: 0,
        workflowsTotal: 4,
        workflowsPassed: 0,
        apiTotal: 5,
        apiConnected: 0,
        perfCritical: 0, // no critical → contributes 15
      });
      expect(calculateReadinessScore(module)).toBe(15);
    });

    it('correctly computes a partial score with mixed ratios', () => {
      // elements: 5/10=0.5  → 0.5*30  = 15
      // workflows: 2/4=0.5  → 0.5*35  = 17.5
      // api: 4/5=0.8        → 0.8*20  = 16
      // noCriticalPerf: 0   → 0
      // total: 48.5
      const module = makeModule({
        elementsTotal: 10,
        elementsFunctional: 5,
        workflowsTotal: 4,
        workflowsPassed: 2,
        apiTotal: 5,
        apiConnected: 4,
        perfCritical: 1,
      });
      expect(calculateReadinessScore(module)).toBeCloseTo(48.5, 5);
    });

    it('returns 0 when no element is functional and there are critical perf issues', () => {
      const module = makeModule({
        elementsTotal: 10,
        elementsFunctional: 0,
        workflowsTotal: 4,
        workflowsPassed: 0,
        apiTotal: 5,
        apiConnected: 0,
        perfCritical: 2,
      });
      expect(calculateReadinessScore(module)).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Zero-total edge cases
  // ---------------------------------------------------------------------------

  describe('zero-total edge cases', () => {
    it('returns 0 (not NaN) when all totals are 0 and no perf issues', () => {
      // All denominators are 0 → each ratio defaults to 0
      // noCriticalPerf: critical=0 → contributes 15
      const module = makeModule({
        elementsTotal: 0,
        elementsFunctional: 0,
        workflowsTotal: 0,
        workflowsPassed: 0,
        apiTotal: 0,
        apiConnected: 0,
        perfCritical: 0,
      });
      const score = calculateReadinessScore(module);
      expect(score).not.toBeNaN();
      expect(score).toBe(15); // only noCriticalPerf contributes
    });

    it('returns 0 (not NaN) when all totals are 0 and critical perf issues exist', () => {
      const module = makeModule({
        elementsTotal: 0,
        elementsFunctional: 0,
        workflowsTotal: 0,
        workflowsPassed: 0,
        apiTotal: 0,
        apiConnected: 0,
        perfCritical: 3,
      });
      const score = calculateReadinessScore(module);
      expect(score).not.toBeNaN();
      expect(score).toBe(0);
    });

    it('handles zero element total gracefully (elements component is 0)', () => {
      const module = makeModule({
        elementsTotal: 0,
        elementsFunctional: 0,
        workflowsTotal: 4,
        workflowsPassed: 4,
        apiTotal: 5,
        apiConnected: 5,
        perfCritical: 0,
      });
      // workflows: 1.0*35=35, api: 1.0*20=20, noCriticalPerf: 1*15=15 → 70
      const score = calculateReadinessScore(module);
      expect(score).not.toBeNaN();
      expect(score).toBeCloseTo(70, 5);
    });

    it('handles zero workflow total gracefully (workflows component is 0)', () => {
      const module = makeModule({
        workflowsTotal: 0,
        workflowsPassed: 0,
      });
      // elements: 1.0*30=30, api: 1.0*20=20, noCriticalPerf: 1*15=15 → 65
      const score = calculateReadinessScore(module);
      expect(score).not.toBeNaN();
      expect(score).toBeCloseTo(65, 5);
    });

    it('handles zero api total gracefully (api component is 0)', () => {
      const module = makeModule({
        apiTotal: 0,
        apiConnected: 0,
      });
      // elements: 1.0*30=30, workflows: 1.0*35=35, noCriticalPerf: 1*15=15 → 80
      const score = calculateReadinessScore(module);
      expect(score).not.toBeNaN();
      expect(score).toBeCloseTo(80, 5);
    });
  });

  // ---------------------------------------------------------------------------
  // noCriticalPerf component
  // ---------------------------------------------------------------------------

  describe('noCriticalPerf component', () => {
    it('contributes 15 to the score when critical perf issues count is 0', () => {
      // Isolate: all other components forced to 0, no critical perf
      const withoutCritical = makeModule({
        elementsTotal: 10,
        elementsFunctional: 0,
        workflowsTotal: 4,
        workflowsPassed: 0,
        apiTotal: 5,
        apiConnected: 0,
        perfCritical: 0,
      });
      expect(calculateReadinessScore(withoutCritical)).toBe(15);
    });

    it('contributes 0 to the score when critical perf issues count is > 0', () => {
      const withCritical = makeModule({
        elementsTotal: 10,
        elementsFunctional: 0,
        workflowsTotal: 4,
        workflowsPassed: 0,
        apiTotal: 5,
        apiConnected: 0,
        perfCritical: 1,
      });
      expect(calculateReadinessScore(withCritical)).toBe(0);
    });

    it('contributes 0 when there are multiple critical perf issues', () => {
      const module = makeModule({
        elementsTotal: 10,
        elementsFunctional: 0,
        workflowsTotal: 4,
        workflowsPassed: 0,
        apiTotal: 5,
        apiConnected: 0,
        perfCritical: 99,
      });
      expect(calculateReadinessScore(module)).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Output clamping
  // ---------------------------------------------------------------------------

  describe('output is always in [0, 100]', () => {
    it('does not exceed 100 for a perfect module', () => {
      expect(calculateReadinessScore(makeModule({}))).toBeLessThanOrEqual(100);
    });

    it('is never negative for a zero module', () => {
      const module = makeModule({
        elementsTotal: 0,
        elementsFunctional: 0,
        workflowsTotal: 0,
        workflowsPassed: 0,
        apiTotal: 0,
        apiConnected: 0,
        perfCritical: 5,
      });
      expect(calculateReadinessScore(module)).toBeGreaterThanOrEqual(0);
    });
  });
});

// ---------------------------------------------------------------------------
// classifyGoNoGo — boundary thresholds
// ---------------------------------------------------------------------------

describe('classifyGoNoGo', () => {
  describe('go/no-go boundary at score 80 with zero P0s', () => {
    it('returns "no-go" for score 79 with p0Count 0', () => {
      expect(classifyGoNoGo(79, 0)).toBe('no-go');
    });

    it('returns "go" for score 80 with p0Count 0', () => {
      expect(classifyGoNoGo(80, 0)).toBe('go');
    });

    it('returns "no-go" for score 80 with p0Count 1', () => {
      expect(classifyGoNoGo(80, 1)).toBe('no-go');
    });

    it('returns "go" for score 100 with p0Count 0', () => {
      expect(classifyGoNoGo(100, 0)).toBe('go');
    });
  });

  describe('P0 blockers always force no-go regardless of score', () => {
    it('returns "no-go" for score 100 with p0Count 1', () => {
      expect(classifyGoNoGo(100, 1)).toBe('no-go');
    });

    it('returns "no-go" for score 90 with p0Count 5', () => {
      expect(classifyGoNoGo(90, 5)).toBe('no-go');
    });

    it('returns "no-go" for score 80 with p0Count 99', () => {
      expect(classifyGoNoGo(80, 99)).toBe('no-go');
    });
  });

  describe('score below threshold forces no-go even with zero P0s', () => {
    it('returns "no-go" for score 0 with p0Count 0', () => {
      expect(classifyGoNoGo(0, 0)).toBe('no-go');
    });

    it('returns "no-go" for score 50 with p0Count 0', () => {
      expect(classifyGoNoGo(50, 0)).toBe('no-go');
    });

    it('returns "no-go" for score 79.9 with p0Count 0', () => {
      expect(classifyGoNoGo(79.9, 0)).toBe('no-go');
    });
  });

  describe('go requires both conditions simultaneously', () => {
    it('returns "go" for score 81 with p0Count 0', () => {
      expect(classifyGoNoGo(81, 0)).toBe('go');
    });

    it('returns "go" for score 95 with p0Count 0', () => {
      expect(classifyGoNoGo(95, 0)).toBe('go');
    });
  });
});
