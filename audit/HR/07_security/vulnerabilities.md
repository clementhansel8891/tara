# HR Vulnerabilities

## 1. ID Enumeration (Low Risk)
- **Status**: **MITIGATED**. All entities use UUID v4, preventing sequential ID sniffing.

## 2. Mass Assignment (Medium Risk)
- **Status**: **VULNERABLE**.
- **Evidence**: `PUT /employees/:id` accepts `UpdateEmployeeDto`. If this DTO is not strictly mapped to the `Prisma.update` data object, an attacker could potentially inject fields like `tenantId` or `roleTitle` to escalate their privileges or move an employee record to another tenant.
- **RECO**: Use explicit mapping in `HRService.updateEmployee` instead of passing the DTO directly to the repo.

## 3. Insecure File Uploads (Medium Risk)
- **Status**: **UNKNOWN**.
- **Endpoint**: `POST /compliance/upload-classify` accepts a `fileUrl`.
- **Risk**: If the `FileProcessingService` does not validate the URL or the file headers (MIME type check), it could be exploited for Server-Side Request Forgery (SSRF) or Malware injection.

## 4. Missing Rate Limiting
- **Status**: **VULNERABLE**.
- **Endpoint**: High-value endpoints like `POST /attendance/clock-in` or `POST /employees/import` lack rate-limiting guards, making them targets for DoS or bulk data corruption.
