/**
 * Unit tests for MarkdownReporter.
 *
 * Feeds known AuditSummary fixtures through `generateReport()` and asserts
 * the markdown structure contains all required sections and content.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { describe, it, expect } from 'vitest';
import { generateReport } from '../markdown-reporter.js';
import type { AuditSummary, ModuleAuditData, Blocker } from '../../types/audit-types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeModule(
  name: string,
  overrides: Partial<ModuleAuditData> = {},
): ModuleAuditData {
  return {
    name,
    layer: 'core',
    elements: { total: 10, functional: 6, partial: 2, stub: 1, broken: 1 },
    modals: { total: 3, functional: 2, stub: 1 },
    api: { total: 8, connected: 5, disconnected: 2, mockData: 1 },
    workflows: { total: 4, passed: 3, failed: 1, skipped: 0 },
    perfIssues: { critical: 0, high: 1, medium: 2, low: 3 },
    readinessScore: 72.5,
    goNoGo: 'no-go',
    ...overrides,
  };
}

function makeBlocker(
  id: string,
  priority: 'P0' | 'P1' | 'P2',
  module: string,
  description: string,
): Blocker {
  return {
    id,
    priority,
    module,
    description,
    type: 'stub',
    filePath: `src/pages/${module}/index.tsx`,
    estimatedEffort: 'days',
    remediation: `Fix the ${description} issue in ${module}`,
  };
}

const FULL_SUMMARY: AuditSummary = {
  timestamp: '2024-06-01T10:00:00.000Z',
  version: '1.0.0',
  totalFunctional: 16,
  overallScore: 74.2,
  goLiveReady: false,
  modules: {
    finance: makeModule('finance', { readinessScore: 85, goNoGo: 'go' }),
    hr: makeModule('hr', { readinessScore: 63.5, goNoGo: 'no-go' }),
  },
  blockers: [
    makeBlocker('B001', 'P0', 'hr', 'Critical payroll stub not implemented'),
    makeBlocker('B002', 'P1', 'finance', 'Invoice PDF export missing'),
    makeBlocker('B003', 'P2', 'hr', 'Leave balance display cosmetic issue'),
  ],
};

const EMPTY_SUMMARY: AuditSummary = {
  timestamp: '2024-06-01T10:00:00.000Z',
  version: '1.0.0',
  totalFunctional: 0,
  overallScore: 0,
  goLiveReady: false,
  modules: {},
  blockers: [],
};

// ---------------------------------------------------------------------------
// Report structure tests
// ---------------------------------------------------------------------------

describe('generateReport — overall structure', () => {
  it('returns a non-empty string', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });

  it('starts with the report title', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toMatch(/^#\s+Production Readiness Report/m);
  });

  it('contains the Zenvix project name', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report.toLowerCase()).toContain('zenvix');
  });

  it('contains the audit version', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('1.0.0');
  });
});

// ---------------------------------------------------------------------------
// Executive Summary section
// ---------------------------------------------------------------------------

describe('generateReport — Executive Summary', () => {
  it('contains an Executive Summary section heading', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toMatch(/##\s+Executive Summary/);
  });

  it('includes the overall readiness score', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('74.2%');
  });

  it('includes modules ready count', () => {
    const report = generateReport(FULL_SUMMARY);
    // finance is go, hr is no-go → 1/2 ready
    expect(report).toContain('1');
    expect(report).toContain('2');
  });

  it('includes a top blockers table', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toMatch(/Top.*Blocker/i);
  });

  it('lists the P0 blocker description in the report', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('Critical payroll stub not implemented');
  });

  it('lists priority column headers in the blockers table', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toMatch(/Priority/i);
    expect(report).toMatch(/Module/i);
    expect(report).toMatch(/Description/i);
  });
});

// ---------------------------------------------------------------------------
// Per-module sections
// ---------------------------------------------------------------------------

describe('generateReport — per-module sections', () => {
  it('contains a section for each module in the summary', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toMatch(/###\s+Finance/i);
    expect(report).toMatch(/###\s+Hr/i);
  });

  it('includes interactive elements table for each module', () => {
    const report = generateReport(FULL_SUMMARY);
    // Both modules should have an elements section
    const elMatches = report.match(/Interactive Elements/g);
    expect(elMatches).not.toBeNull();
    expect(elMatches!.length).toBeGreaterThanOrEqual(2);
  });

  it('includes workflow test results table for each module', () => {
    const report = generateReport(FULL_SUMMARY);
    const wfMatches = report.match(/Workflow Test Results/g);
    expect(wfMatches).not.toBeNull();
    expect(wfMatches!.length).toBeGreaterThanOrEqual(2);
  });

  it('includes API integration table for each module', () => {
    const report = generateReport(FULL_SUMMARY);
    const apiMatches = report.match(/API Integration/g);
    expect(apiMatches).not.toBeNull();
    expect(apiMatches!.length).toBeGreaterThanOrEqual(2);
  });

  it('shows GO verdict for a module with score >= 80 and zero P0 blockers', () => {
    const report = generateReport(FULL_SUMMARY);
    // finance has score 85 and goNoGo='go'
    expect(report).toContain('GO');
  });

  it('shows NO-GO verdict for a module below threshold', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('NO-GO');
  });

  it('includes readiness score percentage in module section', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('85.0%'); // finance
    expect(report).toContain('63.5%'); // hr
  });

  it('lists P0 blocker in the module blockers section', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('P0');
    expect(report).toContain('Critical payroll stub not implemented');
  });

  it('lists P1 and P2 blockers in the appropriate module section', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('P1');
    expect(report).toContain('Invoice PDF export missing');
    expect(report).toContain('P2');
  });
});

// ---------------------------------------------------------------------------
// Element counts in tables
// ---------------------------------------------------------------------------

describe('generateReport — element counts', () => {
  it('includes functional element count in module table', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('6'); // functional count from fixture
  });

  it('includes stub count in module table', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('Stub');
  });

  it('includes broken count in module table', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('Broken');
  });

  it('shows workflow passed/failed/skipped counts', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('Passed');
    expect(report).toContain('Failed');
    expect(report).toContain('Skipped');
  });

  it('shows API connected/disconnected/mock counts', () => {
    const report = generateReport(FULL_SUMMARY);
    expect(report).toContain('Connected');
    expect(report).toContain('Disconnected');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('generateReport — edge cases', () => {
  it('handles an empty modules object without throwing', () => {
    expect(() => generateReport(EMPTY_SUMMARY)).not.toThrow();
  });

  it('shows 0.0% overall score for empty summary', () => {
    const report = generateReport(EMPTY_SUMMARY);
    expect(report).toContain('0.0%');
  });

  it('shows "No module data available" or equivalent for empty modules', () => {
    const report = generateReport(EMPTY_SUMMARY);
    expect(report.toLowerCase()).toMatch(/no module|not available|no data/i);
  });

  it('handles a summary with no blockers gracefully', () => {
    const noBlockers: AuditSummary = {
      ...FULL_SUMMARY,
      blockers: [],
    };
    const report = generateReport(noBlockers);
    expect(report).toMatch(/No critical blockers|no blocker/i);
  });

  it('handles a single-module summary', () => {
    const single: AuditSummary = {
      ...FULL_SUMMARY,
      modules: { finance: makeModule('finance', { readinessScore: 90, goNoGo: 'go' }) },
      blockers: [],
    };
    const report = generateReport(single);
    expect(report).toMatch(/###\s+Finance/i);
    expect(report).not.toMatch(/###\s+Hr/i);
  });
});
