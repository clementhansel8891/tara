export class Interview {
  id: string;
  tenantId: string;
  candidateId: string;
  interviewerId: string;
  title: string;
  scheduledAt: Date;
  duration: number;
  location?: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
