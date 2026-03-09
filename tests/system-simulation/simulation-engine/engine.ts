import { BaseAgent } from "./base.agent";
import { ContextManager } from "./context-manager";
import { SimLogger } from "./logger";

export class SimulationEngine {
  private agents: Map<string, BaseAgent> = new Map();
  private context: ContextManager;
  private logger: SimLogger;

  constructor() {
    this.context = new ContextManager();
    this.logger = new SimLogger("engine");
  }

  registerAgent(agent: BaseAgent) {
    this.agents.set(agent.name, agent);
    this.logger.log(`Agent registered: ${agent.name}`);
  }

  getAgent<T extends BaseAgent>(name: string): T {
    return this.agents.get(name) as T;
  }

  getContext() {
    return this.context;
  }

  async runScenario(
    name: string,
    scenarioFn: (engine: SimulationEngine) => Promise<void>,
  ) {
    this.logger.log(`Starting Scenario: ${name}`);
    try {
      await scenarioFn(this);
      this.logger.log(`Successfully completed Scenario: ${name}`);
    } catch (e: any) {
      this.logger.error(`Scenario failed: ${name}`, e);
      throw e;
    }
  }
}
