# HR Dependency Graph

## Top-Level Dependencies (NestJS)
```mermaid
graph TD
    AppModule --> HRModule
    HRModule --> DB(PrismaService)
    HRModule --> Audit(AuditModule)
    HRModule --> File(FileProcessingModule)
    HRModule --> Compliance(ComplianceEngineModule)
    HRModule --> Time(TimeAndAttendanceModule)
    HRModule --> Automation(HRAutomationModule)
```

## Internal Call Graph (High Level)
```mermaid
graph LR
    Controller[HRController] --> Service[HRService]
    Controller --> Specialized[Specialized Services]
    Service --> Repository[HRDbRepository/Mock]
    Service --> Commands[Command Handlers]
    Commands --> Repository
    Repository --> Prisma[PrismaClient]
```

## Data Dependencies (Prisma)
- **Employee** depends on **Company** (Tenant)
- **Employee** depends on **Location** (Branch)
- **Employee** depends on **Department**
- **Payroll** depends on **Employee**
- **TrainingAssignment** depends on **TrainingProgram** and **Employee**
- **Store** (Retail) depends on **Employee** (as Manager)
