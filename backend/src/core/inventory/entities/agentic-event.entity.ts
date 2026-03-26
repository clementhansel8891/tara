export class AgenticEvent {
  id: string;
  tenantId: string;
  eventType: string;
  entityId: string;
  entityType: string;
  payload: any;
  status: string;
  processedAt?: Date;
  errorMsg?: string;
  createdAt: Date;
}
