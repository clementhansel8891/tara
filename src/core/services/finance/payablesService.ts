import type { PayableBill } from "@/core/types/finance/payables";
import { financeRepo } from "@/core/repositories/finance/financeRepo";

const repo = financeRepo;

export const payablesService = {
  async getPayables(tenantId: string, _status?: string): Promise<PayableBill[]> {
    return await repo.listPayables(tenantId);
  },

  async createPayable(payable: PayableBill): Promise<PayableBill> {
    return await repo.createPayable(payable.tenantId, payable);
  },

  async updatePayable(_payableId: string, _updates: Partial<PayableBill>): Promise<PayableBill | null> {
    // Mock repo doesn't support update for payables yet
    return null;
  },

  async approvePayable(_approval: { payableId: string }): Promise<PayableBill | null> {
    // Mock repo doesn't support approval yet
    return null;
  },
};
