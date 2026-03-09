// @ts-nocheck
import { SimulationEngine } from "../simulation-engine/engine";
import { OwnerAgent } from "../agents/owner.agent";
import { AdminAgent } from "../agents/admin.agent";

export const BootstrapScenario = async (engine: SimulationEngine) => {
  const baseURL = "http://localhost:3001/api";
  const userEmail = `owner-${Date.now()}@zenvix.com`;
  const companyName = `Retail Corp ${new Date().toLocaleDateString()}`;

  // 1. Initial Setup
  const owner = new OwnerAgent("owner", { baseURL });
  engine.registerAgent(owner);

  // Register and Login
  await owner.registerUser(userEmail);
  await owner.login(userEmail);

  // Provision Company
  const provisionResult = await owner.provisionCompany(companyName);
  const tenantId = provisionResult.tenantId || provisionResult.id;
  engine.getContext().set("tenantId", tenantId);

  // 2. Admin Setup
  const admin = new AdminAgent("admin", { baseURL, tenantId });
  engine.registerAgent(admin);

  // Create Main Branch (Store)
  const branchResult = await admin.createBranch(
    "Main Retail Branch",
    `BR${Date.now().toString().slice(-4)}`,
  );
  engine.getContext().push("branches", branchResult);

  // Create Departments
  const deptResult = await admin.createDepartment(
    "Retail Sales",
    `RS${Date.now().toString().slice(-4)}`,
  );

  // Create Core Employees
  const empResult = await admin.createEmployee({
    firstName: "Alice",
    lastName: "Retail",
    email: `alice-${Date.now()}@zenvix.com`,
    role: "STORE_MANAGER",
    departmentId: deptResult.id,
    locationId: branchResult.locationId || branchResult.id,
  });

  engine.getContext().set("manager", empResult);

  await admin.setupDefaultPolicy();

  return { tenantId, branch: branchResult };
};
