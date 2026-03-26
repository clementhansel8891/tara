export class TransactionPriceSnapshot {
  id: string;
  tenantId: string;
  transactionId: string; // ID from sales/order module
  price: number;
  baseCostAtTime: number;
  ruleId: string;
  priceVersionId: string;
  margin: number;
  currency: string;
  createdAt: Date;
}
