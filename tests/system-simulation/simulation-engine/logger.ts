import * as fs from "fs";
import * as path from "path";

export class SimLogger {
  private logDir: string;
  private logFile: string;

  constructor(agentName: string) {
    this.logDir = path.join(process.cwd(), "tests/system-simulation/logs");
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.logFile = path.join(this.logDir, `${agentName}.log`);
  }

  log(message: string, metadata?: any) {
    const timestamp = new Date().toISOString();
    const metaStr = metadata ? ` | Meta: ${JSON.stringify(metadata)}` : "";
    const entry = `[${timestamp}] INFO: ${message}${metaStr}\n`;
    fs.appendFileSync(this.logFile, entry);
    console.log(`[${timestamp}] [SIM] ${message}`);
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const errorStr = error ? ` | Error: ${error.message || error}` : "";
    const entry = `[${timestamp}] ERROR: ${message}${errorStr}\n`;
    fs.appendFileSync(this.logFile, entry);
    console.error(`[${timestamp}] [SIM-ERROR] ${message}`, error);
  }
}
