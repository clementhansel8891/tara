/**
 * Candidate Entity
 * Represents an individual in the recruitment funnel
 */
export class Candidate {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  requisitionId: string;
  source: string;
  status: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  resumeUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  requisition?: any;
}
