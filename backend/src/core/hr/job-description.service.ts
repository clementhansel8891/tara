import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { IHRRepository } from "./repositories/hr.repository.interface";

@Injectable()
export class JobDescriptionService {
  private readonly logger = new Logger(JobDescriptionService.name);

  constructor(private readonly repository: IHRRepository) {}

  async generateDescription(tenantId: string, positionId: string, tone: 'PROFESSIONAL' | 'MODERN' | 'AGGRESSIVE') {
    this.logger.log(`Generating description for position ${positionId} with tone ${tone}`);
    
    // 1. Get position and requirement metadata
    const position = await this.repository.getPositionById(tenantId, positionId);
    if (!position) throw new NotFoundException(`Position ${positionId} not found`);
    
    const skills = await this.repository.getPositionSkills(tenantId, positionId);
    const mandatorySkills = skills.filter(s => s.isMandatory).map(s => s.skill?.name || "Skill");
    const optionalSkills = skills.filter(s => !s.isMandatory).map(s => s.skill?.name || "Skill");

    // 2. Draft generative content (Mocking LLM output)
    let greeting = "We are looking for a talented professional.";
    let body = `As our ${position.title} (Grade ${position.grade}), you will lead key initiatives within our department.`;
    
    if (tone === 'MODERN') {
      greeting = "Join our mission to disrupt the status quo!";
      body = `Be the ${position.title} we need to scale our innovation. No red tape, just results.`;
    } else if (tone === 'AGGRESSIVE') {
      greeting = "Are you the best? Prove it.";
      body = `We need a high-octane ${position.title}. If you're not ready to grind and win, don't apply.`;
    }

    const description = `
# ${position.title}

${greeting}

${body}

## What You'll Do
- Execute strategic objectives for the ${position.grade} level.
- Collaborate with cross-functional teams.
- Drive excellence in all deliverables.

## What You Bring (Mandatory)
${mandatorySkills.map(s => `- Expert-level proficiency in ${s}`).join('\n')}

## Nice to Have
${optionalSkills.map(s => `- Knowledge of ${s}`).join('\n')}

---
*Equal Opportunity Employer*
    `.trim();

    // 3. Store the generated draft in the repository
    const metadata = {
      description,
      tone,
      generatedAt: new Date(),
      status: 'DRAFT'
    };
    
    await this.repository.updatePositionJobPost(tenantId, positionId, metadata);
    
    return metadata;
  }

  async publishJobPost(tenantId: string, positionId: string, channels: string[]) {
    this.logger.log(`Publishing job post ${positionId} to ${channels.join(', ')}`);
    
    const current = await this.repository.getPositionJobPost(tenantId, positionId);
    if (!current) throw new NotFoundException("No generated description found. Generate one first.");

    const updated = {
      ...current,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      channels
    };

    await this.repository.updatePositionJobPost(tenantId, positionId, updated);
    
    return updated;
  }

  async analyzeMarketAlignment(tenantId: string, positionId: string) {
    this.logger.log(`Analyzing market alignment for ${positionId}`);
    
    const position = await this.repository.getPositionById(tenantId, positionId);
    if (!position) throw new NotFoundException(`Position ${positionId} not found`);

    // Mock competitive analysis logic
    const marketCompetitiveness = Math.floor(Math.random() * 20) + 70; // 70-90%
    const salaryBenchmarkPercentile = Math.floor(Math.random() * 10) + 65; // 65-75%
    
    return {
      positionTitle: position.title,
      marketCompetitiveness,
      top3MissingMarketSkills: ["Cloud Architecture", "System Design (Lvl 5)", "Agile Leadership"],
      salaryBenchmarkPercentile,
      recommendation: "Consider raising the base compensation to reach the 80th percentile for faster hiring."
    };
  }
}
