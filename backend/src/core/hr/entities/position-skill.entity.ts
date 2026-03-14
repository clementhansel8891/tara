export class PositionSkill {
  id: string;
  tenantId: string;
  positionId: string;
  skillId: string;
  minProficiency: number;
  isMandatory: boolean;
  createdAt: Date;
  updatedAt: Date;

  position?: any;
  skill?: any;
}
