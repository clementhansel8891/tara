import { apiRequest } from "@/core/api/apiClient";
import type { SessionContext } from "@/core/security/session";

export const adminService = {
  async getDashboardMetrics(tenantId: string, session: SessionContext) {
    return apiRequest<any>("/admin/dashboard", "GET", session);
  },
};
