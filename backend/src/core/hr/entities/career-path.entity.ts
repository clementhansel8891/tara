export class CareerPath {
  id: string;
  tenantId: string;
  fromPositionId: string;
  toPositionId: string;
  requirementNotes?: string;
  createdAt: Date;
  updatedAt: Date;

  fromPosition?: any;
  toPosition?: any;
}
