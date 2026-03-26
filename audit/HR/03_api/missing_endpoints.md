# HR Missing Endpoints

## 1. Exit Management (Offboarding)
- **Status**: PARTIAL / MISSING.
- **Observation**: While `DELETE /employees/:id` exists for soft deactivation, there are no dedicated endpoints for "Exit Interviews", "Asset Retrieval Checklists", or "Final Settlement Calculation".

## 2. Asset & Equipment Management
- **Status**: MISSING.
- **Observation**: The `Employee` model in `schema.prisma` reflects a relation to `itDevices`/`Device`, but the `HRController` lacks endpoints to assign, track, or verify equipment possession by employees.

## 3. Expense & Reimbursement
- **Status**: MISSING from HR Core.
- **Observation**: No endpoints found for employee expense claims, which are typically part of a self-service HR portal.

## 4. Organizational Chart (Deep Fetch)
- **Status**: MISSING.
- **Observation**: Existing `GET /employees` and `GET /departments` are flat lists. No recursive endpoint exists to fetch the full reporting hierarchy (Tree structure) for org-chart visualization.

## 5. Benefit Enrollment (Self-Service)
- **Status**: PARTIAL.
- **Observation**: `POST /rewards/enroll` exists, but lacks a "Selection" or "Eligibility" check endpoint for employees to browse plans they are eligible for based on their grade/position.
