export class EmployeeSkill {
  id: string;
  tenantId: string;
  employeeId: string;
  skillId: string;
  proficiency: number; // 1-5
  verificationStatus: string; // SELF_ASSESSED, VERIFIED, EXPIRED
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  skill?: any; // To include skill name/category
}
