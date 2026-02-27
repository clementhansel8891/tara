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
  request_po: { label: "Request PO", dir: "in", color: "blue" },
  transfer_out: { label: "Transfer to Store", dir: "out", color: "indigo" },
  receive_po: { label: "Receive from PO", dir: "in", color: "emerald" },
  receive_transfer: { label: "Receive Transfer", dir: "in", color: "emerald" },
  receive_purchase: {
    label: "Receive from Purchase",
    dir: "in",
    color: "emerald",
  },
};
