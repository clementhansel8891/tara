import {
  ensureSeed,
  loadFromStorage,
  saveToStorage,
} from "@/core/persistence";
import type { PaymentRepository } from "@/core/repositories/payment/paymentRepository";
import type {
  DevicePool,
  EvidencePack,
  PaymentAuditEvent,
  PaymentChargeback,
  PaymentDispute,
  PaymentProvider,
  PaymentRefund,
  PaymentTransaction,
  PosDevice,
  RoutingPolicy,
  SettlementRecord,
} from "@/core/types/payment/payment";

const nowIso = () => new Date().toISOString();

const transactionsKey = (tenantId: string) => `payment:${tenantId}:transactions`;
const providersKey = (tenantId: string) => `payment:${tenantId}:providers`;
const routingKey = (tenantId: string) => `payment:${tenantId}:routing`;
const devicesKey = (tenantId: string) => `payment:${tenantId}:devices`;
const poolsKey = (tenantId: string) => `payment:${tenantId}:pools`;
const disputesKey = (tenantId: string) => `payment:${tenantId}:disputes`;
const chargebacksKey = (tenantId: string) => `payment:${tenantId}:chargebacks`;
const refundsKey = (tenantId: string) => `payment:${tenantId}:refunds`;
const settlementsKey = (tenantId: string) => `payment:${tenantId}:settlements`;
const evidenceKey = (tenantId: string) => `payment:${tenantId}:evidence`;
const auditKey = (tenantId: string) => `payment:${tenantId}:audit`;

const seedProviders = (tenantId: string): PaymentProvider[] => [
  {
    id: "BANK_BCA",
    tenantId,
    name: "Bank BCA",
    channels: ["BANK_TRANSFER", "QR"],
    status: "HEALTHY",
    maxAmountPerTxn: 1000000000,
    settlementSlaHours: 6,
    priority: 1,
    lastHeartbeatAt: nowIso(),
  },
  {
    id: "BANK_MANDIRI",
    tenantId,
    name: "Bank Mandiri",
    channels: ["BANK_TRANSFER", "QR"],
    status: "HEALTHY",
    maxAmountPerTxn: 1000000000,
    settlementSlaHours: 8,
    priority: 2,
    lastHeartbeatAt: nowIso(),
  },
  {
    id: "STRIPE",
    tenantId,
    name: "Stripe",
    channels: ["CARD_ONLINE", "CARD_POS", "WALLET"],
    status: "HEALTHY",
    maxAmountPerTxn: 750000000,
    settlementSlaHours: 24,
    priority: 3,
    lastHeartbeatAt: nowIso(),
  },
  {
    id: "ADYEN",
    tenantId,
    name: "Adyen",
    channels: ["CARD_ONLINE", "CARD_POS", "WALLET"],
    status: "HEALTHY",
    maxAmountPerTxn: 750000000,
    settlementSlaHours: 24,
    priority: 4,
    lastHeartbeatAt: nowIso(),
  },
];

const seedRouting = (tenantId: string): RoutingPolicy[] => [
  {
    id: `${tenantId}-routing-primary`,
    tenantId,
    name: "Default enterprise routing",
    enabled: true,
    priorities: ["BANK_BCA", "BANK_MANDIRI", "STRIPE"],
    fallbackProviders: ["BANK_MANDIRI", "STRIPE", "ADYEN"],
    maxRetries: 3,
    exponentialBackoffSeconds: 2,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const seedDevices = (tenantId: string): PosDevice[] => [
  {
    id: `${tenantId}-pos-01`,
    tenantId,
    location: "Jakarta HQ",
    deviceCode: "POS-01",
    approved: true,
    status: "ONLINE",
    providerId: "ADYEN",
    lastUsedAt: nowIso(),
  },
  {
    id: `${tenantId}-pos-02`,
    tenantId,
    location: "Jakarta HQ",
    deviceCode: "POS-02",
    approved: true,
    status: "ONLINE",
    providerId: "STRIPE",
    lastUsedAt: nowIso(),
  },
  {
    id: `${tenantId}-pos-03`,
    tenantId,
    location: "Jakarta HQ",
    deviceCode: "POS-03",
    approved: true,
    status: "MAINTENANCE",
    providerId: "ADYEN",
  },
];

const seedPools = (tenantId: string): DevicePool[] => [
  {
    id: `${tenantId}-pool-jkt`,
    tenantId,
    location: "Jakarta HQ",
    primaryDeviceId: `${tenantId}-pos-01`,
    fallbackDeviceIds: [`${tenantId}-pos-02`, `${tenantId}-pos-03`],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const seedTransactions = (tenantId: string): PaymentTransaction[] => [
  {
    id: `${tenantId}-pay-001`,
    tenantId,
    externalReference: "AP-INV-10021",
    type: "VENDOR_PAYOUT",
    amount: 25000000,
    currency: "IDR",
    destination: "PT Fresh Supply Co",
    source: "BCA Operating",
    channel: "BANK_TRANSFER",
    providerId: "BANK_BCA",
    idempotencyKey: `${tenantId}-idem-001`,
    status: "SETTLED",
    retryAttempts: [{ attempt: 1, attemptedAt: nowIso(), providerId: "BANK_BCA", result: "SUCCESS" }],
    settlementId: `${tenantId}-set-001`,
    ledgerSyncTriggeredAt: nowIso(),
    evidencePackId: `${tenantId}-ev-001`,
    createdBy: "system",
    approvedBy: "fin-manager",
    approvedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const seedSettlements = (tenantId: string): SettlementRecord[] => [
  {
    id: `${tenantId}-set-001`,
    tenantId,
    paymentId: `${tenantId}-pay-001`,
    providerReference: "BCA-SETTLE-77881",
    status: "CONFIRMED",
    confirmedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const seedEvidence = (tenantId: string): EvidencePack[] => [
  {
    id: `${tenantId}-ev-001`,
    tenantId,
    paymentId: `${tenantId}-pay-001`,
    providerProof: "BCA-TRANSFER-SLIP-77881",
    approvalSignatures: ["fin-manager", "treasury-lead"],
    checksum: "chk-seed-001",
    payload: "{\"payment\":\"seed\"}",
    createdAt: nowIso(),
  },
];

const updateById = <T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<T>,
): { updated: T | null; next: T[] } => {
  let updated: T | null = null;
  const next = (Array.isArray(items) ? items : []).map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch };
    return updated;
  });
  return { updated, next };
};

export const mockPaymentRepo: PaymentRepository = {
  async listTransactions(tenantId) {
    return await ensureSeed<PaymentTransaction>(
      transactionsKey(tenantId),
      seedTransactions(tenantId),
    );
  },
  async createTransaction(tenantId, payload) {
    const current = await this.listTransactions(tenantId);
    const next = [payload, ...current];
    await saveToStorage(transactionsKey(tenantId), next);
    return payload;
  },
  async updateTransaction(tenantId, id, patch) {
    const current = await this.listTransactions(tenantId);
    const { updated, next } = updateById(current, id, patch);
    if (updated) await saveToStorage(transactionsKey(tenantId), next);
    return updated;
  },

  async listProviders(tenantId) {
    return await ensureSeed<PaymentProvider>(providersKey(tenantId), seedProviders(tenantId));
  },
  async updateProvider(tenantId, id, patch) {
    const current = await this.listProviders(tenantId);
    const { updated, next } = updateById(current, id, patch);
    if (updated) await saveToStorage(providersKey(tenantId), next);
    return updated;
  },

  async listRoutingPolicies(tenantId) {
    return await ensureSeed<RoutingPolicy>(routingKey(tenantId), seedRouting(tenantId));
  },
  async updateRoutingPolicy(tenantId, id, patch) {
    const current = await this.listRoutingPolicies(tenantId);
    const { updated, next } = updateById(current, id, patch);
    if (updated) await saveToStorage(routingKey(tenantId), next);
    return updated;
  },

  async listDevices(tenantId) {
    return await ensureSeed<PosDevice>(devicesKey(tenantId), seedDevices(tenantId));
  },
  async updateDevice(tenantId, id, patch) {
    const current = await this.listDevices(tenantId);
    const { updated, next } = updateById(current, id, patch);
    if (updated) await saveToStorage(devicesKey(tenantId), next);
    return updated;
  },
  async listDevicePools(tenantId) {
    return await ensureSeed<DevicePool>(poolsKey(tenantId), seedPools(tenantId));
  },

  async listDisputes(tenantId) {
    return await loadFromStorage<PaymentDispute[]>(disputesKey(tenantId), []);
  },
  async createDispute(tenantId, payload) {
    const current = await this.listDisputes(tenantId);
    const next = [payload, ...current];
    await saveToStorage(disputesKey(tenantId), next);
    return payload;
  },
  async updateDispute(tenantId, id, patch) {
    const current = await this.listDisputes(tenantId);
    const { updated, next } = updateById(current, id, patch);
    if (updated) await saveToStorage(disputesKey(tenantId), next);
    return updated;
  },

  async listChargebacks(tenantId) {
    return await loadFromStorage<PaymentChargeback[]>(chargebacksKey(tenantId), []);
  },
  async createChargeback(tenantId, payload) {
    const current = await this.listChargebacks(tenantId);
    const next = [payload, ...current];
    await saveToStorage(chargebacksKey(tenantId), next);
    return payload;
  },
  async updateChargeback(tenantId, id, patch) {
    const current = await this.listChargebacks(tenantId);
    const { updated, next } = updateById(current, id, patch);
    if (updated) await saveToStorage(chargebacksKey(tenantId), next);
    return updated;
  },

  async listRefunds(tenantId) {
    return await loadFromStorage<PaymentRefund[]>(refundsKey(tenantId), []);
  },
  async createRefund(tenantId, payload) {
    const current = await this.listRefunds(tenantId);
    const next = [payload, ...current];
    await saveToStorage(refundsKey(tenantId), next);
    return payload;
  },
  async updateRefund(tenantId, id, patch) {
    const current = await this.listRefunds(tenantId);
    const { updated, next } = updateById(current, id, patch);
    if (updated) await saveToStorage(refundsKey(tenantId), next);
    return updated;
  },

  async listSettlements(tenantId) {
    return await ensureSeed<SettlementRecord>(
      settlementsKey(tenantId),
      seedSettlements(tenantId),
    );
  },
  async createSettlement(tenantId, payload) {
    const current = await this.listSettlements(tenantId);
    const next = [payload, ...current];
    await saveToStorage(settlementsKey(tenantId), next);
    return payload;
  },
  async updateSettlement(tenantId, id, patch) {
    const current = await this.listSettlements(tenantId);
    const { updated, next } = updateById(current, id, patch);
    if (updated) await saveToStorage(settlementsKey(tenantId), next);
    return updated;
  },

  async listEvidencePacks(tenantId) {
    return await ensureSeed<EvidencePack>(evidenceKey(tenantId), seedEvidence(tenantId));
  },
  async createEvidencePack(tenantId, payload) {
    const current = await this.listEvidencePacks(tenantId);
    const next = [payload, ...current];
    await saveToStorage(evidenceKey(tenantId), next);
    return payload;
  },

  async listAuditEvents(tenantId) {
    return await loadFromStorage<PaymentAuditEvent[]>(auditKey(tenantId), []);
  },
  async createAuditEvent(tenantId, payload) {
    const current = await this.listAuditEvents(tenantId);
    const next = [payload, ...current];
    await saveToStorage(auditKey(tenantId), next);
    return payload;
  },
};
