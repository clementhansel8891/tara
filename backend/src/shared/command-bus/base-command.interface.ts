export interface BaseCommand {
  commandId: string;
  tenantId: string;
  actorId: string;
  timestamp: Date;
  payload: unknown;
}
