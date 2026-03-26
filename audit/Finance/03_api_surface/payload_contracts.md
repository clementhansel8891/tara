# Finance Payload Contracts

## 1. Ledger Posting (`POST /post-ledger`)

```json
{
  "sourceEventId": "uuid",
  "eventType": "SALES_INVOICE | PAYROLL_RUN | ...",
  "lines": [
    {
      "accountId": "uuid",
      "side": "DEBIT | CREDIT",
      "amount": "1250.50",
      "dimensions": {
        "locationId": "uuid",
        "departmentId": "uuid",
        "projectId": "uuid"
      }
    }
  ],
  "metadata": {}
}
```

## 2. Certified Seal (`POST /seal/:snapshotId`)

```json
{
  "fiscalPeriodId": "uuid",
  "companyId": "uuid",
  "comment": "Year-end close 2025"
}
```

## 3. AR Payment Allocation (`POST /payments/allocate`)

```json
{
  "paymentId": "uuid",
  "allocations": [
    {
      "invoiceId": "uuid",
      "amount": "500.00"
    }
  ]
}
```

## 4. Cashflow Parameters (`GET /cashflow`)

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `days` | Integer | 30 | Number of days to forecast. |
| `revMult` | Float | 1.0 | Scenario multiplier for expected revenue. |
| `expMult` | Float | 1.0 | Scenario multiplier for expected expenses. |
| `sceneDelay`| Integer | 0 | Artificial delay in days for receivables. |
