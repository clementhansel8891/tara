import { apiRequest } from "@/core/api/apiClient";
import type { SessionContext } from "@/core/security/session";

export interface ITDevice {
  id: string;
  tenantId: string;
  locationId: string;
  deviceType: string;
  deviceName: string;
  ipAddress?: string;
  macAddress?: string;
  status: string;
  lastSeen: string;
  metadata?: any;
}

export interface ITSetting {
  id: string;
  tenantId: string;
  key: string;
  value: string;
  category: string;
  isPublic: boolean;
  description?: string;
}

export const itSettingsService = {
  async getDevices(tenantId: string, session: SessionContext, locationId?: string): Promise<ITDevice[]> {
    const params = locationId ? { locationId } : {};
    return apiRequest<ITDevice[]>("/it-settings/devices", "GET", session, params);
  },

  async registerDevice(tenantId: string, session: SessionContext, data: any): Promise<ITDevice> {
    return apiRequest<ITDevice>("/it-settings/devices", "POST", session, data);
  },

  async updateDeviceStatus(tenantId: string, session: SessionContext, deviceId: string, status: string): Promise<ITDevice> {
    return apiRequest<ITDevice>(`/it-settings/devices/${deviceId}/status`, "PUT", session, { status });
  },

  async getSettings(tenantId: string, session: SessionContext, category?: string): Promise<ITSetting[]> {
    const params = category ? { category } : {};
    return apiRequest<ITSetting[]>("/it-settings/settings", "GET", session, params);
  },

  async updateSetting(tenantId: string, session: SessionContext, key: string, data: any): Promise<ITSetting> {
    return apiRequest<ITSetting>(`/it-settings/settings/${key}`, "PUT", session, data);
  },
};
