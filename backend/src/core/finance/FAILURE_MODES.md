# Zenvix Finance: Failure Mode Design & Recovery

This document defines the system behavior and recovery strategies for real-world production failure conditions.

## 1. Database Outage

- **Symptoms:** `IAccountBalanceRepository` or `IJournalRepository` throws ConnectionError.
- **Immediate Behavior:**
  - Hot path (API) returns 503 Service Unavailable.
  - Background processes (Worker) stop processing and remain in `PENDING` state.

- **Recovery:**
  - Standard NestJS/Prisma connection pooling will auto-reconnect.
  - Workers resume from the last successful `ledgerSequence` using the idempotency logs.

## 2. Worker Crash Loop

- **Symptoms:** `LedgerWorkerService` restarts repeatedly during `processEvent`.
- **Mitigation:**
  - Atomic transactions via `IUnitOfWork` ensure no partial postings.
  - `LedgerPostingStatus.PROCESSING` state prevents concurrent double-processing.

- **Recovery:**
  - On restart, the worker identifies items stuck in `PROCESSING` for > 5 minutes (via `updatedAt`) and resets them to `PENDING`.

## 3. Partial Posting / Split-Brain

- **Symptoms:** JournalEntry created but Balance not updated.
- **Detection:** `LedgerIntegrityService` (hourly) detects drift between Journal history and Balance records.
- **Resolution:**
  - **Auto-Repair:** `LedgerIntegrityService.autoRepairBalance()` recalculates the true balance from the ledger and force-updates the record.
  - **Manual Review:** If repair fails (e.g., version conflict), the account is flagged for manual CFO review.

## 4. High Contention (Retry Storms)

- **Symptoms:** 500+ concurrent updates to the same account (e.g., "Cash").
- **Mitigation:**
  - **Exponential Backoff:** Retries in the repository use jittered delays (5ms to 100ms) to spread the load.
  - **Max Retries:** 25 attempts before failing to protect the event loop.

- **Recovery:**
  - Failed events move to `FAILED` status with a `nextRetryAt` timestamp using worker-level exponential backoff.

## 5. Corrupted Ledger Hash Chain

- **Symptoms:** `verifyJournalHashChain` detects a mismatch.
- **Action:**
  - Immediate stop of auditing for the affected company.
  - System Alert: `CRITICAL_LEDGER_TAMPER_DETECTED`.

- **Recovery:**
  - Restore from the last "Hash Anchor" (Daily backup) + Replay events from the source event log.
