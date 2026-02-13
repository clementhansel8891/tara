import type { Asset, FinanceRepository } from "./financeRepository";
import type { MoneySource } from "@/core/types/finance/accounts";
import type { JournalEntry } from "@/core/types/finance/ledger";
import type { PaymentRequest } from "@/core/types/finance/payments";
import type { PayableBill } from "@/core/types/finance/payables";
import type { ReceivableInvoice } from "@/core/types/finance/receivables";
import type {
  AssetDepreciationEntry,
  AssetEvent,
  CapexRequest,
} from "@/core/types/finance/assets";
import type {
  SettlementRecord,
  TreasuryTransfer,
} from "@/core/types/finance/treasury";
import {
  ensureSeed,
  loadFromStorage,
  saveToStorage,
} from "@/core/repositories/hr/storage";

const sourcesKey = (tenantId: string) => `fin:${tenantId}:sources`;
const transfersKey = (tenantId: string) => `fin:${tenantId}:transfers`;
const settlementsKey = (tenantId: string) => `fin:${tenantId}:settlements`;
const paymentsKey = (tenantId: string) => `fin:${tenantId}:payments`;
const receivablesKey = (tenantId: string) => `fin:${tenantId}:receivables`;
const payablesKey = (tenantId: string) => `fin:${tenantId}:payables`;
const journalKey = (tenantId: string) => `fin:${tenantId}:journals`;
const assetsKey = (tenantId: string) => `fin:${tenantId}:assets`;
const capexKey = (tenantId: string) => `fin:${tenantId}:capex`;
const assetDepEntriesKey = (tenantId: string) => `fin:${tenantId}:asset-dep`;
const assetEventsKey = (tenantId: string) => `fin:${tenantId}:asset-events`;

const now = () => new Date().toISOString();
const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const seedSources = (tenantId: string): MoneySource[] => [
  {
    id: `${tenantId}-bank-001`,
    tenantId,
    name: "BCA Operating",
    type: "BANK",
    currency: "IDR",
    balance: 125000000,
    pendingSettlement: 4500000,
    provider: "BCA",
    lastUpdated: now(),
  },
  {
    id: `${tenantId}-wallet-gopay`,
    tenantId,
    name: "GoPay Wallet",
    type: "E_WALLET",
    currency: "IDR",
    balance: 18500000,
    pendingSettlement: 1200000,
    provider: "GoPay",
    lastUpdated: now(),
  },
  {
    id: `${tenantId}-cash-001`,
    tenantId,
    name: "Store Cash Register A",
    type: "CASH_REGISTER",
    currency: "IDR",
    balance: 3200000,
    pendingSettlement: 0,
    provider: "POS",
    lastUpdated: now(),
  },
];

const seedReceivables = (tenantId: string): ReceivableInvoice[] => [
  {
    id: `${tenantId}-ar-001`,
    tenantId,
    customerName: "Acme Retail",
    amount: 28000000,
    currency: "IDR",
    dueDate: "2026-03-05",
    status: "issued",
    agingBucket: "0-30",
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedPayables = (tenantId: string): PayableBill[] => [
  {
    id: `${tenantId}-ap-001`,
    tenantId,
    vendorName: "Fresh Supply Co",
    amount: 18000000,
    currency: "IDR",
    dueDate: "2026-02-20",
    status: "pending",
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedJournals = (tenantId: string): JournalEntry[] => [
  {
    id: `${tenantId}-jr-budget-ops`,
    tenantId,
    description: "CAPEX budget allocation for OPERATIONS",
    lines: [
      {
        accountCode: "BUD-CAPEX-OPERATIONS",
        description: "CAPEX budget allocation",
        debit: 50000000000,
        credit: 0,
      },
      {
        accountCode: "BUD-CONTROL",
        description: "Budget control balancing line",
        debit: 0,
        credit: 50000000000,
      },
    ],
    status: "posted",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: `${tenantId}-jr-budget-production`,
    tenantId,
    description: "CAPEX budget allocation for PRODUCTION",
    lines: [
      {
        accountCode: "BUD-CAPEX-PRODUCTION",
        description: "CAPEX budget allocation",
        debit: 25000000000,
        credit: 0,
      },
      {
        accountCode: "BUD-CONTROL",
        description: "Budget control balancing line",
        debit: 0,
        credit: 25000000000,
      },
    ],
    status: "posted",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: `${tenantId}-jr-budget-finance`,
    tenantId,
    description: "CAPEX budget allocation for FINANCE",
    lines: [
      {
        accountCode: "BUD-CAPEX-FINANCE",
        description: "CAPEX budget allocation",
        debit: 10000000000,
        credit: 0,
      },
      {
        accountCode: "BUD-CONTROL",
        description: "Budget control balancing line",
        debit: 0,
        credit: 10000000000,
      },
    ],
    status: "posted",
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedAssets = (tenantId: string): Asset[] => [
  {
    id: `${tenantId}-fa-001`,
    tenantId,
    description: "Office Building Bali",
    assetClass: "BUILDING",
    location: "Bali Branch",
    department: "Operations",
    acquisitionDate: "2026-01-01",
    acquisitionCost: 50000000000,
    usefulLifeYears: 25,
    depreciationMethod: "STRAIGHT_LINE",
    residualValue: 5000000000,
    status: "ACTIVE",
    capitalizationDate: "2026-01-15",
    accumulatedDepreciation: 0,
    carryingValue: 50000000000,
    revaluationReserve: 0,
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedCapexRequests = (tenantId: string): CapexRequest[] => [
  {
    id: `${tenantId}-capex-001`,
    tenantId,
    assetDescription: "Factory CNC Machine",
    requestedAmount: 3000000000,
    department: "Production",
    requestedBy: "user-demo",
    status: "PENDING_HOD_APPROVAL",
    approvedBy: [],
    requiredApprovals: ["HOD", "CFO"],
    currentApprovalStage: "HOD",
    budgetMatched: true,
    notes: "Annual expansion CAPEX",
    createdAt: now(),
    updatedAt: now(),
  },
];

export const mockFinanceRepo: FinanceRepository = {
  listSources(tenantId) {
    return ensureSeed(sourcesKey(tenantId), seedSources(tenantId));
  },
  updateSource(tenantId, sourceId, patch) {
    const items = this.listSources(tenantId);
    let updated: MoneySource | null = null;
    const next = items.map((item) => {
      if (item.id !== sourceId) return item;
      updated = { ...item, ...patch, lastUpdated: now() };
      return updated;
    });
    if (updated) saveToStorage(sourcesKey(tenantId), next);
    return updated;
  },

  listTransfers(tenantId) {
    return loadFromStorage<TreasuryTransfer[]>(transfersKey(tenantId), []);
  },
  createTransfer(tenantId, transfer) {
    const items = this.listTransfers(tenantId);
    const next = [transfer, ...items];
    saveToStorage(transfersKey(tenantId), next);
    return transfer;
  },

  listSettlements(tenantId) {
    return loadFromStorage<SettlementRecord[]>(settlementsKey(tenantId), []);
  },
  createSettlement(tenantId, settlement) {
    const items = this.listSettlements(tenantId);
    const next = [settlement, ...items];
    saveToStorage(settlementsKey(tenantId), next);
    return settlement;
  },

  listPaymentRequests(tenantId) {
    return loadFromStorage<PaymentRequest[]>(paymentsKey(tenantId), []);
  },
  createPaymentRequest(tenantId, payload) {
    const items = this.listPaymentRequests(tenantId);
    const next = [payload, ...items];
    saveToStorage(paymentsKey(tenantId), next);
    return payload;
  },
  updatePaymentRequest(tenantId, id, patch) {
    const items = this.listPaymentRequests(tenantId);
    let updated: PaymentRequest | null = null;
    const next = items.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, updatedAt: now() };
      return updated;
    });
    if (updated) saveToStorage(paymentsKey(tenantId), next);
    return updated;
  },

  listReceivables(tenantId) {
    return ensureSeed(receivablesKey(tenantId), seedReceivables(tenantId));
  },
  createReceivable(tenantId, payload) {
    const items = this.listReceivables(tenantId);
    const next = [payload, ...items];
    saveToStorage(receivablesKey(tenantId), next);
    return payload;
  },
  updateReceivable(tenantId, id, patch) {
    const items = this.listReceivables(tenantId);
    let updated: ReceivableInvoice | null = null;
    const next = items.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, updatedAt: now() };
      return updated;
    });
    if (updated) saveToStorage(receivablesKey(tenantId), next);
    return updated;
  },

  listPayables(tenantId) {
    return ensureSeed(payablesKey(tenantId), seedPayables(tenantId));
  },
  createPayable(tenantId, payload) {
    const items = this.listPayables(tenantId);
    const next = [payload, ...items];
    saveToStorage(payablesKey(tenantId), next);
    return payload;
  },
  updatePayable(tenantId, id, patch) {
    const items = this.listPayables(tenantId);
    let updated: PayableBill | null = null;
    const next = items.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, updatedAt: now() };
      return updated;
    });
    if (updated) saveToStorage(payablesKey(tenantId), next);
    return updated;
  },

  listJournalEntries(tenantId) {
    return ensureSeed(journalKey(tenantId), seedJournals(tenantId));
  },
  createJournalEntry(tenantId, payload) {
    const items = this.listJournalEntries(tenantId);
    const next = [payload, ...items];
    saveToStorage(journalKey(tenantId), next);
    return payload;
  },
  updateJournalEntry(tenantId, id, patch) {
    const items = this.listJournalEntries(tenantId);
    let updated: JournalEntry | null = null;
    const next = items.map((entry) => {
      if (entry.id !== id) return entry;
      updated = { ...entry, ...patch, updatedAt: now() };
      return updated;
    });
    if (updated) saveToStorage(journalKey(tenantId), next);
    return updated;
  },

  listAssets(tenantId) {
    return ensureSeed(assetsKey(tenantId), seedAssets(tenantId));
  },
  createAsset(tenantId, payload) {
    const items = this.listAssets(tenantId);
    const newAsset: Asset = {
      id: makeId("fa"),
      accumulatedDepreciation: 0,
      carryingValue: payload.acquisitionCost,
      revaluationReserve: 0,
      createdAt: now(),
      updatedAt: now(),
      ...payload,
    };
    const next = [newAsset, ...items];
    saveToStorage(assetsKey(tenantId), next);
    return newAsset;
  },
  updateAsset(tenantId, id, patch) {
    const items = this.listAssets(tenantId);
    let updated: Asset | null = null;
    const next = items.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, updatedAt: now() };
      return updated;
    });
    if (updated) saveToStorage(assetsKey(tenantId), next);
    return updated;
  },

  listCapexRequests(tenantId) {
    return ensureSeed(capexKey(tenantId), seedCapexRequests(tenantId));
  },
  createCapexRequest(tenantId, payload) {
    const items = this.listCapexRequests(tenantId);
    const next = [payload, ...items];
    saveToStorage(capexKey(tenantId), next);
    return payload;
  },
  updateCapexRequest(tenantId, id, patch) {
    const items = this.listCapexRequests(tenantId);
    let updated: CapexRequest | null = null;
    const next = items.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, updatedAt: now() };
      return updated;
    });
    if (updated) saveToStorage(capexKey(tenantId), next);
    return updated;
  },

  listAssetDepreciationEntries(tenantId) {
    return loadFromStorage<AssetDepreciationEntry[]>(assetDepEntriesKey(tenantId), []);
  },
  createAssetDepreciationEntry(tenantId, payload) {
    const items = this.listAssetDepreciationEntries(tenantId);
    const next = [payload, ...items];
    saveToStorage(assetDepEntriesKey(tenantId), next);
    return payload;
  },

  listAssetEvents(tenantId) {
    return loadFromStorage<AssetEvent[]>(assetEventsKey(tenantId), []);
  },
  createAssetEvent(tenantId, payload) {
    const items = this.listAssetEvents(tenantId);
    const next = [payload, ...items];
    saveToStorage(assetEventsKey(tenantId), next);
    return payload;
  },
};
