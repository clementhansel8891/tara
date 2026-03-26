import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { WorkflowOrchestratorService } from './workflow-orchestrator.service';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowOrchestratorService) {}

  @Get(':correlationId')
  async getWorkflowInstance(@Param('correlationId') correlationId: string) {
    const instance = await this.workflowService.getWorkflowInstance(correlationId);
    if (!instance) {
      throw new NotFoundException(`Workflow instance with correlationId ${correlationId} not found`);
    }
    return instance;
  }

  @Get(':correlationId/steps')
  async getWorkflowSteps(@Param('correlationId') correlationId: string) {
    const steps = await this.workflowService.getWorkflowSteps(correlationId);
    if (!steps) {
      throw new NotFoundException(`Steps for correlationId ${correlationId} not found`);
    }
    return steps;
  }

  @Get(':correlationId/trace')
  async getWorkflowWithEvents(@Param('correlationId') correlationId: string) {
    const trace = await this.workflowService.getWorkflowWithEvents(correlationId);
    if (!trace) {
      throw new NotFoundException(`Workflow trace for correlationId ${correlationId} not found`);
    }
    return trace;
  }
}
