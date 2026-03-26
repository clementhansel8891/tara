export enum ArInvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  VOID = 'VOID',
}

export enum ArCustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export const AR_EVENT_TYPES = {
  INVOICE_ISSUED: 'ar.invoice.issued',
  PAYMENT_RECEIVED: 'ar.payment.received',
  CREDIT_MEMO_ISSUED: 'ar.credit.memo.issued',
  PAYMENT_REFUND: 'ar.payment.refund',
  INVOICE_VOID: 'ar.invoice.void',
};
