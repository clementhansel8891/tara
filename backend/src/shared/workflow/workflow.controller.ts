import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { WorkflowService } from "./workflow.service";
import { TenantInterceptor } from "../../gateway/tenant.interceptor";
import { TenantGuard } from "../guards/tenant.guard";
import { Request } from "express";
import { TenantContext } from "../../gateway/tenant-context.interface";

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller("zenvix-workflow")
// @UseInterceptors(TenantInterceptor)
// @UseGuards(TenantGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {
    console.log("WorkflowController initialized with path: zenvix-workflow");
  }

  @Get("test-routing")
  test() {
    console.log("Workflow test-routing hit!");
    return { status: "ok", message: "Workflow routing is working" };
  }

  @Get("list")
  async listRequests(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    return this.workflowService.listAll(tenantId);
  }

  @Post("request")
  async createRequest(
    @Req() request: RequestWithTenant,
    @Body()
    body: {
      entityType: string;
      entityId: string;
      makerDept: string;
      destinationDept: string;
      notes?: string;
      metadata?: any;
    },
  ) {
    const { tenantId, userId } = request.tenantContext;
    return this.workflowService.createRequest({
      tenantId,
      ...body,
      requestedBy: userId || "system",
    });
  }

  @Get("inbox")
  async getInbox(
    @Req() request: RequestWithTenant,
    @Query("dept") dept: string,
  ) {
    const { tenantId } = request.tenantContext;
    return this.workflowService.listInbox(tenantId, dept);
  }

  @Post(":id/approve")
  async approveRequest(
    @Param("id") id: string,
    @Req() request: RequestWithTenant,
    @Body("notes") notes?: string,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return this.workflowService.approveRequest(tenantId, id, userId || "system", notes);
  }

  @Post(":id/reject")
  async rejectRequest(
    @Param("id") id: string,
    @Req() request: RequestWithTenant,
    @Body("notes") notes?: string,
  ) {
    const { tenantId, userId } = request.tenantContext;
    return this.workflowService.rejectRequest(tenantId, id, userId || "system", notes);
  }
}
