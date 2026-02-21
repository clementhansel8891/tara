import { apiRequest } from "@/core/api/apiClient";
import { SessionContext, ensureTenant } from "@/core/security/session";
import { RetailGatewayNode, RetailLoadBalancer } from "@/core/types/retail/retail";

export const retailInfrastructureService = {
  async listGatewayNodes(tenantId: string, session: SessionContext): Promise<RetailGatewayNode[]> {
    ensureTenant(tenantId, session);
    return apiRequest<RetailGatewayNode[]>(`/retail/infrastructure/nodes`, "GET", session);
  },

  async setNodeStatus(
    tenantId: string,
    session: SessionContext,
    nodeId: string,
    status: RetailGatewayNode["status"]
  ): Promise<RetailGatewayNode> {
    ensureTenant(tenantId, session);
    return apiRequest<RetailGatewayNode>(`/retail/infrastructure/nodes/${nodeId}/status`, "PUT", session, { status });
  },

  async listLoadBalancers(tenantId: string, session: SessionContext): Promise<RetailLoadBalancer[]> {
    ensureTenant(tenantId, session);
    return apiRequest<RetailLoadBalancer[]>(`/retail/infrastructure/load-balancers`, "GET", session);
  },

  async createLoadBalancer(tenantId: string, session: SessionContext, data: any): Promise<RetailLoadBalancer> {
    ensureTenant(tenantId, session);
    return apiRequest<RetailLoadBalancer>(`/retail/infrastructure/load-balancers`, "POST", session, data);
  },

  async updateLoadBalancer(tenantId: string, session: SessionContext, lbId: string, data: any): Promise<RetailLoadBalancer> {
    ensureTenant(tenantId, session);
    return apiRequest<RetailLoadBalancer>(`/retail/infrastructure/load-balancers/${lbId}`, "PUT", session, data);
  },
};
