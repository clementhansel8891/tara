import { apiRequest } from "@/core/api/apiClient";
import type { SessionContext } from "@/core/security/session";

export interface OrgProfile {
  name: string;
  code: string;
  country: string;
  currency: string;
  industry: string;
}

export interface TenantPreferences {
  procurement_mode: 'DIRECT' | 'BIDDING';
  require_refund_approval?: boolean;
  dual_control_roles?: boolean;
  enable_biometric_attendance?: boolean;
}

export const orgSettingsService = {
  async getProfile(session: SessionContext): Promise<OrgProfile> {
    return apiRequest<OrgProfile>("/v1/settings/profile", "GET", session);
  },

  async updateProfile(session: SessionContext, data: Partial<OrgProfile>): Promise<void> {
    await apiRequest<void>("/v1/settings/profile", "PUT", session, data);
  },

  async getPreferences(session: SessionContext): Promise<TenantPreferences> {
    return apiRequest<TenantPreferences>("/v1/settings/preferences", "GET", session);
  },

  async updatePreferences(session: SessionContext, data: Partial<TenantPreferences>): Promise<void> {
    await apiRequest<void>("/v1/settings/preferences", "PUT", session, data);
  },

  async getChildCompanies(session: SessionContext): Promise<OrgProfile[]> {
    const result = await apiRequest<OrgProfile[]>("/v1/settings/child-companies", "GET", session);
    return result || [];
  },

  async createChildCompany(session: SessionContext, data: any): Promise<OrgProfile> {
    return apiRequest<OrgProfile>("/v1/settings/child-companies", "POST", session, data);
  },

  async getLocations(session: SessionContext): Promise<any[]> {
    const result = await apiRequest<any[]>("/v1/settings/locations", "GET", session);
    return result || [];
  },

  async createLocation(session: SessionContext, data: any): Promise<any> {
    return apiRequest<any>("/v1/settings/locations", "POST", session, data);
  }
};
