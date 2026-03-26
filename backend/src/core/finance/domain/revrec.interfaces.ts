import { Prisma } from '@prisma/client';

export enum RevRecStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export interface RecognitionPeriod {
  date: Date;
  amount: Prisma.Decimal;
  status: 'PENDING' | 'POSTED' | 'FAILED';
  journalId?: string;
}

export interface RevRecSchedule {
  id: string;
  tenantId: string;
  companyId: string;
  contractId: string;
  totalAmount: Prisma.Decimal;
  currency: string;
  startDate: Date;
  endDate: Date;
  status: RevRecStatus;
  deferredAccountId: string;
  revenueAccountId: string;
  periods: RecognitionPeriod[];
}

export interface RecognitionEvent {
  id: string;
  scheduleId: string;
  tenantId: string;
  companyId: string;
  amount: Prisma.Decimal;
  currency: string;
  periodDate: Date;
  status: 'DRAFT' | 'POSTED' | 'FAILED';
}
