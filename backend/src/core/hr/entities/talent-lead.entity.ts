export class TalentLead {
  id: string;
  tenantId: string;
  source: string;
  externalProfileUrl?: string;
  name: string;
  email?: string;
  phone?: string;
  headline?: string;
  skills?: any;
  leadScore: number;
  status: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}
