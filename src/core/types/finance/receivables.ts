export interface ReceivableInvoice {
  id: string;
  tenantId: string;
  customerName: string;
  amount: number;
  currency: "IDR" | "USD";
  dueDate: string;
  status: "draft" | "pending" | "issued" | "overdue" | "paid";
  agingBucket: "0-30" | "30-60" | "60+";
  createdAt: string;
  updatedAt: string;
}

export type Receivable = {
  id: string;
  tenantId: string;
  customerName: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  status: "pending" | "approved" | "paid" | "overdue";
  workflowId?: string;
  createdAt: string;
  updatedAt: string;
};

export interface FinanceReceivableRow {
  id: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "OVERDUE" | "PAID" | "DISPUTED";
  agingDays: number;
}

