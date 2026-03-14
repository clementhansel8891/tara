export class ExchangeRate {
  id: string;
  tenantId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
