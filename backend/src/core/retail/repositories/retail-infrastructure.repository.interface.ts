import {
  RetailGatewayNode,
  RetailLoadBalancer,
} from "../entities/retail.entity";

export abstract class IRetailInfrastructureRepository {
  // Gateway Nodes
  abstract listGatewayNodes(tenantId: string): Promise<RetailGatewayNode[]>;
  abstract getGatewayNode(
    tenantId: string,
    nodeId: string,
  ): Promise<RetailGatewayNode | null>;
  abstract updateGatewayStatus(
    tenantId: string,
    nodeId: string,
    status: string,
  ): Promise<RetailGatewayNode>;
  abstract heartbeat(
    tenantId: string,
    nodeId: string,
    healthScore: number,
  ): Promise<void>;

  // Load Balancers
  abstract listLoadBalancers(tenantId: string): Promise<RetailLoadBalancer[]>;
  abstract getLoadBalancer(
    tenantId: string,
    lbId: string,
  ): Promise<RetailLoadBalancer | null>;
  abstract createLoadBalancer(
    tenantId: string,
    data: any,
  ): Promise<RetailLoadBalancer>;
  abstract updateLoadBalancer(
    tenantId: string,
    lbId: string,
    data: any,
  ): Promise<RetailLoadBalancer>;
}
