---
title: HR Architecture Upgrade Plan — Command Layer + Global Compliance Engine
version: 1.0.0
created: 2026-03-13
status: READY_FOR_EXECUTION
priority: HIGH
agent_target: gemini-flash-3.0
project_root: c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2
---

# ⚠️ AGENT READING PROTOCOL

**YOU MUST READ THIS ENTIRE FILE BEFORE EXECUTING A SINGLE STEP.**

Rules for the executing agent:
1. Read all sections top-to-bottom before writing any code.
2. Each step has a complexity flag: `[SIMPLE]` or `[COMPLEX]`.
   - `[SIMPLE]`: You may execute immediately.
   - `[COMPLEX]`: Pause, re-read this plan section, verify the existing code before proceeding.
3. After completing each Phase, update the checkbox: `[ ]` → `[x]`.
4. If you are unsure of file content, read the file first before editing it.
5. If you start to drift from the task, **STOP**. Re-read this file from the top and refocus.
6. Do NOT execute database migrations unless explicitly told to in a step.
7. All new code MUST follow the NestJS pattern: Controller → Service → Repository.
8. All methods MUST accept `tenantId` as the first parameter.

**ANTI-DRIFT CHECKPOINTS**: If you have not produced code related to a step for 3+ tool calls, re-read this file.

---

# GOAL

Upgrade the Zenvix HR module backend to include:
1. A **Command Layer** (CommandBus pattern) for major HR operations.
2. A **Global Compliance Engine** supporting Indonesia (BPJS, PPh21), Singapore (CPF), and UAE (WPS).
3. **Payroll ↔ Compliance** integration.
4. **Export capabilities** (CSV, Excel, XML, PDF stubs).
5. **AI automation hooks** for compliance suggestions.

This plan does NOT include frontend changes or database schema migrations unless specified separately.

---

# PROJECT CONTEXT (Read Before Starting)

- **Framework**: NestJS (TypeScript)
- **Pattern**: Repository Pattern with mock repositories
- **Database**: Prisma (schema at `prisma/schema.prisma`)
- **HR Module**: `backend/src/core/hr/`
- **Support Modules**: `backend/src/support/`
- **App Module**: `backend/src/app.module.ts`
- **Main HR Controller**: `backend/src/core/hr/hr.controller.ts`
- **Main HR Service**: `backend/src/core/hr/hr.service.ts`

Always check the existing file structure before creating new files.

---

# PHASE 1: Command Layer Infrastructure
**Complexity**: `[COMPLEX]`
**Estimated Steps**: 6

## Step 1.1 — [SIMPLE] Create the Command Bus directory
```
mkdir: backend/src/shared/command-bus/
```
Create the following empty file stubs (you will fill them in subsequent steps):
- `backend/src/shared/command-bus/command-bus.module.ts`
- `backend/src/shared/command-bus/command-bus.service.ts`
- `backend/src/shared/command-bus/command-handler.interface.ts`

## Step 1.2 — [SIMPLE] Implement `command-handler.interface.ts`

```typescript
// backend/src/shared/command-bus/command-handler.interface.ts
export interface ICommandHandler<TCommand, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}
```

## Step 1.3 — [SIMPLE] Implement `command-bus.service.ts`

```typescript
// backend/src/shared/command-bus/command-bus.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CommandBusService {
  private readonly logger = new Logger(CommandBusService.name);
  private handlers = new Map<string, any>();

  register(commandName: string, handler: any) {
    this.handlers.set(commandName, handler);
  }

  async execute<T = void>(commandName: string, command: object): Promise<T> {
    const handler = this.handlers.get(commandName);
    if (!handler) throw new Error(`No handler registered for command: ${commandName}`);
    this.logger.log(`Executing command: ${commandName}`);
    return handler.execute(command);
  }
}
```

## Step 1.4 — [SIMPLE] Implement `command-bus.module.ts`

```typescript
// backend/src/shared/command-bus/command-bus.module.ts
import { Global, Module } from '@nestjs/common';
import { CommandBusService } from './command-bus.service';

@Global()
@Module({
  providers: [CommandBusService],
  exports: [CommandBusService],
})
export class CommandBusModule {}
```

## Step 1.5 — [COMPLEX] Create HR Commands directory and define command classes

Create directory: `backend/src/core/hr/commands/`

Create file: `backend/src/core/hr/commands/hr.commands.ts`

Define all command classes:

```typescript
// backend/src/core/hr/commands/hr.commands.ts

export class HireEmployeeCommand {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly candidateId: string,
    public readonly departmentId: string,
    public readonly position: string,
    public readonly startDate: Date,
    public readonly salary: number,
  ) {}
}

export class PromoteEmployeeCommand {
  constructor(
    public readonly tenantId: string,
    public readonly employeeId: string,
    public readonly newPosition: string,
    public readonly newSalary: number,
    public readonly effectiveDate: Date,
  ) {}
}

export class TransferEmployeeCommand {
  constructor(
    public readonly tenantId: string,
    public readonly employeeId: string,
    public readonly targetDepartmentId: string,
    public readonly targetLocationId: string,
    public readonly effectiveDate: Date,
  ) {}
}

export class TerminateEmployeeCommand {
  constructor(
    public readonly tenantId: string,
    public readonly employeeId: string,
    public readonly reason: string,
    public readonly terminationDate: Date,
  ) {}
}

export class ExecutePayrollCommand {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly currency: string,
  ) {}
}

export class GenerateComplianceReportCommand {
  constructor(
    public readonly tenantId: string,
    public readonly country: string,
    public readonly module: string, // 'BPJS_KESEHATAN' | 'BPJS_KETENAGAKERJAAN' | 'PPH21' | 'CPF' | 'WPS'
    public readonly period: string, // 'YYYY-MM'
    public readonly format: 'CSV' | 'EXCEL' | 'XML' | 'PDF',
  ) {}
}
```

## Step 1.6 — [COMPLEX] Create HR Command Handlers

Create file: `backend/src/core/hr/commands/hr.command-handlers.ts`

Import the commands from `hr.commands.ts` and implement a handler for each one. Each handler should inject relevant services (HRService, PayrollService, ComplianceEngine — these will be created in later phases). For now, create stub handlers that call the existing `HRService` methods.

**Important**: After completing Phase 1, re-read this plan from Phase 2 before proceeding.  

---

# PHASE 2: Global Compliance Engine
**Complexity**: `[COMPLEX]`
**Estimated Steps**: 8

## Step 2.1 — [SIMPLE] Create compliance module directory structure

```
backend/src/modules/compliance/
├── compliance.module.ts
├── compliance.service.ts
├── compliance.interface.ts
├── indonesia/
│   ├── bpjs-kesehatan.rules.ts
│   ├── bpjs-kesehatan.export.ts
│   ├── bpjs-ketenagakerjaan.rules.ts
│   ├── bpjs-ketenagakerjaan.export.ts
│   ├── tax-pph21.rules.ts
│   └── tax-pph21.export.ts
├── singapore/
│   ├── cpf.rules.ts
│   └── cpf.export.ts
└── uae/
    ├── wps.rules.ts
    └── wps.export.ts
```

## Step 2.2 — [SIMPLE] Define the Compliance Interface

```typescript
// backend/src/modules/compliance/compliance.interface.ts

export interface IComplianceRule {
  country: string;
  version: string;
  effectiveDate: Date;
  calculate(employees: any[], tenantId: string): ComplianceCalculationResult;
}

export interface IComplianceExporter {
  exportCSV(data: ComplianceCalculationResult): string;
  exportExcel(data: ComplianceCalculationResult): Buffer;
  exportXML(data: ComplianceCalculationResult): string;
  exportPDF(data: ComplianceCalculationResult): Buffer;
}

export interface ComplianceCalculationResult {
  country: string;
  module: string;
  period: string;
  tenantId: string;
  totalEmployees: number;
  totalDeductions: number;
  totalContributions: number;
  lineItems: ComplianceLineItem[];
  generatedAt: Date;
}

export interface ComplianceLineItem {
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  employeeContribution: number;
  employerContribution: number;
  taxAmount: number;
  netSalary: number;
}
```

## Step 2.3 — [COMPLEX] Implement Indonesia BPJS Kesehatan rules

Create `backend/src/modules/compliance/indonesia/bpjs-kesehatan.rules.ts`

Logic:
- Employee rate: 1% of gross salary (capped at IDR 12,000,000 base)
- Employer rate: 4% of gross salary (capped at IDR 12,000,000 base)
- Cap max: IDR 480,000 per month employer + IDR 120,000 per month employee

```typescript
import { IComplianceRule, ComplianceCalculationResult } from '../compliance.interface';

export class BpjsKesehatanRules implements IComplianceRule {
  country = 'ID';
  version = '2024.01';
  effectiveDate = new Date('2024-01-01');

  calculate(employees: any[], tenantId: string): ComplianceCalculationResult {
    const CAP_SALARY = 12_000_000;
    const lineItems = employees.map(emp => {
      const grossSalary = Number(emp.compensation?.baseSalary || 0);
      const base = Math.min(grossSalary, CAP_SALARY);
      const employeeContribution = base * 0.01;
      const employerContribution = base * 0.04;
      return {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        grossSalary,
        employeeContribution,
        employerContribution,
        taxAmount: 0,
        netSalary: grossSalary - employeeContribution,
      };
    });

    return {
      country: 'ID',
      module: 'BPJS_KESEHATAN',
      period: new Date().toISOString().substring(0, 7),
      tenantId,
      totalEmployees: employees.length,
      totalDeductions: lineItems.reduce((s, i) => s + i.employeeContribution, 0),
      totalContributions: lineItems.reduce((s, i) => s + i.employerContribution, 0),
      lineItems,
      generatedAt: new Date(),
    };
  }
}
```

## Step 2.4 — [COMPLEX] Implement BPJS Ketenagakerjaan rules

Create `backend/src/modules/compliance/indonesia/bpjs-ketenagakerjaan.rules.ts`

Logic (JKK + JKM + JHT + JP):
- JHT: Employee 2%, Employer 3.7%
- JP: Employee 1%, Employer 2% (cap salary IDR 9,077,600)
- JKK: Employer 0.24% - 1.74% risk-based (default 0.54%)
- JKM: Employer 0.3%

Use the same pattern as Step 2.3. Return a `ComplianceCalculationResult`.

## Step 2.5 — [COMPLEX] Implement PPh21 (Indonesian Income Tax)

Create `backend/src/modules/compliance/indonesia/tax-pph21.rules.ts`

Logic (simplified progressive tax):
- Up to 60M IDR/year: 5%
- 60M–250M: 15%
- 250M–500M: 25%
- Above 500M: 30%

The rule must calculate annual projection from monthly salary and apply the correct bracket.

## Step 2.6 — [SIMPLE] Create Singapore CPF stub

Create `backend/src/modules/compliance/singapore/cpf.rules.ts`

Rates (employee age < 55):
- Employee: 20%
- Employer: 17%

Implement following the same pattern as Step 2.3.

## Step 2.7 — [SIMPLE] Create UAE WPS stub

Create `backend/src/modules/compliance/uae/wps.rules.ts`

WPS is a salary transfer validation system, not a deduction. Rules:
- Ensure salary is transferred within 10 days of period end.
- Generate WPS Salary Information File (SIF) format (XML/CSV).

Implement as a validation + export stub.

## Step 2.8 — [COMPLEX] Implement the main ComplianceEngine service

Create `backend/src/modules/compliance/compliance.service.ts`

This service:
1. Accepts `tenantId`, `country`, `module`, and `period`.
2. Routes to the correct rule engine.
3. Returns a `ComplianceCalculationResult`.
4. Has an `export(format, result)` method returning the raw export.

```typescript
// backend/src/modules/compliance/compliance.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IHRRepository } from '../../core/hr/repositories/hr.repository.interface';
import { BpjsKesehatanRules } from './indonesia/bpjs-kesehatan.rules';
import { BpjsKetenagakerjaanRules } from './indonesia/bpjs-ketenagakerjaan.rules';
import { TaxPph21Rules } from './indonesia/tax-pph21.rules';
import { CpfRules } from './singapore/cpf.rules';
import { WpsRules } from './uae/wps.rules';

@Injectable()
export class ComplianceEngineService {
  private readonly logger = new Logger(ComplianceEngineService.name);

  private rules: Record<string, any> = {
    BPJS_KESEHATAN: new BpjsKesehatanRules(),
    BPJS_KETENAGAKERJAAN: new BpjsKetenagakerjaanRules(),
    PPH21: new TaxPph21Rules(),
    CPF: new CpfRules(),
    WPS: new WpsRules(),
  };

  constructor(private readonly repository: IHRRepository) {}

  async calculate(tenantId: string, module: string, period: string) {
    const rule = this.rules[module];
    if (!rule) throw new BadRequestException(`Unknown compliance module: ${module}`);

    const employees = await this.repository.getEmployees(tenantId);
    return rule.calculate(employees, tenantId);
  }

  export(format: 'CSV' | 'EXCEL' | 'XML' | 'PDF', result: any): string | Buffer {
    // Route to exporter stubs
    if (format === 'CSV') return this.toCsv(result);
    if (format === 'XML') return this.toXml(result);
    return Buffer.from(JSON.stringify(result)); // stub for EXCEL and PDF
  }

  private toCsv(result: any): string {
    const header = 'employeeId,employeeName,grossSalary,employeeContribution,employerContribution,taxAmount,netSalary';
    const rows = result.lineItems.map((i: any) =>
      `${i.employeeId},${i.employeeName},${i.grossSalary},${i.employeeContribution},${i.employerContribution},${i.taxAmount},${i.netSalary}`
    );
    return [header, ...rows].join('\n');
  }

  private toXml(result: any): string {
    const items = result.lineItems.map((i: any) =>
      `<Employee><Id>${i.employeeId}</Id><Name>${i.employeeName}</Name><NetSalary>${i.netSalary}</NetSalary></Employee>`
    ).join('');
    return `<?xml version="1.0" encoding="UTF-8"?><ComplianceReport><Module>${result.module}</Module><Period>${result.period}</Period>${items}</ComplianceReport>`;
  }
}
```

---

# PHASE 3: Compliance Module Registration
**Complexity**: `[SIMPLE]`
**Estimated Steps**: 2

## Step 3.1 — [SIMPLE] Create compliance.module.ts

```typescript
// backend/src/modules/compliance/compliance.module.ts
import { Module } from '@nestjs/common';
import { ComplianceEngineService } from './compliance.service';
import { HRMockRepository } from '../../core/hr/repositories/hr.mock.repository';
import { IHRRepository } from '../../core/hr/repositories/hr.repository.interface';

@Module({
  providers: [
    ComplianceEngineService,
    { provide: IHRRepository, useClass: HRMockRepository },
  ],
  exports: [ComplianceEngineService],
})
export class ComplianceEngineModule {}
```

## Step 3.2 — [SIMPLE] Register in app.module.ts

Open `backend/src/app.module.ts`. Add the following imports:
- `CommandBusModule` from `./shared/command-bus/command-bus.module`
- `ComplianceEngineModule` from `./modules/compliance/compliance.module`

Add both to the `imports` array.

---

# PHASE 4: Payroll — Compliance Integration
**Complexity**: `[COMPLEX]`
**Estimated Steps**: 3

## Step 4.1 — [COMPLEX] Update `ExecutePayrollCommand` handler

In `backend/src/core/hr/commands/hr.command-handlers.ts`, update the `ExecutePayrollCommandHandler`.

After payroll is calculated, the handler should:
1. Call `ComplianceEngineService.calculate(tenantId, 'BPJS_KESEHATAN', period)`.
2. Call `ComplianceEngineService.calculate(tenantId, 'BPJS_KETENAGAKERJAAN', period)`.
3. Call `ComplianceEngineService.calculate(tenantId, 'PPH21', period)`.
4. Attach the compliance results to the payroll run metadata.
5. Return a combined `PayrollExecutionResult`.

**Anti-drift check**: If you are adding any code unrelated to this handler, STOP and re-read this section.

## Step 4.2 — [COMPLEX] Add compliance endpoints to HRController

Open `backend/src/core/hr/hr.controller.ts`.

Add a new section at the end of the file:

```typescript
// ==================== Compliance Engine ====================

/**
 * POST /hr/compliance/calculate
 * Run a compliance calculation for a specific module and period
 */
@Post('compliance/calculate')
async runComplianceCalculation(
  @Req() request: RequestWithTenant,
  @Body() dto: { module: string; period: string }
) {
  const { tenantId } = request.tenantContext;
  const result = await this.complianceEngineService.calculate(tenantId, dto.module, dto.period);
  return { success: true, tenantId, data: result };
}

/**
 * POST /hr/compliance/export
 * Export a compliance report in the specified format
 */
@Post('compliance/export')
async exportComplianceReport(
  @Req() request: RequestWithTenant,
  @Body() dto: { module: string; period: string; format: 'CSV' | 'EXCEL' | 'XML' | 'PDF' }
) {
  const { tenantId } = request.tenantContext;
  const result = await this.complianceEngineService.calculate(tenantId, dto.module, dto.period);
  const exported = this.complianceEngineService.export(dto.format, result);
  // For CSV/XML return as text, for binary as base64
  if (dto.format === 'CSV' || dto.format === 'XML') {
    return { success: true, tenantId, format: dto.format, data: exported };
  }
  return { success: true, tenantId, format: dto.format, data: (exported as Buffer).toString('base64') };
}
```

**Important**: Also inject `ComplianceEngineService` into the `HRController` constructor. Add it to the constructor parameter list and register it in the `hr.module.ts`.

## Step 4.3 — [COMPLEX] Update hr.module.ts

Open `backend/src/core/hr/hr.module.ts`.

Import `ComplianceEngineModule` and add it to the `imports` array.
Add `ComplianceEngineService` to the `providers` array.

---

# PHASE 5: AI Automation Hooks
**Complexity**: `[SIMPLE]`
**Estimated Steps**: 2

## Step 5.1 — [SIMPLE] Create ComplianceSuggestionService

Create: `backend/src/modules/compliance/compliance-suggestion.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class ComplianceSuggestionService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSuggestions(tenantId: string): Promise<ComplianceSuggestion[]> {
    const company = await this.prisma.company.findUnique({ where: { id: tenantId } });
    if (!company) return [];

    const suggestions: ComplianceSuggestion[] = [];

    if (company.country === 'ID') {
      suggestions.push({
        country: 'ID',
        message: 'Company is registered in Indonesia. Enable BPJS Kesehatan compliance?',
        modules: ['BPJS_KESEHATAN', 'BPJS_KETENAGAKERJAAN', 'PPH21'],
        requiresApproval: true,
      });
    }

    if (company.country === 'SG') {
      suggestions.push({
        country: 'SG',
        message: 'Company is registered in Singapore. Enable CPF contributions?',
        modules: ['CPF'],
        requiresApproval: true,
      });
    }

    if (company.country === 'AE') {
      suggestions.push({
        country: 'AE',
        message: 'Company is registered in UAE. Enable WPS salary validation?',
        modules: ['WPS'],
        requiresApproval: true,
      });
    }

    return suggestions;
  }
}

export interface ComplianceSuggestion {
  country: string;
  message: string;
  modules: string[];
  requiresApproval: boolean;
}
```

## Step 5.2 — [SIMPLE] Expose AI suggestion via HRController

Add the following endpoint to `hr.controller.ts`:

```typescript
/**
 * GET /hr/compliance/ai-suggestions
 * AI-powered compliance module suggestions based on company registration
 */
@Get('compliance/ai-suggestions')
async getComplianceSuggestions(@Req() request: RequestWithTenant) {
  const { tenantId } = request.tenantContext;
  const suggestions = await this.complianceSuggestionService.generateSuggestions(tenantId);
  return { success: true, tenantId, data: suggestions };
}
```

---

# PHASE 6: Navigation + Settings Update (Specification Only)
**Complexity**: `[SIMPLE]`
**Estimated Steps**: 1

## Step 6.1 — [SIMPLE] Update mappings/HR.txt and mappings/HR.json

After implementing Phases 1–5, update both mapping files.

### In HR.txt, update Section 7 (Compliance):

```
### 7. Compliance & Governance (Compliance OS)
- Path: /core/hr/lexboard (Compliance Center)
- Button: "Compliance Center"
- Sub-sections:
  - Smart Vault: OCR document management
  - Compliance Engine: Per-country module calculations
    - Indonesia: BPJS Kesehatan, BPJS Ketenagakerjaan, PPh21
    - Singapore: CPF
    - UAE: WPS
  - Export Center: CSV, Excel, XML, PDF downloads
  - Government Portals: DJP Online, BPJS Employer Portal
  - AI Suggestions: Automated compliance module recommendations
```

### In HR.json, update the Compliance section to include:
```json
{
  "section": "Compliance",
  "compliance_engine": {
    "countries": ["ID", "SG", "AE"],
    "modules": {
      "ID": ["BPJS_KESEHATAN", "BPJS_KETENAGAKERJAAN", "PPH21"],
      "SG": ["CPF"],
      "AE": ["WPS"]
    },
    "export_formats": ["CSV", "EXCEL", "XML", "PDF"],
    "portals": ["DJP Online", "BPJS Employer Portal"]
  },
  "ai_suggestions": true
}
```

### Also update HR.json `integrations` to include:
```json
"integrations": ["IT Provisioning", "Finance Sync", "Security RBAC", "Global Audit Log", "Compliance Engine", "CommandBus"]
```

---

# PHASE 7: Compile and Verify
**Complexity**: `[SIMPLE]`
**Estimated Steps**: 1

## Step 7.1 — [SIMPLE] Run TypeScript compile check

Run this command from the backend directory:
```bash
npx tsc -p tsconfig.json --noEmit
```

Fix ALL errors before marking as done.

If there are import errors: check that `IHRRepository` is correctly referenced as the injection token.
If there are type errors in compliance rules: ensure the `calculate()` return type matches `ComplianceCalculationResult`.

---

# POST-EXECUTION CHECKLIST

After completing all phases, confirm the following:
- [x] `CommandBusModule` is registered globally in `app.module.ts`
- [x] `ComplianceEngineModule` is imported in `hr.module.ts`
- [x] All compliance rule files exist in `backend/src/modules/compliance/`
- [x] All HR command classes exist in `backend/src/core/hr/commands/hr.commands.ts`
- [x] TypeScript build passes with zero errors
- [x] `mappings/HR.txt` and `mappings/HR.json` are updated

---

# COMPLEXITY SUMMARY

| Phase | Description | Complexity |
|-------|-------------|------------|
| 1 | CommandBus Infrastructure | COMPLEX |
| 2 | Global Compliance Engine | COMPLEX |
| 3 | Module Registration | SIMPLE |
| 4 | Payroll-Compliance Integration | COMPLEX |
| 5 | AI Automation Hooks | SIMPLE |
| 6 | Navigation/Spec Updates | SIMPLE |
| 7 | Compile & Verify | SIMPLE |

> ⚠️ COMPLEX phases should be handled by a capable model (e.g., Gemini Pro, Claude Sonnet, GPT-4o).
> ✅ SIMPLE phases can be handled by Gemini Flash with careful reading of this plan.

---

# ANTI-DRIFT FINAL REMINDER

If you are writing code that is NOT part of the current phase: **STOP.**
Re-read the phase description and only write code that belongs to that phase.
The goal is a clean, incremental implementation — not a big-bang rewrite.
