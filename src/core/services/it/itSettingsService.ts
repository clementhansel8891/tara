import { apiRequest } from "@/core/api/apiClient";
import type { SessionContext } from "@/core/security/session";

export type ProvisioningStatus = "PENDING" | "FULFILLED" | "PROCUREMENT_TRIGGERED" | "CANCELLED";

export interface ITProvisioningRequest {
  id: string;
  tenantId: string;
  requesterId: string;
  catalogItemId: string;
  sku: string;
  name: string;
  locationId: string;
  notes: string;
  status: ProvisioningStatus;
  requisitionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITDevice {
  id: string;
  tenantId: string;
  locationId: string;
  parentId?: string; // For topology mapping
  connections?: string[]; // IDs of connected devices
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
  async getDevices(
    tenantId: string,
    session: SessionContext,
    locationId?: string,
  ): Promise<ITDevice[]> {
    const searchParams = new URLSearchParams();
    if (locationId) searchParams.append("locationId", locationId);
    const queryString = searchParams.toString();
    const url = `/v1/it-settings/devices${queryString ? `?${queryString}` : ""}`;
    return apiRequest<ITDevice[]>(url, "GET", session);
  },

  async registerDevice(
    tenantId: string,
    session: SessionContext,
    data: any,
  ): Promise<ITDevice> {
    return apiRequest<ITDevice>("/v1/it-settings/devices", "POST", session, data);
  },

  async updateDeviceStatus(
    tenantId: string,
    session: SessionContext,
    deviceId: string,
    status: string,
  ): Promise<ITDevice> {
    return apiRequest<ITDevice>(
      `/v1/it-settings/devices/${deviceId}/status`,
      "PUT",
      session,
      { status },
    );
  },

  async updateDevice(
    tenantId: string,
    session: SessionContext,
    deviceId: string,
    data: Partial<ITDevice>,
  ): Promise<ITDevice> {
    return apiRequest<ITDevice>(
      `/v1/it-settings/devices/${deviceId}`,
      "PUT",
      session,
      data,
    );
  },

  async deleteDevice(
    tenantId: string,
    session: SessionContext,
    deviceId: string,
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      `/v1/it-settings/devices/${deviceId}`,
      "DELETE",
      session,
    );
  },

  async getTopology(
    tenantId: string,
    session: SessionContext,
    locationId?: string,
  ): Promise<{ nodes: ITDevice[]; edges: { source: string; target: string }[] }> {
    const searchParams = new URLSearchParams();
    if (locationId) searchParams.append("locationId", locationId);
    const queryString = searchParams.toString();
    const url = `/v1/it-settings/topology${queryString ? `?${queryString}` : ""}`;
    return apiRequest<{ nodes: ITDevice[]; edges: { source: string; target: string }[] }>(
      url,
      "GET",
      session,
    );
  },

  async getSettings(
    tenantId: string,
    session: SessionContext,
    category?: string,
  ): Promise<ITSetting[]> {
    const searchParams = new URLSearchParams();
    if (category) searchParams.append("category", category);
    const queryString = searchParams.toString();
    const url = `/v1/it-settings/settings${queryString ? `?${queryString}` : ""}`;
    return apiRequest<ITSetting[]>(url, "GET", session);
  },

  async updateSetting(
    tenantId: string,
    session: SessionContext,
    key: string,
    data: any,
  ): Promise<ITSetting> {
    return apiRequest<ITSetting>(
      `/v1/it-settings/settings/${key}`,
      "PUT",
      session,
      data,
    );
  },

  // --- Provisioning Requests ---
  async createRequest(
    tenantId: string,
    session: SessionContext,
    data: Partial<ITProvisioningRequest>
  ): Promise<ITProvisioningRequest> {
    return apiRequest<ITProvisioningRequest>("/v1/it-settings/provisioning/requests", "POST", session, data);
  },

  async listRequests(
    tenantId: string,
    session: SessionContext,
    locationId?: string
  ): Promise<ITProvisioningRequest[]> {
    const url = locationId ? `/v1/it-settings/provisioning/requests?locationId=${locationId}` : "/v1/it-settings/provisioning/requests";
    return apiRequest<ITProvisioningRequest[]>(url, "GET", session);
  },
};

