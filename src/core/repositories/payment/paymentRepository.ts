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

export interface PaymentRepository {
  listTransactions: (tenantId: string) => Promise<PaymentTransaction[]>;
  createTransaction: (
    tenantId: string,
    payload: PaymentTransaction,
  ) => Promise<PaymentTransaction>;
  updateTransaction: (
    tenantId: string,
    id: string,
    patch: Partial<PaymentTransaction>,
  ) => Promise<PaymentTransaction | null>;

  listProviders: (tenantId: string) => Promise<PaymentProvider[]>;
  updateProvider: (
    tenantId: string,
    id: string,
    patch: Partial<PaymentProvider>,
  ) => Promise<PaymentProvider | null>;

  listRoutingPolicies: (tenantId: string) => Promise<RoutingPolicy[]>;
  updateRoutingPolicy: (
    tenantId: string,
    id: string,
    patch: Partial<RoutingPolicy>,
  ) => Promise<RoutingPolicy | null>;

  listDevices: (tenantId: string) => Promise<PosDevice[]>;
  updateDevice: (
    tenantId: string,
    id: string,
    patch: Partial<PosDevice>,
  ) => Promise<PosDevice | null>;
  listDevicePools: (tenantId: string) => Promise<DevicePool[]>;

  listDisputes: (tenantId: string) => Promise<PaymentDispute[]>;
  createDispute: (tenantId: string, payload: PaymentDispute) => Promise<PaymentDispute>;
  updateDispute: (
    tenantId: string,
    id: string,
    patch: Partial<PaymentDispute>,
  ) => Promise<PaymentDispute | null>;

  listChargebacks: (tenantId: string) => Promise<PaymentChargeback[]>;
  createChargeback: (
    tenantId: string,
    payload: PaymentChargeback,
  ) => Promise<PaymentChargeback>;
  updateChargeback: (
    tenantId: string,
    id: string,
    patch: Partial<PaymentChargeback>,
  ) => Promise<PaymentChargeback | null>;

  listRefunds: (tenantId: string) => Promise<PaymentRefund[]>;
  createRefund: (tenantId: string, payload: PaymentRefund) => Promise<PaymentRefund>;
  updateRefund: (
    tenantId: string,
    id: string,
    patch: Partial<PaymentRefund>,
  ) => Promise<PaymentRefund | null>;

  listSettlements: (tenantId: string) => Promise<SettlementRecord[]>;
  createSettlement: (
    tenantId: string,
    payload: SettlementRecord,
  ) => Promise<SettlementRecord>;
  updateSettlement: (
    tenantId: string,
    id: string,
    patch: Partial<SettlementRecord>,
  ) => Promise<SettlementRecord | null>;

  listEvidencePacks: (tenantId: string) => Promise<EvidencePack[]>;
  createEvidencePack: (tenantId: string, payload: EvidencePack) => Promise<EvidencePack>;

  listAuditEvents: (tenantId: string) => Promise<PaymentAuditEvent[]>;
  createAuditEvent: (
    tenantId: string,
    payload: PaymentAuditEvent,
  ) => Promise<PaymentAuditEvent>;
}
