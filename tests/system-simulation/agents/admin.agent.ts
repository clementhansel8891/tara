import { BaseAgent } from "../simulation-engine/base.agent";

export class AdminAgent extends BaseAgent {
  async createBranch(name: string, code: string) {
    return this.performAction(`Create Branch: ${name}`, async () => {
      const response = (await this.client.post("/retail/stores", {
        name,
        code,
        locationId: "placeholder",
        type: "flagship",
        address: "Simulation Street 123",
        country: "ID",
        currency: "IDR",
        timezone: "Asia/Jakarta",
      })) as any;

      if (response.success && response.data) {
        return { ...response.data, locationId: response.data.locationId };
      }
      return response.data;
    });
  }

  async createDepartment(name: string, code: string) {
    return this.performAction(`Create Department: ${name}`, async () => {
      const response = (await this.client.post("/hr/departments", {
        name,
        code,
        description: `Department for ${name}`,
      })) as any;
      return response.data;
    });
  }

  async createEmployee(data: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    departmentId: string;
    locationId: string;
  }) {
    return this.performAction(`Create Employee: ${data.email}`, async () => {
      const payload = {
        employeeCode: `EMP-${Date.now().toString().slice(-6)}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        roleTitle: data.role,
        departmentId: data.departmentId,
        locationId: data.locationId,
        employmentType: "full_time",
        hireDate: new Date().toISOString(),
      };

      const response = (await this.client.post(
        "/hr/employees",
        payload,
      )) as any;
      return response.data;
    });
  }

  async setupDefaultPolicy() {
    return this.performAction("Setup Default Policies", async () => {
      return { success: true };
    });
  }
}
