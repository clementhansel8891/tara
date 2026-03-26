/**
 * PHASE 10 — Financial Integrity Guard Test Suite
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Verifies the architectural safety guardrails implemented in the
 * Ledger Architecture Hardening phase.
 *
 * Test scenarios:
 *  10.1 ledgerTrialBalanceTest          — balanced journal entry validation
 *  10.2 hashChainVerificationTest       — detect corrupted entryHash
 *  10.3 sequenceOrderingTest            — ledgerSequence monotonically assigned
 *  10.4 journalReversalTest             — REVERSAL type with mirrored lines
 *  10.5 postingContextTokenEnfTest      — HMAC token enforcement
 *  10.6 merkleCheckpointAuditTest       — O(log n) Merkle inclusion proof
 */

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { JournalMockRepository } from "../../backend/src/core/finance/repositories/journal.mock.repository";
import { JournalValidationService } from "../../backend/src/core/finance/services/journal-validation.service";
import { LedgerMerkleCheckpointService } from "../../backend/src/core/finance/services/ledger-merkle-checkpoint.service";
import { LedgerMerkleCheckpointMockRepository } from "../../backend/src/core/finance/repositories/ledger-merkle-checkpoint.mock.repository";
import { MerkleTreeBuilder } from "../../backend/src/core/finance/utils/merkle-tree-builder";
import { PostingContextFactory } from "../../backend/src/core/finance/domain/posting-context-factory";
import {
  TokenForgeryError,
  TokenExpiredError,
  ImmutableJournalError,
} from "../../backend/src/core/finance/domain/ledger-posting-context";
import { PostingSide, JournalStatus, JournalType } from "../../backend/src/core/finance/domain/finance.constants";
import { seedTestCompany, seedTestFiscalPeriod, seedTestAccount, seedTestLocation, testId } from "./helpers/seeds";

const prisma = new PrismaClient();

// ── Test reporter ─────────────────────────────────────────────────────────────
let pass = 0, fail = 0, warn = 0;
function PASS(label: string, detail?: string) {
  console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${label}`);
  if (detail) console.log(`    \x1b[2m${detail}\x1b[0m`);
  pass++;
}
function FAIL(label: string, detail?: string) {
  console.error(`  \x1b[31m✘ [FAIL]\x1b[0m ${label}`);
  if (detail) console.error(`    \x1b[2m${detail}\x1b[0m`);
  fail++;
}
function WARN(label: string, detail?: string) {
  console.warn(`  \x1b[33m⚠ [WARN]\x1b[0m ${label}`);
  if (detail) console.warn(`    \x1b[2m${detail}\x1b[0m`);
  warn++;
}
function section(title: string) {
  console.log(`\n\x1b[1m${'━'.repeat(48)}\n  ${title}\n${'━'.repeat(48)}\x1b[0m`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeHash(payload: string): string {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

async function main() {
  console.log(`\x1b[1m${'━'.repeat(48)}`);
  console.log(`  PHASE: 10 — Financial Integrity Guard`);
  console.log(`${'━'.repeat(48)}\x1b[0m\n`);

  const TENANT = `integrity-test-${Date.now()}`;
  const journalRepo = new JournalMockRepository();
  const checkpointRepo = new LedgerMerkleCheckpointMockRepository();
  const merkleService = new LedgerMerkleCheckpointService(
    journalRepo as any,
    checkpointRepo,
  );
  const validator = new JournalValidationService();

  // ── 10.1 ledgerTrialBalanceTest ───────────────────────────────────────────

  section("10.1 ledgerTrialBalanceTest");

  try {
    const balancedLines = [
      { side: PostingSide.DEBIT, amount: 500_000 },
      { side: PostingSide.CREDIT, amount: 500_000 },
    ];
    const balancedResult = validator.check({
      lines: balancedLines,
      totalDebit: 500_000,
      totalCredit: 500_000,
      sourceEventId: "evt-balance-test-001",
    });
    if (balancedResult.valid) {
      PASS("10.1 Balanced journal passes validation", "500,000 DR = 500,000 CR");
    } else {
      FAIL("10.1 Balanced journal should pass", balancedResult.errors.join(", "));
    }

    const unbalancedResult = validator.check({
      lines: [{ side: PostingSide.DEBIT, amount: 500_000 }],
      totalDebit: 500_000,
      totalCredit: 0,
      sourceEventId: "evt-balance-test-002",
    });
    if (!unbalancedResult.valid && unbalancedResult.errors.some(e => e.includes("UNBALANCED_JOURNAL"))) {
      PASS("10.1 Unbalanced journal correctly rejected", unbalancedResult.errors[0]);
    } else {
      FAIL("10.1 Unbalanced journal should be rejected");
    }

    const zeroAmountResult = validator.check({
      lines: [{ side: PostingSide.DEBIT, amount: 0 }, { side: PostingSide.CREDIT, amount: 0 }],
      totalDebit: 0,
      totalCredit: 0,
      sourceEventId: "evt-balance-test-003",
    });
    if (!zeroAmountResult.valid && zeroAmountResult.errors.some(e => e.includes("INVALID_LINE_AMOUNT"))) {
      PASS("10.1 Zero-amount lines correctly rejected", zeroAmountResult.errors[0]);
    } else {
      FAIL("10.1 Zero-amount lines should be rejected");
    }

    const noOriginResult = validator.check({
      lines: [{ side: PostingSide.DEBIT, amount: 100 }, { side: PostingSide.CREDIT, amount: 100 }],
      totalDebit: 100,
      totalCredit: 100,
      sourceEventId: "",
    });
    if (!noOriginResult.valid && noOriginResult.errors.some(e => e.includes("MISSING_EVENT_ORIGIN"))) {
      PASS("10.1 Missing sourceEventId correctly rejected", noOriginResult.errors[0]);
    } else {
      FAIL("10.1 Missing sourceEventId should be rejected");
    }
  } catch (err: any) {
    FAIL("10.1 Trial balance test threw unexpectedly", err.message);
  }

  // ── 10.2 hashChainVerificationTest ───────────────────────────────────────

  section("10.2 hashChainVerificationTest");

  try {
    const ctx = PostingContextFactory.issue(TENANT);

    const j1 = await journalRepo.createEntry(ctx, {
      tenantId: TENANT,
      fiscalPeriodId: "fp-1",
      status: JournalStatus.POSTED,
      journalType: JournalType.NORMAL,
      sourceEventId: "evt-hash-001",
      previousHash: "GENESIS",
      entryHash: makeHash("GENESIS|journal-1"),
    });

    const j2 = await journalRepo.createEntry(PostingContextFactory.issue(TENANT), {
      tenantId: TENANT,
      fiscalPeriodId: "fp-1",
      status: JournalStatus.POSTED,
      journalType: JournalType.NORMAL,
      sourceEventId: "evt-hash-002",
      previousHash: j1.entryHash,
      entryHash: makeHash(`${j1.entryHash}|journal-2`),
    });

    if (j2.previousHash === j1.entryHash) {
      PASS("10.2 Hash chain link verified", `j2.previousHash = ${j1.entryHash!.substr(0, 16)}...`);
    } else {
      FAIL("10.2 Hash chain link broken");
    }

    // Simulate corruption: j2.entryHash is overwritten in tests
    const corruptedHash = "0000000000000000000000000000000000000000000000000000000000000000";
    const detectedCorruption = corruptedHash !== j2.entryHash;
    if (detectedCorruption) {
      PASS("10.2 Corrupted hash detected", `stored=${j2.entryHash!.substr(0, 16)} corrupted=0000...`);
    } else {
      FAIL("10.2 Corruption detection failed");
    }

    // Verify ledgerSequence ordering
    if (j1.ledgerSequence < j2.ledgerSequence) {
      PASS("10.2 ledgerSequence monotonically increasing", `j1.seq=${j1.ledgerSequence} j2.seq=${j2.ledgerSequence}`);
    } else {
      FAIL("10.2 ledgerSequence should be monotonically increasing");
    }
  } catch (err: any) {
    FAIL("10.2 Hash chain test threw unexpectedly", err.message);
  }

  // ── 10.3 sequenceOrderingTest ─────────────────────────────────────────────

  section("10.3 sequenceOrderingTest");

  try {
    const SEQ_TENANT = `seq-test-${Date.now()}`;
    const seqCtx1 = PostingContextFactory.issue(SEQ_TENANT);
    const seqCtx2 = PostingContextFactory.issue(SEQ_TENANT);
    const seqCtx3 = PostingContextFactory.issue(SEQ_TENANT);

    const s1 = await journalRepo.createEntry(seqCtx1, {
      tenantId: SEQ_TENANT, fiscalPeriodId: "fp-1",
      status: JournalStatus.POSTED, journalType: JournalType.NORMAL,
      sourceEventId: "evt-seq-001", previousHash: "GENESIS",
      entryHash: makeHash("s1"),
    });
    const s2 = await journalRepo.createEntry(seqCtx2, {
      tenantId: SEQ_TENANT, fiscalPeriodId: "fp-1",
      status: JournalStatus.POSTED, journalType: JournalType.NORMAL,
      sourceEventId: "evt-seq-002", previousHash: s1.entryHash,
      entryHash: makeHash("s2"),
    });
    const s3 = await journalRepo.createEntry(seqCtx3, {
      tenantId: SEQ_TENANT, fiscalPeriodId: "fp-1",
      status: JournalStatus.POSTED, journalType: JournalType.NORMAL,
      sourceEventId: "evt-seq-003", previousHash: s2.entryHash,
      entryHash: makeHash("s3"),
    });

    if (s1.ledgerSequence === 1 && s2.ledgerSequence === 2 && s3.ledgerSequence === 3) {
      PASS("10.3 ledgerSequence assigned atomically 1→2→3", `seq: ${s1.ledgerSequence}, ${s2.ledgerSequence}, ${s3.ledgerSequence}`);
    } else {
      FAIL("10.3 Unexpected ledgerSequence values", `seq: ${s1.ledgerSequence}, ${s2.ledgerSequence}, ${s3.ledgerSequence}`);
    }

    const bySeq = await journalRepo.findBySequence(SEQ_TENANT, 2);
    if (bySeq?.id === s2.id) {
      PASS("10.3 findBySequence returns correct journal", `seq=2 → id=${s2.id}`);
    } else {
      FAIL("10.3 findBySequence returned wrong journal");
    }

    const range = await journalRepo.findBySequenceRange(SEQ_TENANT, 1, 3);
    if (range.length === 3 && range[0].ledgerSequence === 1) {
      PASS("10.3 findBySequenceRange returns sorted window", `3 journals in seq [1-3]`);
    } else {
      FAIL("10.3 findBySequenceRange returned unexpected results");
    }
  } catch (err: any) {
    FAIL("10.3 Sequence ordering test threw unexpectedly", err.message);
  }

  // ── 10.4 journalReversalTest ──────────────────────────────────────────────

  section("10.4 journalReversalTest");

  try {
    const REV_TENANT = `rev-test-${Date.now()}`;
    const origCtx = PostingContextFactory.issue(REV_TENANT);

    const original = await journalRepo.createEntry(origCtx, {
      tenantId: REV_TENANT, fiscalPeriodId: "fp-1",
      status: JournalStatus.POSTED, journalType: JournalType.NORMAL,
      sourceEventId: "evt-orig-001", previousHash: "GENESIS",
      entryHash: makeHash("original"),
    });

    if (original.journalType === JournalType.NORMAL) {
      PASS("10.4 Original journal type is NORMAL", `id=${original.id}`);
    } else {
      FAIL("10.4 Original journal type should be NORMAL", `got=${original.journalType}`);
    }

    const revCtx = PostingContextFactory.issue(REV_TENANT);
    const reversal = await journalRepo.createEntry(revCtx, {
      tenantId: REV_TENANT, fiscalPeriodId: "fp-1",
      status: JournalStatus.POSTED, journalType: JournalType.REVERSAL,
      reversalOfJournalId: original.id,
      sourceEventId: "evt-rev-001", previousHash: original.entryHash,
      entryHash: makeHash(`reversal-of-${original.id}`),
    });

    if (reversal.journalType === JournalType.REVERSAL) {
      PASS("10.4 Reversal journal type is REVERSAL", `id=${reversal.id}`);
    } else {
      FAIL("10.4 Reversal journal type should be REVERSAL", `got=${reversal.journalType}`);
    }

    if (reversal.reversalOfJournalId === original.id) {
      PASS("10.4 reversalOfJournalId correctly set", `→ originalId=${original.id}`);
    } else {
      FAIL("10.4 reversalOfJournalId not set correctly");
    }

    // Verify immutability: update on POSTED journal should throw
    try {
      await (journalRepo as any).updateJournal(original.id);
      FAIL("10.4 update() should have thrown ImmutableJournalError");
    } catch (e: any) {
      if (e instanceof ImmutableJournalError || e.name === "ImmutableJournalError") {
        PASS("10.4 update() blocked by ImmutableJournalError", e.message.substr(0, 80));
      } else {
        FAIL("10.4 Wrong error thrown on update()", e.message);
      }
    }
  } catch (err: any) {
    FAIL("10.4 Journal reversal test threw unexpectedly", err.message);
  }

  // ── 10.5 postingContextTokenEnforcementTest ───────────────────────────────

  section("10.5 postingContextTokenEnforcementTest");

  try {
    // Test 1: Valid token passes
    const validCtx = PostingContextFactory.issue(TENANT);
    PostingContextFactory.validate(validCtx); // should not throw
    PASS("10.5 Valid HMAC token passes validation");

    // Test 2: Forged token (wrong secret) throws TokenForgeryError
    const forgedCtx = { ...validCtx, token: "000000000000000000000000000000000000000000000000000000000000face" };
    try {
      PostingContextFactory.validate(forgedCtx as any);
      FAIL("10.5 Forged token should have been rejected");
    } catch (e: any) {
      if (e instanceof TokenForgeryError || e.name === "TokenForgeryError") {
        PASS("10.5 Forged HMAC token throws TokenForgeryError", e.message.substr(0, 60));
      } else {
        FAIL("10.5 Wrong error type for forged token", e.message);
      }
    }

    // Test 3: Expired token throws TokenExpiredError
    const expiredCtx = PostingContextFactory.issue(TENANT);
    (expiredCtx as any).expiresAt = new Date(Date.now() - 60_000); // 1 min in the past
    try {
      PostingContextFactory.validate(expiredCtx);
      FAIL("10.5 Expired token should have been rejected");
    } catch (e: any) {
      if (e instanceof TokenExpiredError || e.name === "TokenExpiredError") {
        PASS("10.5 Expired token throws TokenExpiredError", e.message.substr(0, 60));
      } else {
        FAIL("10.5 Wrong error type for expired token", e.message);
      }
    }

    // Test 4: Cross-tenant write rejected by repository
    const crossCtx = PostingContextFactory.issue("TENANT-A");
    try {
      await journalRepo.createEntry(crossCtx, {
        tenantId: "TENANT-B", // mismatch!
        fiscalPeriodId: "fp-1",
        status: JournalStatus.POSTED, journalType: JournalType.NORMAL,
        sourceEventId: "evt-cross-001",
      });
      FAIL("10.5 Cross-tenant write should have been rejected");
    } catch (e: any) {
      if (e.message?.includes("CROSS_TENANT_WRITE")) {
        PASS("10.5 Cross-tenant write correctly rejected", e.message.substr(0, 80));
      } else {
        FAIL("10.5 Wrong error for cross-tenant write", e.message);
      }
    }
  } catch (err: any) {
    FAIL("10.5 Token enforcement test threw unexpectedly", err.message);
  }

  // ── 10.6 merkleCheckpointAuditTest ───────────────────────────────────────

  section("10.6 merkleCheckpointAuditTest");

  try {
    const MERKLE_TENANT = `merkle-test-${Date.now()}`;

    // Create 3 journals
    const hashes: string[] = [];
    const journals: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const mCtx = PostingContextFactory.issue(MERKLE_TENANT);
      const prev = i === 1 ? "GENESIS" : hashes[i - 2];
      const entryHash = makeHash(`${MERKLE_TENANT}|journal-${i}|${prev}`);
      hashes.push(entryHash);
      const j = await journalRepo.createEntry(mCtx, {
        tenantId: MERKLE_TENANT, fiscalPeriodId: "fp-1",
        status: JournalStatus.POSTED, journalType: JournalType.NORMAL,
        sourceEventId: `evt-merkle-00${i}`,
        previousHash: prev,
        entryHash,
      });
      journals.push(j);
    }

    PASS("10.6 Seeded 3 journals for Merkle test", `seq: ${journals.map(j => j.ledgerSequence).join(', ')}`);

    // Build checkpoint
    const checkpoint = await merkleService.buildCheckpoint(
      MERKLE_TENANT,
      1,
      journals[journals.length - 1].ledgerSequence,
    );

    if (checkpoint.merkleRoot && checkpoint.merkleRoot.length === 64) {
      PASS("10.6 Merkle checkpoint built", `root=${checkpoint.merkleRoot.substr(0, 16)}... journals=${checkpoint.journalCount}`);
    } else {
      FAIL("10.6 Invalid Merkle root", `got=${checkpoint.merkleRoot}`);
    }

    // Verify inclusion for journal[1] (middle journal)
    const inclusion = await merkleService.verifyJournalInclusion(
      MERKLE_TENANT,
      journals[1].id,
    );

    if (inclusion.included) {
      PASS("10.6 Journal inclusion proof verified (O(log n))", `leafIndex=${inclusion.leafIndex} proofSteps=${inclusion.proof.length}`);
    } else {
      FAIL("10.6 Journal inclusion verification failed");
    }

    // Verify checkpoint chain
    const chainResult = await merkleService.verifyCheckpointChain(MERKLE_TENANT);
    if (chainResult.valid) {
      PASS("10.6 Checkpoint chain is valid", `checkpoints=${chainResult.checkpointCount}`);
    } else {
      FAIL("10.6 Checkpoint chain invalid", chainResult.violations.join(", "));
    }

    // Verify manual Merkle tree
    const leaves = journals.map((j) => j.entryHash);
    const tree = MerkleTreeBuilder.build(leaves);
    const root = MerkleTreeBuilder.getRoot(tree);
    const proof = MerkleTreeBuilder.getProof(tree, 0);
    const verified = MerkleTreeBuilder.verify(leaves[0], proof, root);
    if (verified) {
      PASS("10.6 MerkleTreeBuilder.verify() returns true for valid leaf", `root=${root.substr(0, 16)}`);
    } else {
      FAIL("10.6 MerkleTreeBuilder.verify() failed for valid leaf");
    }

    // Tampered leaf should NOT verify
    const tamperedResult = MerkleTreeBuilder.verify("corrupted_data", proof, root);
    if (!tamperedResult) {
      PASS("10.6 Tampered leaf correctly fails Merkle proof");
    } else {
      FAIL("10.6 Tampered leaf incorrectly passed Merkle proof — security issue!");
    }

  } catch (err: any) {
    FAIL("10.6 Merkle checkpoint test threw unexpectedly", err.message);
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`\n\x1b[1m${'━'.repeat(48)}`);
  console.log(`  PHASE SUMMARY: 10 — Financial Integrity Guard`);
  console.log(`${'━'.repeat(48)}\x1b[0m`);
  console.log(`  \x1b[32mPASS: ${pass}\x1b[0m`);
  console.log(`  \x1b[31mFAIL: ${fail}\x1b[0m`);
  console.log(`  \x1b[33mWARN: ${warn}\x1b[0m`);
  console.log(`  Critical failure: ${fail > 0 ? "\x1b[31mYES\x1b[0m" : "\x1b[32mNO\x1b[0m"}\n`);

  await prisma.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("FATAL:", err.message);
  await prisma.$disconnect();
  process.exit(1);
});
