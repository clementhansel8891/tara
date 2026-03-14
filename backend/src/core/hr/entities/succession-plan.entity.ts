import { SuccessionCandidate } from "./succession-candidate.entity";

export class SuccessionPlan {
  id: string;
  tenantId: string;
  positionId: string;
  isCritical: boolean;
  strategy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  candidates?: SuccessionCandidate[];
}
