import type { RetailStore } from "@/core/types/retail/retail";

// ─── Core Item View ───────────────────────────────────────────
export type ItemStatus = "ok" | "low" | "critical" | "overstock";

export type InventoryItemView = {
  id: string;
  sku: string;
  name: string;
  category: string;
  onHand: number;
  reserved: number;
  available: number;
  minBuffer: number;
  maxCapacity: number;
  status: ItemStatus;
  lastUpdated?: string;
};

// ─── Line Item (for multi-line operations) ────────────────────
export type LineItem = {
  sku: string;
  name: string;
  qty: number;
  unitPrice?: number;
  condition?: "ok" | "damaged" | "short";
  note?: string;
};

// ─── Movement Types ───────────────────────────────────────────
export type MovementType =
  | "request_po"
  | "transfer_out"
  | "receive_po"
  | "receive_transfer"
  | "receive_purchase";

export const MOVEMENT_META: Record<
  MovementType,
  { label: string; dir: "in" | "out"; color: string }
> = {
  request_po: { label: "Request Purchase Order", dir: "in", color: "blue" },
  transfer_out: { label: "Transfer to Branch", dir: "out", color: "indigo" },
  receive_po: { label: "Receive from PO", dir: "in", color: "emerald" },
  receive_transfer: { label: "Receive Transfer", dir: "in", color: "emerald" },
  receive_purchase: {
    label: "Receive from Purchase",
    dir: "in",
    color: "teal",
  },
};

// ─── Opname ───────────────────────────────────────────────────
export type OpnameEntry = {
  sku: string;
  name: string;
  expected: number;
  counted: number | "";
};

// ─── Audit ────────────────────────────────────────────────────
export type AuditStatus = "approved" | "pending" | "rejected";

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  detail: string;
  reason: string;
  ts: string;
  status: AuditStatus;
};

// ─── Helpers ─────────────────────────────────────────────────
export const getItemStatus = (
  item: Pick<InventoryItemView, "available" | "onHand" | "minBuffer">,
): ItemStatus => {
  if (item.available <= 0) return "critical";
  if (item.available < item.minBuffer) return "low";
  if (item.onHand > item.minBuffer * 5) return "overstock";
  return "ok";
};

export const STATUS_BADGE: Record<ItemStatus, string> = {
  ok: "bg-emerald-50 text-emerald-700",
  low: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
  overstock: "bg-blue-50 text-blue-700",
};

export const AUDIT_STATUS_BADGE: Record<AuditStatus, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
};

// ─── Mock seed data ───────────────────────────────────────────
export const MOCK_AUDIT: AuditEntry[] = [
  {
    id: "a1",
    actor: "Budi S.",
    action: "STOCK_ADJUST",
    detail: "SKU-001 × -5",
    reason: "Damaged goods write-off",
    ts: "2026-02-26 14:10",
    status: "approved",
  },
  {
    id: "a2",
    actor: "System",
    action: "CORE_SYNC",
    detail: "148 SKUs",
    reason: "Scheduled core sync",
    ts: "2026-02-26 13:00",
    status: "approved",
  },
  {
    id: "a3",
    actor: "Dewi K.",
    action: "TRANSFER_OUT",
    detail: "SKU-042 × 20",
    reason: "Branch rebalancing",
    ts: "2026-02-26 11:30",
    status: "pending",
  },
  {
    id: "a4",
    actor: "Reza P.",
    action: "RECEIVE_PO",
    detail: "PO-8801 × 50",
    reason: "Weekly restock",
    ts: "2026-02-25 09:00",
    status: "approved",
  },
];
