import { FaultInjector, FaultType } from "./fault-injector";
import { SimLogger } from "../simulation-engine/logger";

export class ChaosController {
  private injector: FaultInjector;
  private logger: SimLogger;

  constructor(injector: FaultInjector) {
    this.injector = injector;
    this.logger = new SimLogger("chaos-controller");
  }

  enablePOSChaos() {
    this.logger.log("Enabling POS Chaos Faults (15% probability)");
    this.injector.configureFaults([
      { type: FaultType.API_ERROR, probability: 0.15 },
      { type: FaultType.API_ABORT, probability: 0.05 },
      {
        type: FaultType.API_DELAY,
        probability: 0.3,
        metadata: { delay: 2000 },
      },
    ]);
  }

  enableEcomChaos() {
    this.logger.log("Enabling Ecommerce Chaos Faults (25% latency)");
    this.injector.configureFaults([
      {
        type: FaultType.API_DELAY,
        probability: 0.25,
        metadata: { delay: 5000 },
      },
      { type: FaultType.API_ERROR, probability: 0.1 },
    ]);
  }

  stopChaos() {
    this.logger.log("Stopping all chaos injections");
    this.injector.configureFaults([]);
  }
}
