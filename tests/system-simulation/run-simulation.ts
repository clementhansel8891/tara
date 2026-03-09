import { SimulationEngine } from "./simulation-engine/engine";
import { BootstrapScenario } from "./scenarios/bootstrap.scenario";
import { POSChaosScenario } from "./scenarios/pos-chaos.scenario";
import { SimLogger } from "./simulation-engine/logger";
import { ResultAnalyzer } from "./simulation-engine/result-analyzer";

const main = async () => {
  const logger = new SimLogger("runner");
  const engine = new SimulationEngine();

  logger.log("🚀 Starting Autonomous System Simulation Framework");

  try {
    // Phase 1: Bootstrap Infrastructure
    await engine.runScenario("Bootstrap", BootstrapScenario);

    // Phase 2: Transactional Chaos Testing
    await engine.runScenario("POS Chaos", POSChaosScenario);

    logger.log("📊 Analyzing Results...");
    const analyzer = new ResultAnalyzer();
    analyzer.generateReport();

    logger.log("✅ Simulation completed successfully");
  } catch (error: any) {
    logger.error("❌ Simulation aborted due to critical error", error);
    process.exit(1);
  }
};

main();
