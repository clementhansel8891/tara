/**
 * result-collector.ts
 *
 * Writes E2E workflow step results to `audit-results/e2e/workflow-results.json`.
 * Multiple workflow runs append/merge into the same file so that a full audit
 * run accumulates results from all workflow specs in one place.
 */

import fs from 'fs';
import path from 'path';
import type { WorkflowStepResult } from '../../../../scripts/audit/types/audit-types.js';

const RESULTS_PATH = path.join(process.cwd(), 'audit-results', 'e2e', 'workflow-results.json');

/**
 * Read the existing results file, replacing or appending entries for the given
 * `workflowName`.  Existing entries from *other* workflows are preserved.
 *
 * @param workflowName  The workflow identifier, e.g. `'retail-pos'`
 * @param results       The step results produced by this workflow's test run
 */
export async function writeWorkflowResults(
  workflowName: string,
  results: WorkflowStepResult[],
): Promise<void> {
  // Ensure the output directory exists
  const dir = path.dirname(RESULTS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load existing results (from other workflow runs)
  let existing: WorkflowStepResult[] = [];
  if (fs.existsSync(RESULTS_PATH)) {
    try {
      const raw = fs.readFileSync(RESULTS_PATH, 'utf-8');
      existing = JSON.parse(raw) as WorkflowStepResult[];
    } catch {
      // Corrupted / empty file — start fresh
      existing = [];
    }
  }

  // Remove stale entries for this workflow, then append fresh ones
  const filtered = existing.filter((r) => r.workflow !== workflowName);
  const merged = [...filtered, ...results];

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(
    `[result-collector] Wrote ${results.length} step(s) for workflow "${workflowName}" → ${RESULTS_PATH}`,
  );
}
