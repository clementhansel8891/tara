# Finance Entity Relationships

```mermaid
erDiagram
    COMPANY ||--o{ CHART_OF_ACCOUNT : "manages"
    COMPANY ||--o{ FISCAL_PERIOD : "manages"
    COMPANY ||--o{ JOURNAL_ENTRY : "records"
    COMPANY ||--o{ AR_INVOICE : "issues"
    
    FISCAL_PERIOD ||--o{ JOURNAL_ENTRY : "contains"
    FISCAL_PERIOD ||--o{ ACCOUNT_BALANCE : "tracks"
    
    CHART_OF_ACCOUNT ||--o{ JOURNAL_LINE : "referenced_by"
    CHART_OF_ACCOUNT ||--o{ ACCOUNT_BALANCE : "aggregates"
    
    JOURNAL_ENTRY ||--o{ JOURNAL_LINE : "details"
    JOURNAL_ENTRY ||--o{ JOURNAL_REVERSAL : "target/source"
    
    AR_INVOICE ||--o{ AR_INVOICE_LINE : "details"
    AR_INVOICE ||--o{ AR_PAYMENT_ALLOCATION : "redeemed_by"
    
    AR_PAYMENT ||--o{ AR_PAYMENT_ALLOCATION : "allocates"
    
    LEDGER_POSTING ||--o{ LEDGER_POSTING_LINE : "details"
    LEDGER_POSTING_RULE ||--o{ LEDGER_POSTING_RULE_LINE : "defines"
```

## Relationship Integrity Audit

| Relationship | Constraint | Audit Verdict |
|--------------|------------|---------------|
| `COA -> JournalLine` | Mandatory | **PASSED** |
| `FiscalPeriod -> JournalEntry` | Mandatory | **PASSED** |
| `JournalEntry -> JournalLine` | Balanced | **AUDIT_REQUIRED** (Ensured at Logic Layer) |
| `ArPayment -> ArInvoice` | Allocations | **PASSED** |
