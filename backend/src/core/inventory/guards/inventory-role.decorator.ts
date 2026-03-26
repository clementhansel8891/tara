import { SetMetadata } from "@nestjs/common";

export enum InventoryRole {
  MANAGER = "manager",       // Approve adjustments, audits
  SUPERVISOR = "supervisor", // Record movements, run scans
  CLERK = "clerk",           // View only; draft creations
}

export const INVENTORY_ROLE_KEY = "inventory_role";
export const RequireInventoryRole = (role: InventoryRole) =>
  SetMetadata(INVENTORY_ROLE_KEY, role);
