export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface ARInvoiceLine {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxAmount: number;
}

export interface ARInvoice {
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  totalAmount: number;
  balanceDue: number;
  issueDate: Date;
  dueDate: Date;
  lines: ARInvoiceLine[];
}

export interface ARPayment {
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  paymentNumber: string;
  amount: number;
  unallocatedAmount: number;
  currency: string;
  paymentDate: Date;
  method: string;
}

export interface ARPaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  allocatedAt: Date;
}

export interface ARAgingBucket {
  customerId: string;
  bucket0_30: number;
  bucket31_60: number;
  bucket61_90: number;
  bucket91_plus: number;
  updatedAt: Date;
}

export interface ARCustomerBalance {
  customerId: string;
  tenantId: string;
  companyId: string;
  totalBalance: number;
  unallocatedPayments: number;
  creditLimit: number;
  overdueBalance: number;
  lastUpdated: Date;
}
