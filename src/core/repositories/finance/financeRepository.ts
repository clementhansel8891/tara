import type { MoneySource } from "@/core/types/finance/accounts";
import type {
  TreasuryTransfer,
  SettlementRecord,
} from "@/core/types/finance/treasury";
import type { PaymentRequest } from "@/core/types/finance/payments";
import type { ReceivableInvoice } from "@/core/types/finance/receivables";
import type { PayableBill } from "@/core/types/finance/payables";
import type { JournalEntry } from "@/core/types/finance/ledger";
import type {
  AssetDepreciationEntry,
  AssetEvent,
  CapexRequest,
  FixedAsset,
} from "@/core/types/finance/assets";

export type Asset = FixedAsset;

export interface FinanceRepository {
  listSources: (tenantId: string) => MoneySource[];
  updateSource: (
    tenantId: string,
    sourceId: string,
    patch: Partial<MoneySource>,
  ) => MoneySource | null;

  listTransfers: (tenantId: string) => TreasuryTransfer[];
  createTransfer: (
    tenantId: string,
    transfer: TreasuryTransfer,
  ) => TreasuryTransfer;
  listSettlements: (tenantId: string) => SettlementRecord[];
  createSettlement: (
    tenantId: string,
    settlement: SettlementRecord,
  ) => SettlementRecord;

  listPaymentRequests: (tenantId: string) => PaymentRequest[];
  createPaymentRequest: (
    tenantId: string,
    payload: PaymentRequest,
  ) => PaymentRequest;
  updatePaymentRequest: (
    tenantId: string,
    id: string,
    patch: Partial<PaymentRequest>,
  ) => PaymentRequest | null;

  listReceivables: (tenantId: string) => ReceivableInvoice[];
  createReceivable: (
    tenantId: string,
    payload: ReceivableInvoice,
  ) => ReceivableInvoice;
  updateReceivable: (
    tenantId: string,
    id: string,
    patch: Partial<ReceivableInvoice>,
  ) => ReceivableInvoice | null;

  listPayables: (tenantId: string) => PayableBill[];
  createPayable: (tenantId: string, payload: PayableBill) => PayableBill;
  updatePayable: (
    tenantId: string,
    id: string,
    patch: Partial<PayableBill>,
  ) => PayableBill | null;

  listJournalEntries: (tenantId: string) => JournalEntry[];
  createJournalEntry: (tenantId: string, payload: JournalEntry) => JournalEntry;
  updateJournalEntry: (
    tenantId: string,
    id: string,
    patch: Partial<JournalEntry>,
  ) => JournalEntry | null;

  listAssets: (tenantId: string) => Asset[];
  createAsset: (
    tenantId: string,
    asset: Omit<
      Asset,
      "id" | "createdAt" | "updatedAt" | "accumulatedDepreciation" | "carryingValue" | "revaluationReserve"
    >,
  ) => Asset;
  updateAsset: (
    tenantId: string,
    id: string,
    patch: Partial<Asset>,
  ) => Asset | null;

  listCapexRequests: (tenantId: string) => CapexRequest[];
  createCapexRequest: (
    tenantId: string,
    payload: CapexRequest,
  ) => CapexRequest;
  updateCapexRequest: (
    tenantId: string,
    id: string,
    patch: Partial<CapexRequest>,
  ) => CapexRequest | null;

  listAssetDepreciationEntries: (tenantId: string) => AssetDepreciationEntry[];
  createAssetDepreciationEntry: (
    tenantId: string,
    payload: AssetDepreciationEntry,
  ) => AssetDepreciationEntry;

  listAssetEvents: (tenantId: string) => AssetEvent[];
  createAssetEvent: (tenantId: string, payload: AssetEvent) => AssetEvent;
}
