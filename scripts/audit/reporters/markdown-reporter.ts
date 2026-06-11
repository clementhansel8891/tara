/**
 * Markdown Reporter — generates the final human-readable production-readiness
 * report from an aggregated `AuditSummary`.
 *
 * Two exports:
 * - `generateReport(summary)` — pure function, returns the markdown string
 * - `writeReport(summary, projectRoot)` — calls generateReport and writes to
 *   `docs/production-readiness-report.md`
 *
 * @module markdown-reporter
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import type { AuditSummary, Blocker, ModuleAuditData } from '../types/audit-types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number as a percentage string with one decimal place. */
function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Capitalise the first character of a string. */
function cap(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Build a Markdown table from a header row and data rows.
 *
 * @param headers - Column header labels
 * @param rows    - Data rows; each row must have the same length as `headers`
 */
function mdTable(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.join(' | ')} |`;
  const sepRow    = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows  = rows.map(r => `| ${r.join(' | ')} |`);
  return [headerRow, sepRow, ...dataRows].join('\n');
}

/**
 * Return the P0 count for a module from the `summary.blockers` array.
 */
function p0Count(blockers: Blocker[], moduleName: string): number {
  return blockers.filter(b => b.module === moduleName && b.priority === 'P0').length;
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

/**
 * Build the Executive Summary section.
 *
 * Includes:
 * - Overall readiness score
 * - Modules ready (GO) vs total
 * - Top-10 critical blockers table
 */
function buildExecutiveSummary(summary: AuditSummary): string {
  const modules = Object.values(summary.modules);
  const totalModules = modules.length;
  const goModules    = modules.filter(m => m.goNoGo === 'go').length;

  // Top 10 P0 blockers first, then P1, then P2 — sorted by priority rank
  const priorityOrder: Record<Blocker['priority'], number> = { P0: 0, P1: 1, P2: 2 };
  const topBlockers = [...summary.blockers]
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 10);

  const blockerRows: string[][] =
    topBlockers.length > 0
      ? topBlockers.map(b => [b.priority, cap(b.module), b.description, cap(b.estimatedEffort)])
      : [['—', '—', 'No critical blockers found', '—']];

  const blockerTable = mdTable(
    ['Priority', 'Module', 'Description', 'Effort'],
    blockerRows,
  );

  return [
    '## Executive Summary',
    '',
    `- **Overall Readiness Score:** ${pct(summary.overallScore)}`,
    `- **Modules Ready (GO):** ${goModules} / ${totalModules}`,
    `- **Go-Live Status:** ${summary.goLiveReady ? '✅ READY' : '❌ NOT READY'}`,
    `- **Total Blockers:** ${summary.blockers.length} (P0: ${summary.blockers.filter(b => b.priority === 'P0').length}, P1: ${summary.blockers.filter(b => b.priority === 'P1').length}, P2: ${summary.blockers.filter(b => b.priority === 'P2').length})`,
    '',
    '### Top 10 Critical Blockers',
    '',
    blockerTable,
  ].join('\n');
}

/**
 * Build the interactive elements table for a module.
 *
 * Classification counts: functional / partial / stub / broken / total
 */
function buildElementsTable(mod: ModuleAuditData): string {
  return mdTable(
    ['Classification', 'Count'],
    [
      ['Functional', String(mod.elements.functional)],
      ['Partial',    String(mod.elements.partial)],
      ['Stub',       String(mod.elements.stub)],
      ['Broken',     String(mod.elements.broken)],
      ['**Total**',  `**${mod.elements.total}**`],
    ],
  );
}

/**
 * Build the workflow test results table for a module.
 *
 * Columns: passed / failed / skipped / total
 */
function buildWorkflowTable(mod: ModuleAuditData): string {
  return mdTable(
    ['Status', 'Count'],
    [
      ['Passed',    String(mod.workflows.passed)],
      ['Failed',    String(mod.workflows.failed)],
      ['Skipped',   String(mod.workflows.skipped)],
      ['**Total**', `**${mod.workflows.total}**`],
    ],
  );
}

/**
 * Build the API integration table for a module.
 *
 * Columns: connected / disconnected / mock_data / total
 */
function buildApiTable(mod: ModuleAuditData): string {
  return mdTable(
    ['Status', 'Count'],
    [
      ['Connected',    String(mod.api.connected)],
      ['Disconnected', String(mod.api.disconnected)],
      ['Mock Data',    String(mod.api.mockData)],
      ['**Total**',    `**${mod.api.total}**`],
    ],
  );
}

/**
 * Build the P0/P1/P2 blocker list for a single module.
 */
function buildBlockerList(blockers: Blocker[], moduleName: string): string {
  const moduleBlockers = blockers.filter(b => b.module === moduleName);

  if (moduleBlockers.length === 0) {
    return '_No blockers identified for this module._';
  }

  const lines: string[] = [];
  for (const priority of ['P0', 'P1', 'P2'] as const) {
    const group = moduleBlockers.filter(b => b.priority === priority);
    if (group.length > 0) {
      lines.push(`**${priority}:**`);
      for (const b of group) {
        lines.push(`- [${b.id}] ${b.description} *(${cap(b.estimatedEffort)} — ${b.remediation})*`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Build a complete per-module section.
 */
function buildModuleSection(mod: ModuleAuditData, blockers: Blocker[]): string {
  const p0s = p0Count(blockers, mod.name);
  const verdict = mod.goNoGo === 'go' ? '✅ **GO**' : '❌ **NO-GO**';

  return [
    `### ${cap(mod.name)}`,
    '',
    `> Layer: \`${mod.layer}\``,
    '',
    '#### Interactive Elements',
    '',
    buildElementsTable(mod),
    '',
    '#### Workflow Test Results',
    '',
    buildWorkflowTable(mod),
    '',
    '#### API Integration',
    '',
    buildApiTable(mod),
    '',
    `#### Go-Live Readiness: ${pct(mod.readinessScore)} — ${verdict}`,
    '',
    '#### Blockers',
    '',
    buildBlockerList(blockers, mod.name),
  ].join('\n');
}

// ---------------------------------------------------------------------------
// generateReport
// ---------------------------------------------------------------------------

/**
 * Generate the full production-readiness markdown report from an
 * `AuditSummary`.
 *
 * This is a **pure function** — it performs no I/O.
 *
 * @param summary - Aggregated audit summary produced by `aggregateSummary()`
 * @returns        Markdown string ready to be written to disk
 */
export function generateReport(summary: AuditSummary): string {
  const now = new Date(summary.timestamp).toUTCString();

  const moduleEntries = Object.values(summary.modules)
    .sort((a, b) => a.name.localeCompare(b.name));

  const moduleSections = moduleEntries
    .map(mod => buildModuleSection(mod, summary.blockers))
    .join('\n\n---\n\n');

  const parts: string[] = [
    '# Production Readiness Report — Zenvix Business Flow Suite v2',
    '',
    `_Generated: ${now}_`,
    `_Audit version: ${summary.version}_`,
    '',
    '---',
    '',
    buildExecutiveSummary(summary),
    '',
    '---',
    '',
    '## Module Reports',
    '',
  ];

  if (moduleEntries.length === 0) {
    parts.push('_No module data available._');
  } else {
    parts.push(moduleSections);
  }

  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('_End of report_');
  parts.push('');

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// writeReport
// ---------------------------------------------------------------------------

/**
 * Generate the production-readiness report and write it to
 * `docs/production-readiness-report.md` relative to `projectRoot`.
 *
 * The `docs/` directory is created automatically if it does not exist.
 *
 * @param summary     - Aggregated audit summary
 * @param projectRoot - Absolute path to the project root directory
 */
export async function writeReport(
  summary: AuditSummary,
  projectRoot: string,
): Promise<void> {
  const outputPath = path.join(projectRoot, 'docs', 'production-readiness-report.md');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const content = generateReport(summary);
  await fs.writeFile(outputPath, content, 'utf-8');
}
