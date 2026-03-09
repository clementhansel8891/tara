import { BaseAgent } from "../simulation-engine/base.agent";

export class OwnerAgent extends BaseAgent {
  async registerUser(email: string) {
    return this.performAction("Register User", async () => {
      const response = (await this.client.post("/auth/register", {
        email,
        password: "Password123!",
        firstName: "System",
        lastName: "Owner",
      })) as any;
      return response.data;
    });
  }

  async login(email: string) {
    return this.performAction("Login", async () => {
      const response = (await this.client.post("/auth/login", {
        email,
        password: "Password123!",
      })) as any;

      if (response.success && response.data && response.data.token) {
        this.setToken(response.data.token);
      }
      return response.data;
    });
  }

  async provisionCompany(companyName: string) {
    return this.performAction("Provision Company", async () => {
      const response = (await this.client.post("/auth/company/provision", {
        name: companyName,
        industry: "RETAIL",
        country: "ID",
      })) as any;

      if (response.success && response.data) {
        // Log the actual structure for debugging if it fails again
        this.logger.log(
          `Provision Response Data: ${JSON.stringify(response.data)}`,
        );

        // Try all common fields
        const tenantId =
          response.data.tenantId ||
          response.data.id ||
          (response.data.company && response.data.company.id);
        this.setTenant(tenantId);
      }
      return response.data;
    });
  }
}
