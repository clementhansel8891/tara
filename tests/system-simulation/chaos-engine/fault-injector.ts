export enum FaultType {
  API_ERROR = "API_ERROR",
  API_ABORT = "API_ABORT",
  API_DELAY = "API_DELAY",
}

export interface FaultConfig {
  type: FaultType;
  probability: number;
  metadata?: any;
}

export class FaultInjector {
  private activeFaults: FaultConfig[] = [];

  configureFaults(faults: FaultConfig[]) {
    this.activeFaults = faults;
  }

  shouldTrigger(type: FaultType): boolean {
    const fault = this.activeFaults.find((f) => f.type === type);
    if (!fault) return false;
    return Math.random() < fault.probability;
  }

  maybeInjectFailure(url: string) {
    if (this.shouldTrigger(FaultType.API_ERROR)) {
      const fault = this.activeFaults.find(
        (f) => f.type === FaultType.API_ERROR,
      );
      const status = fault?.metadata?.status || 500;
      throw new Error(`Chaos Induced Failure: HTTP ${status} for ${url}`);
    }

    if (this.shouldTrigger(FaultType.API_ABORT)) {
      throw new Error(`Chaos Induced Failure: Connection Aborted for ${url}`);
    }
  }
}
