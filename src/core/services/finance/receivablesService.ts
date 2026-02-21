import type { ReceivableInvoice } from "@/core/types/finance/receivables";
import { financeRepo } from "@/core/repositories/finance/financeRepo";

const repo = financeRepo;

export const receivablesService = {
  async getReceivables(tenantId: string, _status?: string): Promise<ReceivableInvoice[]> {
    return await repo.listReceivables(tenantId);
  },

  async createReceivable(receivable: ReceivableInvoice): Promise<ReceivableInvoice> {
    return await repo.createReceivable(receivable.tenantId, receivable);
  },

  async updateReceivable(_receivableId: string, _updates: Partial<ReceivableInvoice>): Promise<ReceivableInvoice | null> {
    return null;
  },

  async approveReceivable(_approval: { receivableId: string }): Promise<ReceivableInvoice | null> {
    return null;
  },
};
