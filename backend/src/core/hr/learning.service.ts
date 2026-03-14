import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { IHRRepository } from "./repositories/hr.repository.interface";

@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);

  constructor(private readonly repository: IHRRepository) {}

  async recommendLearningPath(tenantId: string, employeeId: string) {
    this.logger.log(`Generating learning recommendations for ${employeeId}`);

    // 1. Get current skill levels
    const employeeSkills = await this.repository.getEmployeeSkills(tenantId, employeeId);
    
    // 2. Identify gaps (based on current position or intended career path)
    const employee = await this.repository.getEmployeeById(tenantId, employeeId);
    if (!employee) throw new NotFoundException(`Employee ${employeeId} not found`);
    
    // Attempt to find position metadata for current roleTitle
    const positions = await this.repository.getPositions(tenantId);
    const targetPosition = positions.find(p => p.title === employee.roleTitle);
    
    const gaps: any[] = [];
    if (targetPosition) {
      const positionSkills = await this.repository.getPositionSkills(tenantId, targetPosition.id);
      for (const ps of positionSkills) {
        const current = employeeSkills.find(es => es.skillId === ps.skillId);
        if (!current || current.proficiency < ps.minProficiency) {
          gaps.push({
            skillId: ps.skillId,
            skillName: (ps as any).skill?.name || "Required Skill",
            gap: ps.minProficiency - (current?.proficiency || 0),
            isMandatory: ps.isMandatory
          });
        }
      }
    }

    // 3. Find programs that address these gaps
    const gapSkillIds = gaps.map(g => g.skillId);
    if (gapSkillIds.length === 0) return [];

    const programs = await this.repository.getTrainingProgramsBySkills(tenantId, gapSkillIds);

    const recommendations = programs.map(p => {
      const addressedGaps = (p as any).skills?.filter((ps: any) => gapSkillIds.includes(ps.skillId)) || [];
      return {
        programId: p.id,
        programName: p.name,
        addressedSkills: addressedGaps.map((ag: any) => ag.skill?.name),
        totalProficiencyGain: addressedGaps.reduce((sum: number, ag: any) => sum + ag.proficiencyGain, 0),
        priority: addressedGaps.some((ag: any) => gaps.find((g: any) => g.skillId === ag.skillId)?.isMandatory) ? 'HIGH' : 'MEDIUM'
      };
    });

    return recommendations.sort((a, b) => (a.priority === 'HIGH' ? -1 : 1));
  }

  async calculateLearningROI(tenantId: string, employeeId: string) {
    this.logger.log(`Calculating learning ROI for ${employeeId}`);
    
    const employee = await this.repository.getEmployeeById(tenantId, employeeId);
    if (!employee) throw new NotFoundException(`Employee ${employeeId} not found`);

    const history = await this.repository.getEmployeeTrainingHistory(tenantId, employeeId);
    const completed = history.filter(h => h.status === 'completed');
    
    // Granular ROI Calculation
    const totalGains = completed.reduce((sum: number, h: any) => {
      return sum + (h.program?.skills?.reduce((s: number, sk: any) => s + sk.proficiencyGain, 0) || 0);
    }, 0);

    const skillAdvancementIndex = completed.length > 0 ? (totalGains / completed.length).toFixed(2) : '0.00';
    
    // Mock performance rating correlation
    const performanceHistory = await this.repository.getEmployeePerformanceHistory(tenantId, employeeId);
    const averageRating = performanceHistory.length > 0 
      ? performanceHistory.reduce((sum, r) => sum + (r.rating || 3), 0) / performanceHistory.length 
      : 3.0;

    return {
      employeeId,
      programsCompleted: completed.length,
      totalProficiencyGained: totalGains,
      skillAdvancementIndex: Number(skillAdvancementIndex),
      currentPerformanceRating: averageRating,
      impactOnPerformance: completed.length > 3 ? 'CRITICAL_GROWTH' : (completed.length > 0 ? 'POSITIVE' : 'NEUTRAL'),
      roiPercentage: completed.length > 0 ? (totalGains * 1.5).toFixed(1) : '0.0', // Mocked ROI multiplier
      summary: `Employee has completed ${completed.length} courses, achieving a competency gain of ${totalGains} units.`
    };
  }

  async autoEnrollInGapFillers(tenantId: string, employeeId: string) {
    this.logger.log(`Running auto-enrollment for ${employeeId}`);
    
    const recommendations = await this.recommendLearningPath(tenantId, employeeId);
    const highPriority = recommendations.filter(r => r.priority === 'HIGH');
    
    const existingHistory = await this.repository.getEmployeeTrainingHistory(tenantId, employeeId);
    const activeProgramIds = existingHistory.filter(h => ['in_progress', 'pending'].includes(h.status)).map(h => h.programId);

    const enrolled = [];
    for (const rec of highPriority) {
      if (!activeProgramIds.includes(rec.programId)) {
        const assignment = await this.repository.enrollInTrainingProgram(tenantId, employeeId, rec.programId);
        enrolled.push(assignment);
      }
    }

    return enrolled;
  }
}
