import { Injectable } from "@nestjs/common";
import { IRetailInfrastructureRepository } from "./repositories/retail-infrastructure.repository.interface";
import {
  RetailGatewayNode,
  RetailLoadBalancer,
} from "./entities/retail.entity";

@Injectable()
export class RetailInfrastructureService {
  constructor(private readonly infraRepo: IRetailInfrastructureRepository) {}

  async listGatewayNodes(tenantId: string): Promise<RetailGatewayNode[]> {
    return this.infraRepo.listGatewayNodes(tenantId);
  }

  async getGatewayNode(
    tenantId: string,
    nodeId: string,
  ): Promise<RetailGatewayNode | null> {
    return this.infraRepo.getGatewayNode(tenantId, nodeId);
  }

  async setNodeStatus(
    tenantId: string,
    nodeId: string,
    status: "ACTIVE" | "STANDBY" | "DOWN",
  ): Promise<RetailGatewayNode> {
    return this.infraRepo.updateGatewayStatus(tenantId, nodeId, status);
  }

  async listLoadBalancers(tenantId: string): Promise<RetailLoadBalancer[]> {
    return this.infraRepo.listLoadBalancers(tenantId);
  }

  async createLoadBalancer(
    tenantId: string,
    data: any,
  ): Promise<RetailLoadBalancer> {
    return this.infraRepo.createLoadBalancer(tenantId, data);
  }

  async updateLoadBalancer(
    tenantId: string,
    lbId: string,
    data: any,
  ): Promise<RetailLoadBalancer> {
    return this.infraRepo.updateLoadBalancer(tenantId, lbId, data);
  }
}
