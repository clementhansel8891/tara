# HR Data Access

## 1. Multi-Tenant Isolation (Layer 1)
- **Mechanism**: Every request is intercepted by `TenantInterceptor`, which injects `tenantId` into the request context.
- **Status**: **STABLE**. ALL `prisma` calls in the repository layer filter by `tenantId`.

## 2. PII Data Privacy (Layer 2)
- **Personal Identifiable Information (PII)**: The `Employee` model contains sensitive data (`email`, `phone`, `dateOfBirth`, `salary`, `taxId`).
- **Control**: Currently, `GET /employees` returns full employee objects.
- **Risk**: Junior HR staff or department managers might see sensitive fields (e.g., `salary`) unintentionally.
- **RECO**: Implement field-masking interceptors (e.g., `@UseInterceptors(SanitizeEmployeeInterceptor)`) that strip sensitive fields unless the caller has `COMPENSATION_READ` permission.

## 3. Data Residency
- **Audit**: Compliance modules (BPJS, PPH21) process data locally. No evidence of data being sent to external third-party APIs for calculation.
- **Status**: **SECURE**.
