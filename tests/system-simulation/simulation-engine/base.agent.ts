import { ERPClient } from "./erp-client";
import { SimLogger } from "./logger";
import { FaultInjector } from "../chaos-engine/fault-injector";

export interface AgentContext {
  baseURL: string;
  tenantId?: any;
  locationId?: any;
  userId?: any;
  role?: any;
  faultInjector?: FaultInjector;
}

export abstract class BaseAgent {
  protected client: ERPClient;
  protected logger: SimLogger;
  protected context: AgentContext;
  public name: string;

  constructor(name: string, context: AgentContext) {
    this.name = name;
    this.context = { ...context };
    this.logger = new SimLogger(name);
    this.client = new ERPClient({
      baseURL: context.baseURL,
      tenantId: context.tenantId,
      locationId: context.locationId,
      faultInjector: context.faultInjector,
    });
  }

  setToken(token: string) {
    this.client.setToken(token);
    this.logger.log("Security token updated");
  }

  setTenant(tenantId: string) {
    this.context.tenantId = tenantId;
    this.client.setTenant(tenantId);
    this.logger.log(`Switched to tenant: ${tenantId}`);
  }

  setLocation(locationId: string) {
    this.context.locationId = locationId;
    this.client.setLocation(locationId);
    this.logger.log(`Switched to location: ${locationId}`);
  }

  async performAction(
    actionName: string,
    actionFn: () => Promise<any>,
  ): Promise<any> {
    this.logger.log(`Starting action: ${actionName}`);
    try {
      const result = await actionFn();
      this.logger.log(`Successfully completed action: ${actionName}`);
      return result;
    } catch (e: any) {
      this.logger.error(`Action failed: ${actionName}`, e);
      throw e;
    }
  }
}
