import { Injectable, Logger } from "@nestjs/common";
import { IHRRepository } from "./repositories/hr.repository.interface";
import { AnalyticsService } from "./analytics.service";

@Injectable()
export class SuccessionService {
  private readonly logger = new Logger(SuccessionService.name);

  constructor(
    private readonly repository: IHRRepository,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getPlans(tenantId: string) {
    return this.repository.getSuccessionPlans(tenantId);
  }

  async getPlan(tenantId: string, positionId: string) {
    return this.repository.getSuccessionPlan(tenantId, positionId);
  }

  async createPlan(tenantId: string, data: any) {
    return this.repository.createSuccessionPlan(tenantId, data);
  }

  async getModelSuccession(tenantId: string, positionId: string) {
    this.logger.log(`Modeling succession for position ${positionId}`);

    const [position, result] = await Promise.all([
      this.repository.getPositions(tenantId).then(pos => pos.find(p => p.id === positionId)),
      this.repository.getEmployees(tenantId, undefined, 1, 1000),
    ]);

    if (!position) throw new Error("Position not found");

    // Filter potential candidates (one grade below, high performance)
    // In a real system, we'd look at job grades. Here we'll simulate by matching department.
    const departmentLevelEmployees = result.data.filter(e => e.departmentId === position.departmentId);
    
    // Simulate scoring logic
    const candidates = departmentLevelEmployees.map(e => {
      const score = Math.floor(Math.random() * 40) + 60; // 60-100
      let readiness = "READY_1_2_YEARS";
      if (score > 90) readiness = "READY_NOW";
      else if (score < 70) readiness = "READY_3_PLUS_YEARS";

      return {
        employeeId: e.id,
        name: e.firstName + " " + e.lastName,
        currentRole: e.jobTitle,
        readinessScore: score,
        readiness,
        skillGaps: ["Leadership", "Budgeting"].slice(0, Math.floor(Math.random() * 3)),
      };
    });

    return candidates.sort((a, b) => b.readinessScore - a.readinessScore);
  }

  async assessBenchStrength(tenantId: string, departmentId?: string) {
    return this.repository.getBenchStrength(tenantId, departmentId);
  }

  async nominateSuccessor(tenantId: string, data: any) {
    this.logger.log(`Nominating successor ${data.employeeId} for plan ${data.planId}`);
    
    // Check flight risk from AnalyticsService for better decision support
    const risks = await this.analyticsService.getFlightRisks(tenantId);
    const candidateRisk = risks.find(r => r.employeeId === data.employeeId);
    
    const candidateData = {
      ...data,
      riskOfLoss: candidateRisk?.riskScore > 0.7 ? "HIGH" : (candidateRisk?.riskScore > 0.4 ? "MEDIUM" : "LOW"),
    };

    return this.repository.addSuccessionCandidate(tenantId, candidateData);
  }
}
