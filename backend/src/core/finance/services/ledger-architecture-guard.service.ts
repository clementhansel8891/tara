import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { JournalEntry } from '../domain/finance.interfaces';
import { JournalStatus } from '../domain/finance.constants';
import { ImmutableJournalError } from '../domain/ledger-posting-context';

export interface ArchitectureReport {
  allowedCallers: string[];
  protectedTables: string[];
  generatedAt: string;
}

export interface CIScanViolation {
  file: string;
  line: number;
  pattern: string;
  type: 'UNAUTHORIZED_IMPORT' | 'RAW_SQL_WRITE';
}

export interface CIScanResult {
  passed: boolean;
  violations: CIScanViolation[];
  allowed: string[];
  scannedFiles: number;
}

/**
 * LedgerArchitectureGuard
 * ─────────────────────────
 * Enforces that only whitelisted services access the journal tables.
 *
 * Runtime mode: inject into services to perform caller-identity checks.
 * CI mode:      call static runCIScan(projectRoot) from a script.
 */
@Injectable()
export class LedgerArchitectureGuard {
  private readonly logger = new Logger(LedgerArchitectureGuard.name);

  private static readonly ALLOWED_CALLERS: string[] = [
    'LedgerPostingService',
    'JournalReversalService',
    'LedgerIntegrityService',
    'LedgerInvariantService',
  ];

  private static readonly PROTECTED_TABLES: string[] = [
    'journal_entries',
    'journal_lines',
  ];

  // ── Runtime Guards ────────────────────────────────────────────────────────

  /** Throws ForbiddenException if the caller is not on the whitelist. */
  scanForDirectJournalWrites(callerClass: string): void {
    if (!LedgerArchitectureGuard.ALLOWED_CALLERS.includes(callerClass)) {
      this.logger.error(
        `ARCHITECTURE_VIOLATION: '${callerClass}' attempted direct journal write. Only ${LedgerArchitectureGuard.ALLOWED_CALLERS.join(', ')} are permitted.`,
      );
      throw new ForbiddenException(
        `ARCHITECTURE_VIOLATION: direct journal writes are prohibited outside the ledger pipeline`,
      );
    }
  }

  /** Asserts that a sourceEventId is present and non-empty. */
  assertEventOrigin(sourceEventId: string): void {
    if (!sourceEventId || sourceEventId.trim() === '') {
      throw new ForbiddenException(
        `EVENT_ORIGIN_REQUIRED: all journals must originate from a LedgerEventLog entry via sourceEventId`,
      );
    }
  }

  /** Asserts that a journal is in POSTED status (immutable). */
  assertImmutableJournal(journal: JournalEntry): void {
    if (journal.status !== JournalStatus.POSTED) {
      throw new ImmutableJournalError(
        journal.id,
        `status assertion — expected POSTED but found ${journal.status}`,
      );
    }
  }

  /** Returns a compliance snapshot of the allowed architecture. */
  generateArchitectureReport(): ArchitectureReport {
    return {
      allowedCallers: [...LedgerArchitectureGuard.ALLOWED_CALLERS],
      protectedTables: [...LedgerArchitectureGuard.PROTECTED_TABLES],
      generatedAt: new Date().toISOString(),
    };
  }

  // ── CI Scan Mode (static — no DI required) ────────────────────────────────

  private static readonly UNAUTHORIZED_IMPORT_PATTERNS = [
    /import.*IJournalRepository/,
    /import.*JournalMockRepository/,
    /import.*journal\.mock\.repository/,
  ];

  private static readonly RAW_SQL_PATTERNS = [
    /INSERT\s+INTO\s+journal_entries/i,
    /UPDATE\s+journal_entries/i,
    /DELETE\s+FROM\s+journal_entries/i,
    /INSERT\s+INTO\s+journal_lines/i,
    /UPDATE\s+journal_lines/i,
    /DELETE\s+FROM\s+journal_lines/i,
  ];

  private static readonly IMPORT_WHITELIST_FILES = [
    'journal.repository.interface.ts',
    'journal.mock.repository.ts',
    'ledger-posting.service.ts',
    'journal-reversal.service.ts',
    'ledger-integrity.service.ts',
    'ledger-invariant.service.ts',
    'finance.module.ts',
    'architecture-guard.ts',
    'ledger-architecture-guard.service.ts',
    'snapshot-engine.service.ts',
    'ledger-merkle-checkpoint.service.ts',
  ];

  /**
   * Static CI scan entry point.
   * Scans all .ts files under projectRoot for violations.
   * Does not require NestJS injection — safe to call from a script.
   */
  static runCIScan(projectRoot: string): CIScanResult {
    const violations: CIScanViolation[] = [];
    let scannedFiles = 0;

    const tsFiles = LedgerArchitectureGuard.collectTsFiles(projectRoot);

    for (const filePath of tsFiles) {
      scannedFiles++;
      const relativePath = path.relative(projectRoot, filePath);
      const fileName = path.basename(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Check unauthorized imports (only for non-whitelisted files)
        if (!LedgerArchitectureGuard.IMPORT_WHITELIST_FILES.includes(fileName)) {
          for (const pattern of LedgerArchitectureGuard.UNAUTHORIZED_IMPORT_PATTERNS) {
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

        // Check raw SQL write patterns (always — no whitelist for raw SQL)
        for (const pattern of LedgerArchitectureGuard.RAW_SQL_PATTERNS) {
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

    return {
      passed: violations.length === 0,
      violations,
      allowed: [...LedgerArchitectureGuard.ALLOWED_CALLERS],
      scannedFiles,
    };
  }

  private static collectTsFiles(dir: string): string[] {
    const results: string[] = [];
    const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage']);

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
}
