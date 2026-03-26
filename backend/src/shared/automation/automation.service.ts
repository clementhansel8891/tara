import { Injectable, OnModuleInit } from "@nestjs/common";
import { EventBusService, DomainEvent } from "../events/event-bus.service";
import { LoggerService } from "../logger/logger.service";
import { AuditService } from "../audit/audit.service";

export interface AutomationRule {
  id: string;
  tenantId: string;
  name: string;
  eventPattern: string; // e.g., "HR.EMPLOYEE_CREATED", "HR.*"
  condition?: any;      // JSON logic or simple equality
  actionType: "WEBHOOK" | "NOTIFICATION" | "EMAIL" | "TASK_CREATE" | "AI_ANALYZE";
  actionConfig: any;
  enabled: boolean;
}

/**
 * Zenvix Automation Engine
 * Reacts to Domain Events by executing configured rules
 */
@Injectable()
export class AutomationService implements OnModuleInit {
  private rules: AutomationRule[] = []; // In-memory cache for fast matching

  constructor(
    private readonly eventBus: EventBusService,
    private readonly logger: LoggerService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    this.logger.log({
      tenantId: "SYSTEM",
      module: "AUTOMATION",
      level: "INFO",
      event: "ENGINE_STARTED",
      message: "Zenvix Global Event Fabric Automation Engine Initialized",
    });

    // Subscribe to ALL events
    (this.eventBus as any).subscribe("*", "AutomationService.audit", async (event: any) => {
      await this.processEvent(event);
    });

    // Mock initial rules for demonstration
    this.loadMockRules();
  }

  private loadMockRules() {
    this.rules = [
      {
        id: "rule-1",
        tenantId: "zenvix-corp",
        name: "New Employee Onboarding Alert",
        eventPattern: "HR.EMPLOYEE_CREATED",
        actionType: "NOTIFICATION",
        actionConfig: { channel: "admin-slack", message: "Welcome our new joiner!" },
        enabled: true,
      },
      {
        id: "rule-2",
        tenantId: "zenvix-corp",
        name: "Security Alert: High Manual Adjustment",
        eventPattern: "HR.PAYROLL_CALCULATED",
        condition: { field: "totalAmount", gt: 100000000 }, // > 100M
        actionType: "AI_ANALYZE",
        actionConfig: { prompt: "Analyze this high payroll for anomalies." },
        enabled: true,
      }
    ];
  }

  private async processEvent(event: DomainEvent) {
    // 1. Find matching rules
    const matches = this.rules.filter(rule => 
      rule.enabled && 
      rule.tenantId === event.tenantId && 
      this.matchesPattern(event.eventType, rule.eventPattern)
    );

    for (const rule of matches) {
      if (this.evaluateCondition(event, rule)) {
        await this.executeAction(event, rule);
      }
    }
  }

  private matchesPattern(eventType: string, pattern: string): boolean {
    if (pattern === "*") return true;
    if (pattern.endsWith("*")) {
      return eventType.startsWith(pattern.slice(0, -1));
    }
    return eventType === pattern;
  }

  private evaluateCondition(event: DomainEvent, rule: AutomationRule): boolean {
    if (!rule.condition) return true;
    
    const { field, gt, eq } = rule.condition;
    const value = event.payload?.[field];

    if (gt !== undefined && value > gt) return true;
    if (eq !== undefined && value === eq) return true;
    
    return false;
  }

  private async executeAction(event: DomainEvent, rule: AutomationRule) {
    this.logger.log({
      tenantId: event.tenantId,
      module: "AUTOMATION",
      level: "INFO",
      event: "RULE_TRIGGERED",
      message: `Automation rule '${rule.name}' triggered by ${event.eventType}`,
      payload: { ruleId: rule.id },
      userId: event.userId,
    });

    // In a real system, this would call specific service handlers
    this.logger.log({
      tenantId: event.tenantId,
      module: "AUTOMATION",
      level: "INFO",
      event: "ACTION_EXECUTED",
      message: `Executed ${rule.actionType} for rule ${rule.name}`,
    });

    // Log to Audit for compliance
    await this.audit.log({
      tenantId: event.tenantId,
      userId: "SYSTEM_AUTO",
      module: "AUTOMATION",
      action: "EXECUTE",
      entityType: "AUTOMATION_RULE",
      entityId: rule.id,
      metadata: { actionType: rule.actionType },
    }, (event as any).tx);
  }
}
