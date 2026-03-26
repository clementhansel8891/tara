#!/usr/bin/env ts-node

/**
 * Zenvix Ledger Architecture Guard — CI Scanner
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Pure script version (no dependencies on backend services)
 * to avoid ESM/Decorator compilation issues in CI pipelines.
 *
 * Detects:
 *  1. UNAUTHORIZED_IMPORT: Importing Journal Repository outside whitelist.
 *  2. RAW_SQL_WRITE: Direct INSERT/UPDATE/DELETE on journal tables.
 */

import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_CALLERS = [
  'LedgerPostingService',
  'JournalReversalService',
  'LedgerIntegrityService',
  'LedgerInvariantService',
];

const UNAUTHORIZED_IMPORT_PATTERNS = [
  /import.*IJournalRepository/,
  /import.*JournalMockRepository/,
  /import.*journal\.mock\.repository/,
];

const RAW_SQL_PATTERNS = [
  /INSERT\s+INTO\s+journal_entries/i,
  /UPDATE\s+journal_entries/i,
  /DELETE\s+FROM\s+journal_entries/i,
  /INSERT\s+INTO\s+journal_lines/i,
  /UPDATE\s+journal_lines/i,
  /DELETE\s+FROM\s+journal_lines/i,
];

const IMPORT_WHITELIST_FILES = [
  'journal.repository.interface.ts',
  'journal.mock.repository.ts',
  'ledger-posting.service.ts',
  'journal-reversal.service.ts',
  'ledger-integrity.service.ts',
  'ledger-invariant.service.ts',
  'finance.module.ts',
  'architecture-guard.ts',
  'ledger-architecture-guard.service.ts',
  '10_financial_integrity_guard.ts',
  'snapshot-engine.service.ts',
  'ledger-merkle-checkpoint.service.ts',
];

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage']);

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !EXCLUDED_DIRS.has(entry.name)) {
        walk(path.join(current, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        results.push(path.join(current, entry.name));
      }
    }
  }
  walk(dir);
  return results;
}

const projectRoot = process.cwd();
console.log('════════════════════════════════════════════════════');
console.log('   ZENVIX LEDGER ARCHITECTURE GUARD — CI SCAN');
console.log('════════════════════════════════════════════════════\n');

const tsFiles = collectTsFiles(projectRoot);
const violations: any[] = [];
let scannedCount = 0;

for (const filePath of tsFiles) {
  scannedCount++;
  const fileName = path.basename(filePath);
  const relativePath = path.relative(projectRoot, filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 1. Check unauthorized imports (skip whitelisted files)
    if (!IMPORT_WHITELIST_FILES.includes(fileName)) {
      for (const pattern of UNAUTHORIZED_IMPORT_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: relativePath,
            line: lineNum,
            pattern: pattern.source,
            type: 'UNAUTHORIZED_IMPORT',
          });
        }
      }
    }

    // 2. Check raw SQL writes (always checked)
    for (const pattern of RAW_SQL_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: relativePath,
          line: lineNum,
          pattern: pattern.source,
          type: 'RAW_SQL_WRITE',
        });
      }
    }
  }
}

console.log(`Scanned ${scannedCount} TypeScript files\n`);
console.log(`Allowed callers: ${ALLOWED_CALLERS.join(', ')}\n`);

if (violations.length > 0) {
  console.error(`❌ VIOLATIONS DETECTED (${violations.length}):\n`);
  for (const v of violations) {
    console.error(`  [${v.type}] ${v.file}:${v.line}`);
    console.error(`           Pattern: ${v.pattern}\n`);
  }
} else {
  console.log('✔ No violations detected — ledger architecture is clean\n');
}

console.log('════════════════════════════════════════════════════');
console.log(`RESULT: ${violations.length === 0 ? '✔ PASSED' : '✘ FAILED'}`);
console.log('════════════════════════════════════════════════════\n');

process.exit(violations.length === 0 ? 0 : 1);
