# Consistency: Distributed Locking

## 1. Transactional Boundaries
The `IUnitOfWork` (UoW) provides the primary consistency boundary.

- **Scope**: Covers Journal Header, Lines, and Balance Updates.
- **Guarantee**: Atomicity and Isolation (ACID). If the Balance update fails, the Journal entry is never visible to the rest of the system.

## 2. Resource Contention
- **Hot-Spotting**: High volume accounts (e.g., "Cash at Bank") are updated by almost every transaction.
- **Current Mitigation**: Optimistic locking via `version` field.
- **Risk**: In high-contention scenarios, workers will frequently fail with `P2025` (Record not found or updated) or equivalent optimistic lock errors, triggering retries and increasing latency.

## 3. Locking Gaps
- **Cross-Service Locks**: No explicit distributed lock (e.g., Redis based) exists to prevent concurrent reconciliation runs from overlapping with month-end closing.
- **Recommendation**: Implement a `NamespaceLockService` to protect large-scale batch operations like `FiscalPeriod.Close`.
