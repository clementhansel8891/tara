/**
 * JSON Collector — reads and writes intermediate audit result files and
 * aggregates per-module data into a top-level `AuditSummary`.
 *
 * All files live under `audit-results/{phase}/{fileName}.json` relative to
 * the project root.  Directories are created on demand.
 * @module json-collector
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AuditSummary, ModuleAuditData } from '../types/audit-types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the project root (three levels above reporters/json-collector.ts). */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * Resolve the full file-system path for a phase + fileName pair.
 *
 * @example
 * resolvePath('static', 'elements')
 * // → '<project-root>/audit-results/static/elements.json'
 */
function resolvePath(phase: string, fileName: string): string {
  return path.join(PROJECT_ROOT, 'audit-results', phase, `${fileName}.json`);
}

// ---------------------------------------------------------------------------
// writeResults
// ---------------------------------------------------------------------------

/**
 * Serialise `data` as pretty-printed JSON and write it to
 * `audit-results/{phase}/{fileName}.json`.  Parent directories are created
 * automatically if they do not exist.
 *
 * @param phase    - Sub-directory under `audit-results/` (e.g. `'static'`, `'final'`)
 * @param fileName - File name **without** the `.json` extension
 * @param data     - Any JSON-serialisable value
 */
export async function writeResults(
  phase: string,
  fileName: string,
  data: unknown,
): Promise<void> {
  const filePath = resolvePath(phase, fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// readResults
// ---------------------------------------------------------------------------

/**
 * Read and parse `audit-results/{phase}/{fileName}.json`.
 *
 * @param phase    - Sub-directory under `audit-results/`
 * @param fileName - File name **without** the `.json` extension
 * @returns The parsed value cast to `T`
 * @throws `Error` when the file does not exist or is not valid JSON
 */
export async function readResults<T>(
  phase: string,
  fileName: string,
): Promise<T> {
  const filePath = resolvePath(phase, fileName);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

// ---------------------------------------------------------------------------
// aggregateSummary
// ---------------------------------------------------------------------------

/**
 * Produce an `AuditSummary` from an array of per-module audit results.
 *
 * Calculations:
 * - `totalFunctional`  = Σ `module.elements.functional`
 * - `overallScore`     = average of all `module.readinessScore` values
 *                        (0 when the array is empty)
 * - `goLiveReady`      = `true` only when **every** module has `goNoGo === 'go'`
 * - `blockers`         = empty array (populated by other components)
 *
 * @param modules - Array of `ModuleAuditData` objects (may be empty)
 * @returns A fully-initialised `AuditSummary`
 */
export function aggregateSummary(modules: ModuleAuditData[]): AuditSummary {
  const modulesRecord: Record<string, ModuleAuditData> = {};

  let totalFunctional = 0;
  let scoreSum = 0;
  let allGo = modules.length > 0; // empty ⇒ false (nothing is "go")

  for (const mod of modules) {
    modulesRecord[mod.name] = mod;
    totalFunctional += mod.elements.functional;
    scoreSum += mod.readinessScore;
    if (mod.goNoGo !== 'go') {
      allGo = false;
    }
  }

  const overallScore = modules.length > 0 ? scoreSum / modules.length : 0;

  return {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modules: modulesRecord,
    totalFunctional,
    overallScore,
    goLiveReady: allGo,
    blockers: [],
  };
}
