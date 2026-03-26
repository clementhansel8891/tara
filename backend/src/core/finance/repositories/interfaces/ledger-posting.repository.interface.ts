import { LedgerPosting, LedgerPostingLine, LedgerIdempotency } from '../../domain/finance.interfaces';
import { LedgerPostingStatus } from '../../domain/finance.constants';
import { Prisma } from '@prisma/client';

export interface ILedgerPostingRepository {
  createPosting(tenantId: string, companyId: string, data: Partial<LedgerPosting>, tx?: Prisma.TransactionClient): Promise<LedgerPosting>;
  createLines(postingId: string, lines: Partial<LedgerPostingLine>[], tx?: Prisma.TransactionClient): Promise<void>;
  updateStatus(tenantId: string, companyId: string, postingId: string, status: LedgerPostingStatus, retryCount?: number, failureReason?: string): Promise<LedgerPosting>;
  findPending(tenantId: string, companyId?: string): Promise<LedgerPosting[]>;
  claimPostings(tenantId: string, companyId: string, batchSize: number): Promise<LedgerPosting[]>;
  findById(tenantId: string, companyId: string, id: string): Promise<LedgerPosting | null>;
  getDeadLetterPostings(tenantId: string, companyId: string): Promise<LedgerPosting[]>;
  findLines(postingId: string): Promise<LedgerPostingLine[]>;
  
  // Idempotency
  checkIdempotency(tenantId: string, companyId: string, sourceEventId: string, tx?: Prisma.TransactionClient): Promise<boolean>;
  createIdempotency(tenantId: string, companyId: string, sourceEventId: string, tx?: Prisma.TransactionClient): Promise<void>;
  findStuckProcessing(tenantId: string, companyId: string, threshold: Date): Promise<LedgerPosting[]>;
  findByStatus(tenantId: string, companyId: string, status: LedgerPostingStatus): Promise<LedgerPosting[]>;
}
