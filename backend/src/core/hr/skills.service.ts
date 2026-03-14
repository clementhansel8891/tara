import { Injectable, Logger } from "@nestjs/common";
import { IHRRepository } from "./repositories/hr.repository.interface";

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(private readonly repository: IHRRepository) {}

  async mapInternalTalent(tenantId: string, skillIds: string[], minProficiency: number = 3) {
    this.logger.log(`Mapping internal talent for skills: ${skillIds.join(", ")}`);
    return this.repository.findTalentBySkills(tenantId, skillIds, minProficiency);
  }

  async calculateSkillGap(tenantId: string, employeeId: string, targetRoleId: string) {
    this.logger.log(`Calculating skill gap for employee ${employeeId} against role ${targetRoleId}`);
    
    // In a real system, positions would have required skills. 
    // We'll simulate this by fetching employee skills and comparing to a mock role requirement.
    const employeeSkills = await this.repository.getEmployeeSkills(tenantId, employeeId);
    
    // Mock target role requirements
    const targetRequirements = [
      { skillName: "TypeScript", minProficiency: 4 },
      { skillName: "NodeJS", minProficiency: 4 },
      { skillName: "Leadership", minProficiency: 3 },
    ];

    const gaps = targetRequirements.map(req => {
      const actual = employeeSkills.find(es => es.skill?.name === req.skillName);
      return {
        skillName: req.skillName,
        required: req.minProficiency,
        actual: actual?.proficiency || 0,
        gap: Math.max(0, req.minProficiency - (actual?.proficiency || 0)),
      };
    });

    return {
      employeeId,
      targetRoleId,
      matchPercentage: (gaps.filter(g => g.gap === 0).length / gaps.length) * 100,
      gaps,
    };
  }

  async verifyProficiency(tenantId: string, employeeId: string, skillId: string, verifiedBy: string) {
    this.logger.log(`Verifying skill ${skillId} for employee ${employeeId} by ${verifiedBy}`);
    return this.repository.updateEmployeeSkill(tenantId, {
      employeeId,
      skillId,
      verificationStatus: "VERIFIED",
      verifiedBy,
      verifiedAt: new Date(),
    });
  }
}
