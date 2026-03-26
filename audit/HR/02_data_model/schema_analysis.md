# HR Schema Analysis

## Core HR Models
The following models represent the backbone of the HR system:

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Employee` | Primary person record | `id`, `tenantId`, `employeeCode`, `status`, `userId` |
| `Department` | Organizational unit | `id`, `tenantId`, `code`, `name` |
| `Position` | Job definitions | `id`, `tenantId`, `title`, `basePay` |
| `Contract` | Employment terms | `id`, `tenantId`, `type`, `startDate`, `endDate` |

## Lifecycle & Event Models
Models tracking time, pay, and performance:

| Model | Purpose | Key Relationships |
|-------|---------|-------------------|
| `AttendanceRecord` | Daily clock-in/out | `Employee`, `Shift`, `Location` |
| `PayrollRun` | Monthly/Period pay batch | `Lines (PayrollLine)`, `Company` |
| `PayrollLine` | Individual pay item | `PayrollRun`, `Employee` |
| `LeaveRequest` | Absence management | `Employee`, `Department` |
| `PerformanceReview` | Periodic evaluations | `Subject (Employee)`, `Reviewer (Employee)`, `Cycle` |

## Training & Growth
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `TrainingProgram` | Educational course | `name`, `skills`, `dueDate` |
| `TrainingAssignment`| Program-to-Employee link| `status`, `assignedAt`, `completedAt` |
| `SuccessionPlan` | Future leadership mapping| `posId`, `incumbentId`, `candidates` |

## Recruitment
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `JobRequisition` | Request to hire | `title`, `status`, `openings` |
| `Candidate` | Job seeker | `name`, `status`, `requisitionId` |
| `Interview` | Evaluation step | `candidateId`, `status`, `date` |
