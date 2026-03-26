# 01_architecture/dependency_graph.md

## Dependency Graph: Finance Core

```mermaid
graph TD
    subgraph Controller_Layer
        FC[FinanceController]
        RC[ReportingController]
        OpC[OperationsController]
    end

    subgraph Service_Layer
        PGS[PostingGatewayService]
        LPS[LedgerPostingService]
        FPS[FiscalPeriodService]
        RES[ReportingEngineService]
        AIS[AccountingIntegrationService]
    end

    subgraph Repository_Layer
        UOW[UnitOfWork]
        ABR[AccountBalanceRepository]
        LPR[LedgerPostingRepository]
        JR[JournalRepository]
    end

    subgraph Data_Layer
        DB[(Prisma / Postgres)]
    end

    %% Flow: Write
    FC --> LPS
    LPS --> UOW
    UOW --> LPR
    UOW --> AB
    
    %% Flow: Integration
    AIS --> PGS
    PGS --> LPS

    %% Flow: Read
    RC --> RES
    RES --> LPR
    RES --> ABR

    %% Internal Dependencies
    OpC --> FPS
    
    %% Storage
    LPR --> DB
    ABR --> DB
    JR --> DB
```

### Analysis of Boundaries
1. **Vertical Flow**: Strictly follows Controller -> Service -> Repository -> DB.
2. **Circular Dependencies**: None detected in the `FinanceModule` setup.
3. **Cross-Service Coupling**: `LedgerPostingService` is the central hub. Most other services depend on it for data entry, ensuring centralized validation.
