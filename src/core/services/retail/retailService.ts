import { apiRequest } from "@/core/api/apiClient";
import type { SessionContext } from "@/core/security/session";
import type {
  RetailOrder,
  RetailStore,
  RetailPromotion,
  RetailChannel,
  RetailShift,
  POSDevice,
  RetailOrderItem,
  RetailProduct,
} from "@/core/types/retail/retail";

export const retailService = {
  // --- 1. Access Control & Scope (Now handled by backend or thin wrapper) ---
  async validateAccess(
    tenantId: string,
    employeeId: string,
    storeId: string,
    session: SessionContext,
  ) {
    return apiRequest<{ valid: boolean }>(
      "/retail/validate-access",
      "POST",
      session,
      { storeId },
    );
  },

  async enforceScope(
    tenantId: string,
    session: SessionContext,
    storeId: string,
    shiftId?: string,
  ) {
    // This is essentially a client-side guard that might call a validation endpoint
    // or simply rely on the fact that subsequent API calls will fail if scope is invalid.
    return apiRequest<{ valid: boolean }>(
      "/retail/enforce-scope",
      "POST",
      session,
      { storeId, shiftId },
    );
  },

  async listStores(tenantId: string, session: SessionContext) {
    return apiRequest<RetailStore[]>("/retail/stores", "GET", session);
  },

  async getStore(tenantId: string, storeId: string, session: SessionContext) {
    return apiRequest<RetailStore>(`/retail/stores/${storeId}`, "GET", session);
  },

  async createStore(
    tenantId: string,
    session: SessionContext,
    store: Partial<RetailStore>,
  ) {
    return apiRequest<RetailStore>("/retail/stores", "POST", session, store);
  },

  async updateStore(
    tenantId: string,
    session: SessionContext,
    store: RetailStore,
  ) {
    return apiRequest<RetailStore>(
      `/retail/stores/${store.id}`,
      "PUT",
      session,
      store,
    );
  },

  async deleteStore(
    tenantId: string,
    session: SessionContext,
    storeId: string,
  ) {
    return apiRequest<{ success: boolean }>(
      `/retail/stores/${storeId}`,
      "DELETE",
      session,
    );
  },

  async listOrders(
    tenantId: string,
    session: SessionContext,
    storeId?: string,
  ) {
    const path = storeId
      ? `/retail/orders?store_id=${storeId}`
      : "/retail/orders";
    return apiRequest<RetailOrder[]>(path, "GET", session);
  },

  async listDevices(
    tenantId: string,
    session: SessionContext,
    storeId?: string,
  ) {
    const path = storeId
      ? `/retail/devices?store_id=${storeId}`
      : "/retail/devices";
    return apiRequest<POSDevice[]>(path, "GET", session);
  },

  async listInventory(
    tenantId: string,
    session: SessionContext,
    options?: {
      page?: number;
      pageSize?: number;
      categoryId?: string;
      q?: string;
      sortBy?: "name" | "price" | "createdAt";
      sortDir?: "asc" | "desc";
    },
  ): Promise<
    RetailProduct[] & {
      meta: { total: number; page: number; pageSize: number };
    }
  > {
    type PaginatedArray<T> = T[] & {
      meta: { total: number; page: number; pageSize: number };
    };

    const qs = new URLSearchParams();
    if (options?.page) qs.set("page", String(options.page));
    if (options?.pageSize) qs.set("pageSize", String(options.pageSize));
    if (options?.categoryId) qs.set("categoryId", options.categoryId);
    if (options?.q) qs.set("q", options.q);
    if (options?.sortBy) qs.set("sortBy", options.sortBy);
    if (options?.sortDir) qs.set("sortDir", options.sortDir);
    const path = qs.toString()
      ? `/retail/products?${qs.toString()}`
      : "/retail/products";

    const response = await apiRequest<any>(path, "GET", session);

    // apiRequest already extracts result.data.
    // Backend respond(payload) wraps payload in { success, data }.
    // So response IS the payload { items, total, page, pageSize }
    // or sometimes an array in legacy endpoints.

    const payload = Array.isArray(response)
      ? {
          items: response,
          total: response.length,
          page: 1,
          pageSize: response.length || 1,
        }
      : response || {};

    const items = payload.items || [];
    const totalCount = payload.total ?? items.length;
    const pageNum = payload.page ?? 1;
    const pageSizeNum = payload.pageSize ?? (items.length || 1);

    const mapped = (items || []).map((p: any) => ({
      ...p,
      tenantId: p.tenant_id || p.tenantId || tenantId,
      categoryId: p.category_id || p.categoryId,
      categoryName: p.category_name || p.categoryName || p.category?.name,
      basePrice: p.base_price ?? p.basePrice ?? 0,
      taxRate: p.tax_rate ?? p.taxRate ?? 0,
      unit: p.unit,
      status: (p.status as RetailProduct["status"]) ?? "active",
      createdAt: p.created_at ?? p.createdAt,
      updatedAt: p.updated_at ?? p.updatedAt,
      price: p.base_price ?? p.basePrice ?? 0,
      stock: (p.metadata?.stock_on_hand as number) ?? p.stock ?? 0,
    })) as RetailProduct[];

    const result = mapped as PaginatedArray<RetailProduct>;
    result.meta = { total: totalCount, page: pageNum, pageSize: pageSizeNum };
    return result;
  },

  // --- 2. Order Processing ---
  async createOrder(
    tenantId: string,
    session: SessionContext,
    storeId: string,
    deviceId: string,
    items: {
      itemId: string;
      quantity: number;
      unitPrice: number;
      name: string;
    }[],
    shiftId?: string,
  ) {
    return apiRequest<RetailOrder>("/retail/orders", "POST", session, {
      storeId,
      deviceId,
      items,
      shiftId,
    });
  },

  async processPayment(
    tenantId: string,
    session: SessionContext,
    orderId: string,
    amount: number,
    method: "card" | "cash" | "qr",
    shiftId?: string,
  ) {
    return apiRequest<RetailOrder>(
      `/retail/orders/${orderId}/payment`,
      "POST",
      session,
      {
        amount,
        method,
        shiftId,
      },
    );
  },

  // --- 3. Promotion & Campaign Management ---
  async listPromotions(
    tenantId: string,
    session: SessionContext,
  ): Promise<RetailPromotion[]> {
    return apiRequest<RetailPromotion[]>("/retail/promotions", "GET", session);
  },

  async updatePromotion(
    tenantId: string,
    session: SessionContext,
    promotion: RetailPromotion,
  ) {
    return apiRequest<RetailPromotion>(
      `/retail/promotions/${promotion.id}`,
      "PUT",
      session,
      promotion,
    );
  },

  // --- 4. Channel & Logic Nexus ---
  async listChannels(
    tenantId: string,
    session: SessionContext,
  ): Promise<RetailChannel[]> {
    return apiRequest<RetailChannel[]>("/retail/channels", "GET", session);
  },

  async syncChannel(
    tenantId: string,
    session: SessionContext,
    channelId: string,
  ) {
    return apiRequest<{ success: boolean }>(
      `/retail/channels/${channelId}/sync`,
      "POST",
      session,
    );
  },

  async createChannel(
    tenantId: string,
    session: SessionContext,
    channel: {
      name: string;
      type: RetailChannel["type"];
      sync_frequency?: string;
      provisionCredentials?: boolean;
      branchId?: string;
      domain?: string;
      gatewayUrl?: string;
      connector?: string;
      credentials?: {
        clientId: string;
        clientSecret: string;
      };
    },
  ) {
    return apiRequest<RetailChannel>(
      "/retail/channels",
      "POST",
      session,
      channel,
    );
  },

  async deleteChannel(
    tenantId: string,
    session: SessionContext,
    channelId: string,
  ) {
    return apiRequest<{ success: boolean }>(
      `/retail/channels/${channelId}`,
      "DELETE",
      session,
    );
  },

  async updateChannel(
    tenantId: string,
    session: SessionContext,
    channelId: string,
    updates: {
      name?: string;
      sync_frequency?: string;
      syncFrequency?: string;
      status?: RetailChannel["status"];
    },
  ) {
    return apiRequest<RetailChannel>(
      `/retail/channels/${channelId}`,
      "PUT",
      session,
      updates,
    );
  },

  async rotateChannelCredentials(
    tenantId: string,
    session: SessionContext,
    channelId: string,
  ) {
    return apiRequest<{ clientId: string; clientSecret: string }>(
      `/retail/channels/${channelId}/rotate-credentials`,
      "POST",
      session,
    );
  },

  async revokeChannelCredentials(
    tenantId: string,
    session: SessionContext,
    channelId: string,
  ) {
    return apiRequest<{ clientId: string }>(
      `/retail/channels/${channelId}/revoke-credentials`,
      "POST",
      session,
    );
  },

  // --- 5. Device & IoT Fleet ---
  async pingDevice(
    tenantId: string,
    session: SessionContext,
    deviceId: string,
  ) {
    return apiRequest<{ success: boolean }>(
      `/retail/devices/${deviceId}/ping`,
      "POST",
      session,
    );
  },

  // --- 6. Shift & Fiscal Integrity ---
  async openShift(
    tenantId: string,
    session: SessionContext,
    storeId: string,
    openingCash: number,
  ) {
    return apiRequest<RetailShift>("/retail/shifts/open", "POST", session, {
      storeId,
      openingCash,
    });
  },

  async closeShift(
    tenantId: string,
    session: SessionContext,
    shiftId: string,
    closingCash: number,
    notes?: string,
  ) {
    return apiRequest<RetailShift>(
      `/retail/shifts/${shiftId}/close`,
      "PUT",
      session,
      {
        closingCash,
        notes,
      },
    );
  },

  async listShifts(
    tenantId: string,
    session: SessionContext,
    storeId?: string,
  ) {
    const path = storeId
      ? `/retail/shifts?store_id=${storeId}`
      : "/retail/shifts";
    return apiRequest<RetailShift[]>(path, "GET", session);
  },

  async processReturn(
    tenantId: string,
    session: SessionContext,
    orderId: string,
    itemIds: string[],
    shiftId?: string,
  ) {
    return apiRequest<{ success: boolean }>(
      `/retail/orders/${orderId}/return`,
      "POST",
      session,
      {
        itemIds,
        clientSecret: undefined,
        shiftId,
      },
    );
  },

  async submitOpname(
    tenantId: string,
    session: SessionContext,
    storeId: string,
    adjustments: { sku: string; actualCount: number }[],
    shiftId?: string,
  ) {
    return apiRequest<{ success: boolean }>(
      "/retail/inventory/opname",
      "POST",
      session,
      {
        storeId,
        adjustments,
        shiftId,
      },
    );
  },

  async receiveGoods(
    tenantId: string,
    session: SessionContext,
    storeId: string,
    shipmentId: string,
    items: { itemId: string; received: number }[],
    shiftId?: string,
  ) {
    return apiRequest<{ success: boolean }>(
      "/retail/inventory/receive",
      "POST",
      session,
      {
        storeId,
        shipmentId,
        items,
        shiftId,
      },
    );
  },

  async listInventoryPools(tenantId: string, session: SessionContext) {
    const response = await apiRequest<{ data: any[] }>(
      "/retail/inventory-pools",
      "GET",
      session,
    );
    return response.data;
  },

  async getInventoryStats(
    tenantId: string,
    session: SessionContext,
    options?: { categoryId?: string; q?: string },
  ) {
    const qs = new URLSearchParams();
    if (options?.categoryId) qs.set("categoryId", options.categoryId);
    if (options?.q) qs.set("q", options.q);
    const path = qs.toString()
      ? `/retail/inventory/stats?${qs.toString()}`
      : "/retail/inventory/stats";

    const response = await apiRequest<{
      total: number;
      critical: number;
      lowStock: number;
      overstock: number;
      outOfStock: number;
      totalSOH: number;
      totalATS: number;
      // Added user requested fields
      totalItems: number;
      lowStockCount: number;
      outOfStockCount: number;
      totalValue: number;
    }>(path, "GET", session);
    return response;
  },
};
