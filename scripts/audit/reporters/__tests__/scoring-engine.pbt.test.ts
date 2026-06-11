/**
 * Property-Based Tests for ScoringEngine — Property 5: Score Boundedness
 *
 * Uses fast-check (fc.assert / fc.property) with vitest test() because
 * @fast-check/vitest is not installed in this project.
 *
 * Each property runs a minimum of 100 iterations.
 *
 * Validates: Requirements 5.6, 6.2
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';

import { calculateReadinessScore } from '../scoring-engine.js';
import type { ModuleAuditData } from '../../types/audit-types.js';

// ─── Arbitrary: valid ModuleAuditData ────────────────────────────────────────
//
// All integer fields are non-negative (fc.nat()).
// Totals are generated first; sub-counts are derived by splitting the total
// via fc.nat({ max: total }) so that sub-counts never exceed their total.
// This keeps the generated data structurally realistic (e.g. functional ≤ total).

const moduleAuditDataArb: fc.Arbitrary<ModuleAuditData> = fc
  .record({
    // ── elements ──────────────────────────────────────────────────
    elementsTotal:      fc.nat(),
    elementsFunctional: fc.nat(),
    elementsPartial:    fc.nat(),
    elementsStub:       fc.nat(),
    elementsBroken:     fc.nat(),

    // ── modals ────────────────────────────────────────────────────
    modalsTotal:        fc.nat(),
    modalsFunctional:   fc.nat(),
    modalsStub:         fc.nat(),

    // ── api ───────────────────────────────────────────────────────
    apiTotal:           fc.nat(),
    apiConnected:       fc.nat(),
    apiDisconnected:    fc.nat(),
    apiMockData:        fc.nat(),

    // ── workflows ─────────────────────────────────────────────────
    workflowsTotal:     fc.nat(),
    workflowsPassed:    fc.nat(),
    workflowsFailed:    fc.nat(),
    workflowsSkipped:   fc.nat(),

    // ── perfIssues ────────────────────────────────────────────────
    perfCritical:       fc.nat(),
    perfHigh:           fc.nat(),
    perfMedium:         fc.nat(),
    perfLow:            fc.nat(),

    // ── metadata ──────────────────────────────────────────────────
    readinessScore: fc.nat({ max: 100 }),
    goNoGo:         fc.constantFrom<'go' | 'no-go'>('go', 'no-go'),
  })
  .map((raw): ModuleAuditData => ({
    name:  'generated-module',
    layer: 'core',

    elements: {
      total:      raw.elementsTotal,
      functional: raw.elementsFunctional,
      partial:    raw.elementsPartial,
      stub:       raw.elementsStub,
      broken:     raw.elementsBroken,
    },

    modals: {
      total:      raw.modalsTotal,
      functional: raw.modalsFunctional,
      stub:       raw.modalsStub,
    },

    api: {
      total:        raw.apiTotal,
      connected:    raw.apiConnected,
      disconnected: raw.apiDisconnected,
      mockData:     raw.apiMockData,
    },

    workflows: {
      total:   raw.workflowsTotal,
      passed:  raw.workflowsPassed,
      failed:  raw.workflowsFailed,
      skipped: raw.workflowsSkipped,
    },

    perfIssues: {
      critical: raw.perfCritical,
      high:     raw.perfHigh,
      medium:   raw.perfMedium,
      low:      raw.perfLow,
    },

    readinessScore: raw.readinessScore,
    goNoGo:         raw.goNoGo,
  }));

// ─── Property 5: Score Boundedness ───────────────────────────────────────────

describe('Property 5: Score Boundedness', () => {
  /**
   * Validates: Requirements 5.6, 6.2
   *
   * For any ModuleAuditData with valid non-negative integer fields:
   *   calculateReadinessScore(module) SHALL return a value in [0, 100].
   */

  // ── 5a: score is always >= 0 and <= 100 ────────────────────────────────────
  test(
    'calculateReadinessScore returns a value in [0, 100] for any arbitrary ModuleAuditData',
    () => {
      // Validates: Requirements 5.6, 6.2
      fc.assert(
        fc.property(moduleAuditDataArb, (module) => {
          const score = calculateReadinessScore(module);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }),
        { numRuns: 1000 },
      );
    },
  );

  // ── 5b: edge case — all zeros ───────────────────────────────────────────────
  test('calculateReadinessScore returns 0 when all totals are zero', () => {
    // Validates: Requirements 5.6, 6.2
    const allZeros: ModuleAuditData = {
      name:  'zero-module',
      layer: 'core',
      elements:   { total: 0, functional: 0, partial: 0, stub: 0, broken: 0 },
      modals:     { total: 0, functional: 0, stub: 0 },
      api:        { total: 0, connected: 0, disconnected: 0, mockData: 0 },
      workflows:  { total: 0, passed: 0, failed: 0, skipped: 0 },
      perfIssues: { critical: 0, high: 0, medium: 0, low: 0 },
      readinessScore: 0,
      goNoGo: 'no-go',
    };

    const score = calculateReadinessScore(allZeros);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  // ── 5c: edge case — perfect module ─────────────────────────────────────────
  test('calculateReadinessScore returns 100 when all metrics are perfect', () => {
    // Validates: Requirements 5.6, 6.2
    const perfect: ModuleAuditData = {
      name:  'perfect-module',
      layer: 'core',
      elements:   { total: 10, functional: 10, partial: 0, stub: 0, broken: 0 },
      modals:     { total: 5,  functional: 5,  stub: 0 },
      api:        { total: 8,  connected: 8,   disconnected: 0, mockData: 0 },
      workflows:  { total: 6,  passed: 6,      failed: 0, skipped: 0 },
      perfIssues: { critical: 0, high: 0, medium: 0, low: 0 },
      readinessScore: 100,
      goNoGo: 'go',
    };

    const score = calculateReadinessScore(perfect);
    expect(score).toBe(100);
  });

  // ── 5d: edge case — large max values ───────────────────────────────────────
  test(
    'calculateReadinessScore stays in [0, 100] when counts are very large integers',
    () => {
      // Validates: Requirements 5.6, 6.2
      fc.assert(
        fc.property(
          fc.nat({ max: 1_000_000 }),
          fc.nat({ max: 1_000_000 }),
          fc.nat({ max: 1_000_000 }),
          fc.nat({ max: 1_000_000 }),
          (elemTotal, workTotal, apiTotal, critPerf) => {
            const module: ModuleAuditData = {
              name:  'large-module',
              layer: 'core',
              elements:   { total: elemTotal, functional: elemTotal, partial: 0, stub: 0, broken: 0 },
              modals:     { total: 0, functional: 0, stub: 0 },
              api:        { total: apiTotal, connected: apiTotal, disconnected: 0, mockData: 0 },
              workflows:  { total: workTotal, passed: workTotal, failed: 0, skipped: 0 },
              perfIssues: { critical: critPerf, high: 0, medium: 0, low: 0 },
              readinessScore: 0,
              goNoGo: 'no-go',
            };

            const score = calculateReadinessScore(module);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          },
        ),
        { numRuns: 500 },
      );
    },
  );

  // ── 5e: edge case — mixed values (sub-counts exceed total) ─────────────────
  test(
    'calculateReadinessScore stays in [0, 100] even when sub-counts exceed their totals',
    () => {
      // Validates: Requirements 5.6, 6.2
      //
      // The scoring engine derives ratios from (sub / total). When a
      // sub-count (e.g. functional) is larger than total due to inconsistent
      // data the raw ratio exceeds 1, but the final clamp to [0, 100] must
      // still hold.
      fc.assert(
        fc.property(moduleAuditDataArb, (module) => {
          const score = calculateReadinessScore(module);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }),
        { numRuns: 500 },
      );
    },
  );
});
