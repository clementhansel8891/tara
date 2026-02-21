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
  listSources: (tenantId: string) => Promise<MoneySource[]>;
  updateSource: (
    tenantId: string,
    sourceId: string,
    patch: Partial<MoneySource>,
  ) => Promise<MoneySource | null>;

  listTransfers: (tenantId: string) => Promise<TreasuryTransfer[]>;
  createTransfer: (
    tenantId: string,
    transfer: TreasuryTransfer,
  ) => Promise<TreasuryTransfer>;
  listSettlements: (tenantId: string) => Promise<SettlementRecord[]>;
  createSettlement: (
    tenantId: string,
    settlement: SettlementRecord,
  ) => Promise<SettlementRecord>;

  listPaymentRequests: (tenantId: string) => Promise<PaymentRequest[]>;
  createPaymentRequest: (
    tenantId: string,
    payload: PaymentRequest,
  ) => Promise<PaymentRequest>;
  updatePaymentRequest: (
    tenantId: string,
    id: string,
    patch: Partial<PaymentRequest>,
  ) => Promise<PaymentRequest | null>;

  listReceivables: (tenantId: string) => Promise<ReceivableInvoice[]>;
  createReceivable: (
    tenantId: string,
    payload: ReceivableInvoice,
  ) => Promise<ReceivableInvoice>;
  updateReceivable: (
    tenantId: string,
    id: string,
    patch: Partial<ReceivableInvoice>,
  ) => Promise<ReceivableInvoice | null>;

  listPayables: (tenantId: string) => Promise<PayableBill[]>;
  createPayable: (tenantId: string, payload: PayableBill) => Promise<PayableBill>;
  updatePayable: (
    tenantId: string,
    id: string,
    patch: Partial<PayableBill>,
  ) => Promise<PayableBill | null>;

  listJournalEntries: (tenantId: string) => Promise<JournalEntry[]>;
  createJournalEntry: (tenantId: string, payload: JournalEntry) => Promise<JournalEntry>;
  updateJournalEntry: (
    tenantId: string,
    id: string,
    patch: Partial<JournalEntry>,
  ) => Promise<JournalEntry | null>;

  listAssets: (tenantId: string) => Promise<Asset[]>;
  createAsset: (
    tenantId: string,
    asset: Omit<
      Asset,
      "id" | "createdAt" | "updatedAt" | "accumulatedDepreciation" | "carryingValue" | "revaluationReserve"
    >,
  ) => Promise<Asset>;
  updateAsset: (
    tenantId: string,
    id: string,
    patch: Partial<Asset>,
  ) => Promise<Asset | null>;

  listCapexRequests: (tenantId: string) => Promise<CapexRequest[]>;
  createCapexRequest: (
    tenantId: string,
    payload: CapexRequest,
  ) => Promise<CapexRequest>;
  updateCapexRequest: (
    tenantId: string,
    id: string,
    patch: Partial<CapexRequest>,
  ) => Promise<CapexRequest | null>;

  listAssetDepreciationEntries: (tenantId: string) => Promise<AssetDepreciationEntry[]>;
  createAssetDepreciationEntry: (
    tenantId: string,
    payload: AssetDepreciationEntry,
  ) => Promise<AssetDepreciationEntry>;

  listAssetEvents: (tenantId: string) => Promise<AssetEvent[]>;
  createAssetEvent: (tenantId: string, payload: AssetEvent) => Promise<AssetEvent>;
}
