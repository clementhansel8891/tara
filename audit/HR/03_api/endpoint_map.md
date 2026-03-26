# HR Endpoint Map

## 1. Employee Lifecycle
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employees` | List employees (tenant/location filtered) |
| GET | `/employees/:id` | Get detailed employee record |
| POST | `/employees` | Create new employee |
| PUT | `/employees/:id` | Update employee details |
| DELETE | `/employees/:id` | Deactivate employee (soft delete) |
| PATCH | `/employees/:id/promote`| Execute promotion workflow |
| PATCH | `/employees/:id/transfer`| Execute department/location transfer |
| PATCH | `/employees/:id/suspend`| Suspend employee status |

## 2. Time, Attendance & Leave
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attendance` | List attendance records |
| POST | `/attendance/clock-in` | Record clock-in event |
| POST | `/attendance/clock-out`| Record clock-out event |
| GET | `/leave-requests` | List leave requests |
| POST | `/leave-requests` | Create leave request |
| PUT | `/leave-requests/:id/approve`| Approve leave |
| PUT | `/leave-requests/:id/reject` | Reject leave |

## 3. Payroll & Compensation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payroll/:employeeId` | Get employee payroll history |
| POST | `/payroll/:id/calculate`| Trigger payroll calculation |
| GET | `/payroll-runs` | List payroll batches (Case-based) |
| POST | `/payroll-runs` | Initialize new payroll run |
| PATCH | `/payroll-runs/:id/submit`| Submit run for review |
| PATCH | `/payroll-runs/:id/approve`| Final approval of payroll |

## 4. Recruitment & Talent
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/requisitions` | List job requisitions |
| POST | `/candidates` | Create job candidate |
| POST | `/candidates/:id/hire` | Convert candidate to employee |
| POST | `/recruitment/interviews`| Schedule interview |
| POST | `/recruitment/talent-leads/ingest`| Ingest external leads |

## 5. Global Compliance & AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/compliance/audit` | Global health check |
| POST | `/compliance/calculate`| Trigger module-specific calc (BPJS, CPF) |
| GET | `/analytics/predictions/turnover`| AI Turnover prediction |
| POST | `/recruitment/generate-description/:id`| AI Job Descr generation |
