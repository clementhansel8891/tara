export class SuccessionCandidate {
  id: string;
  tenantId: string;
  planId: string;
  employeeId: string;
  readiness: string;
  readinessScore: number;
  riskOfLoss: string;
  impactOfLoss: string;
  skillGaps: string[];
  createdAt: Date;
  updatedAt: Date;
}
