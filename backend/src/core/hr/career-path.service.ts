import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { IHRRepository } from "./repositories/hr.repository.interface";
import { SkillsService } from "./skills.service";

@Injectable()
export class CareerPathService {
  private readonly logger = new Logger(CareerPathService.name);

  constructor(
    private readonly repository: IHRRepository,
    private readonly skillsService: SkillsService,
  ) {}

  async suggestNextRoles(tenantId: string, employeeId: string) {
    this.logger.log(`Suggesting next roles for employee ${employeeId}`);
    
    // 1. Get possible career paths from current position
    const employee = await this.repository.getEmployeeById(tenantId, employeeId);
    if (!employee || !employee.positionId) return [];

    const allPaths = await this.repository.getCareerPaths(tenantId);
    const potentialPaths = allPaths.filter(p => p.fromPositionId === employee.positionId);

    // 2. For each potential role, calculate readiness
    const suggestions = await Promise.all(potentialPaths.map(async (path) => {
      const readinessAnalysis = await this.predictReadinessIndex(tenantId, employeeId, path.toPositionId);
      return {
        roleId: path.toPositionId,
        roleName: path.toPosition?.name || "Target Role",
        readinessScore: readinessAnalysis.readinessIndex,
        requirementNotes: path.requirementNotes,
        gaps: readinessAnalysis.gaps,
        recommendations: readinessAnalysis.recommendations,
      };
    }));

    return suggestions.sort((a, b) => b.readinessScore - a.readinessScore);
  }

  async predictReadinessIndex(tenantId: string, employeeId: string, targetPositionId: string) {
    this.logger.log(`Calculating readiness for ${employeeId} to ${targetPositionId}`);
    
    // 1. Calculate base skill gap
    const gapAnalysis = await this.skillsService.calculateSkillGap(tenantId, employeeId, targetPositionId);
    
    // 2. Enhance with importance weighting
    // Core skills (level requirement >= 4) get 2x weight
    let weightedScore = 0;
    let totalPossibleWeight = 0;

    gapAnalysis.gaps.forEach(gap => {
      const weight = gap.required >= 4 ? 2 : 1;
      const skillScore = Math.min(gap.actual, gap.required);
      weightedScore += (skillScore / (gap.required || 1)) * weight;
      totalPossibleWeight += weight;
    });

    const readinessIndex = totalPossibleWeight > 0 
      ? Math.round((weightedScore / totalPossibleWeight) * 100) 
      : 100;

    // 3. Generate proactive recommendations
    const recommendations = gapAnalysis.gaps
      .filter(g => g.actual < g.required)
      .map(g => `Increase ${g.skillName} from Level ${g.actual} to ${g.required}`);

    return {
      employeeId,
      targetPositionId,
      readinessIndex,
      gaps: gapAnalysis.gaps,
      recommendations,
    };
  }

  async findMentorMatches(tenantId: string, employeeId: string) {
    this.logger.log(`Finding mentor matches for employee ${employeeId}`);
    
    const employee = await this.repository.getEmployeeById(tenantId, employeeId);
    if (!employee) throw new NotFoundException("Employee not found");

    // 1. Identify employee skill gaps
    const skills = await this.repository.getEmployeeSkills(tenantId, employeeId);
    const gaps = skills.filter(s => s.proficiency < 3); // Skills needing improvement
    
    if (gaps.length === 0) return [];

    // 2. Find employees with high proficiency in those skills
    const gapSkillIds = gaps.map(g => g.skillId);
    const potentialMentors = await this.repository.findTalentBySkills(tenantId, gapSkillIds, 4);

    // 3. Filter & Enhance with Location Awareness
    return potentialMentors
      .filter(m => m.employee.id !== employeeId)
      .map(m => {
        const isSameLocation = m.employee.locationId === employee.locationId;
        const isSameTenant = m.employee.tenantId === employee.tenantId;
        
        let matchScore = m.matchPercentage;
        if (isSameLocation) matchScore += 10;
        if (isSameTenant) matchScore += 5;

        return {
          mentor: m.employee,
          sharedSkills: m.matchedSkills,
          matchScore: Math.min(100, matchScore),
          contextMatch: isSameLocation ? "LOCAL" : (isSameTenant ? "SAME_TENANT" : "GLOBAL"),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  async createMentorship(tenantId: string, mentorId: string, menteeId: string, focusSkills: string[]) {
    this.logger.log(`Initiating mentorship: ${mentorId} mentoring ${menteeId}`);
    return this.repository.createMentorshipPair(tenantId, {
      mentorId,
      menteeId,
      focusSkills,
      status: "ACTIVE",
      startDate: new Date(),
    });
  }
}
