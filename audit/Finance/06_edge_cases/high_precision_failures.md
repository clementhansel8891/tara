# Edge Cases: High Precision Failures

## 1. Floating Point Math Risks
The current codebase uses native JavaScript `number` types for intermediate calculations in several critical paths.

- **Risk**: IEEE 754 floating-point errors (e.g., `0.1 + 0.2 = 0.30000000000000004`).
- **Location identified**: `IndonesiaTaxStrategy.calculate` (line 56) and `ReportingEngineService.normalizeBalance`.
- **Impact**: Imbalances at the 3rd or 4th decimal place which exceed the `0.001` tolerance in `JournalValidationService`, causing valid transactions to be rejected or reports to fail "IsBalanced" checks.

## 2. Rounding Inconsistencies
- **Ledger Engine**: Uses a strict 4-decimal precision internally (`Decimal(19, 4)`).
- **Reporting Engine**: Performs a `round(value * 100) / 100` at the final output stage.
- **Risk**: "Rounding Pennies" — Cumulative differences between hundreds of line items and the rounded total reported on the Balance Sheet.

## 3. Recommended Hardening
1. **Decimal Library**: Replace all arithmetic operators (`*`, `+`, `-`) with a big-decimal library (e.g., `decimal.js`) in the `TaxEngine` and `PostingRule` evaluators.
2. **Deterministic Rounding**: Standardize on `HALF_EVEN` (Banker's Rounding) across all modules to minimize cumulative bias in large datasets.
