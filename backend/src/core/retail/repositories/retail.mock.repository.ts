import { Injectable } from "@nestjs/common";
import { IRetailRepository } from "./retail.repository.interface";
import {
  RetailStore,
  RetailProduct,
  RetailOrder,
  RetailShift,
  ProductProjection,
  LabelConfig,
} from "../entities/retail.entity";
import {
  CreateStoreDto,
  UpdateStoreDto,
  CreateOrderDto,
  OpenShiftDto,
  CloseShiftDto,
  CreateEcommerceStoreDto,
  UpdateEcommerceStoreDto,
  CreateInventoryPoolDto,
} from "../dto/retail.dto";

@Injectable()
export class RetailMockRepository implements IRetailRepository {
  private stores: RetailStore[] = [];
  private products: RetailProduct[] = [];
  private orders: RetailOrder[] = [];
  private shifts: RetailShift[] = [];
  private projections: ProductProjection[] = [];
  private labelConfigs: LabelConfig[] = [];

  constructor() {
    // Initial mock data for testing projections
    this.products = [
      {
        id: "item-6855309f",
        tenant_id: "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f",
        sku: "BELT-LTH-001",
        name: "LEATHER BELT (BASE)",
        description: "Universal leather belt",
        base_price: 250000,
        category_name: "Accessories",
        stockLevels: [],
      } as any,
    ];

    this.projections = [
      {
        id: "proj-001",
        item_master_id: "item-6855309f",
        tenant_id: "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f",
        location_id: "loc-jakarta",
        module_type: "RETAIL",
        custom_name: "Premium Leather Belt",
        custom_description: "Luxury handcrafted leather belt",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
  }

  async listProducts(
    tenantId: string,
    options?: any,
  ): Promise<{
    items: RetailProduct[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const items = this.products
      .filter((p) => p.tenant_id === tenantId)
      .map((p) => {
        // Data Resolution Logic: Hierarchical Overrides
        let projection = undefined;

        // 1. Try to find location-specific override
        if (options?.locationId) {
          projection = this.projections.find(
            (proj) =>
              proj.item_master_id === p.id &&
              proj.tenant_id === tenantId &&
              proj.module_type === "RETAIL" &&
              proj.is_active &&
              proj.location_id === options.locationId,
          );
        }

        // 2. If no location override, try to find a global module-level override
        if (!projection) {
          projection = this.projections.find(
            (proj) =>
              proj.item_master_id === p.id &&
              proj.tenant_id === tenantId &&
              proj.module_type === "RETAIL" &&
              proj.is_active &&
              !proj.location_id,
          );
        }

        return {
          ...p,
          name: projection?.custom_name || p.name,
          description: projection?.custom_description || p.description,
        } as any;
      });

    return {
      items,
      total: items.length,
      page: options?.page || 1,
      pageSize: options?.pageSize || 10,
    };
  }

  // --- Implement other REQUIRED methods with minimal mock logic ---
  async listStores(
    tenantId: string,
    locationId?: string,
  ): Promise<RetailStore[]> {
    return this.stores.filter((s) => s.tenant_id === tenantId);
  }
  async getStore(
    tenantId: string,
    storeId: string,
  ): Promise<RetailStore | null> {
    return null;
  }
  async createStore(
    tenantId: string,
    data: CreateStoreDto,
  ): Promise<RetailStore> {
    return {} as any;
  }
  async updateStore(
    tenantId: string,
    storeId: string,
    data: UpdateStoreDto,
  ): Promise<RetailStore> {
    return {} as any;
  }
  async deleteStore(tenantId: string, storeId: string): Promise<void> {}
  async listInventoryPools(tenantId: string): Promise<any[]> {
    return [];
  }
  async createInventoryPool(
    tenantId: string,
    data: CreateInventoryPoolDto,
  ): Promise<any> {
    return {};
  }
  async getInventoryPool(
    tenantId: string,
    poolId: string,
  ): Promise<any | null> {
    return null;
  }
  async deleteInventoryPool(tenantId: string, poolId: string): Promise<void> {}
  async listEcommerceStores(
    tenantId: string,
    storeId?: string,
  ): Promise<any[]> {
    return [];
  }
  async getEcommerceStore(
    tenantId: string,
    storeId: string,
  ): Promise<any | null> {
    return null;
  }
  async createEcommerceStore(
    tenantId: string,
    data: CreateEcommerceStoreDto,
  ): Promise<any> {
    return {};
  }
  async updateEcommerceStore(
    tenantId: string,
    storeId: string,
    data: UpdateEcommerceStoreDto,
  ): Promise<any> {
    return {};
  }
  async deleteEcommerceStore(
    tenantId: string,
    storeId: string,
  ): Promise<void> {}
  async linkEcommerceToBranch(
    tenantId: string,
    ecommerceId: string,
    branchId: string,
  ): Promise<void> {}
  async unlinkEcommerceFromBranch(
    tenantId: string,
    ecommerceId: string,
    branchId: string,
  ): Promise<void> {}
  async getProduct(
    tenantId: string,
    productId: string,
  ): Promise<RetailProduct | null> {
    return null;
  }
  async listOrders(tenantId: string, storeId?: string): Promise<RetailOrder[]> {
    return [];
  }
  async getOrder(
    tenantId: string,
    orderId: string,
  ): Promise<RetailOrder | null> {
    return null;
  }
  async createOrder(
    tenantId: string,
    locationId: string,
    data: CreateOrderDto,
  ): Promise<RetailOrder> {
    return {} as any;
  }
  async updateOrderStatus(
    tenantId: string,
    orderId: string,
    status: string,
    metadata?: any,
  ): Promise<RetailOrder> {
    return {} as any;
  }
  async reserveStock(
    tenantId: string,
    productId: string,
    quantity: number,
  ): Promise<{ success: boolean; reservationId?: string }> {
    return { success: true };
  }
  async releaseStock(
    tenantId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {}
  async checkStock(
    tenantId: string,
    productId: string,
  ): Promise<{ available: number; status: string }> {
    return { available: 10, status: "IN_STOCK" };
  }
  async getInventoryStats(tenantId: string, options?: any): Promise<any> {
    return {
      totalItems: 0,
      critical: 0,
      lowStock: 0,
      overstock: 0,
      outOfStock: 0,
      totalSOH: 0,
      totalATS: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalValue: 0,
    };
  }
  async getActiveShift(
    tenantId: string,
    storeId: string,
    employeeId: string,
  ): Promise<RetailShift | null> {
    return null;
  }
  async openShift(
    tenantId: string,
    locationId: string,
    employeeId: string,
    data: OpenShiftDto,
  ): Promise<RetailShift> {
    return {} as any;
  }
  async closeShift(
    tenantId: string,
    shiftId: string,
    data: CloseShiftDto,
  ): Promise<RetailShift> {
    return {} as any;
  }
  async listShifts(tenantId: string, storeId?: string): Promise<RetailShift[]> {
    return [];
  }
  async listPromotions(tenantId: string): Promise<any[]> {
    return [];
  }
  async updatePromotion(
    tenantId: string,
    promotionId: string,
    data: any,
  ): Promise<any> {
    return {};
  }
  async listChannels(tenantId: string): Promise<any[]> {
    return [];
  }
  async createChannel(tenantId: string, data: any): Promise<any> {
    return {};
  }
  async updateChannel(
    tenantId: string,
    channelId: string,
    data: any,
  ): Promise<any> {
    return {};
  }
  async deleteChannel(
    tenantId: string,
    channelId: string,
  ): Promise<{ success: boolean }> {
    return { success: true };
  }
  async syncChannel(
    tenantId: string,
    channelId: string,
  ): Promise<{ success: boolean }> {
    return { success: true };
  }
  async getChannelById(
    tenantId: string,
    channelId: string,
  ): Promise<any | null> {
    return null;
  }
  async updateChannelCredentials(
    tenantId: string,
    channelId: string,
    credentials: any,
  ): Promise<any> {
    return {};
  }
  async findChannelByClientId(
    tenantId: string,
    clientId: string,
  ): Promise<any | null> {
    return null;
  }
  async listDevices(tenantId: string, storeId?: string): Promise<any[]> {
    return [];
  }
  async pingDevice(
    tenantId: string,
    deviceId: string,
  ): Promise<{ success: boolean }> {
    return { success: true };
  }
  async processPayment(
    tenantId: string,
    orderId: string,
    data: any,
  ): Promise<any> {
    return {};
  }
  async processReturn(
    tenantId: string,
    orderId: string,
    data: any,
  ): Promise<{ success: boolean }> {
    return { success: true };
  }
  async submitOpname(
    tenantId: string,
    data: any,
  ): Promise<{ success: boolean }> {
    return { success: true };
  }
  async receiveGoods(
    tenantId: string,
    data: any,
  ): Promise<{ success: boolean }> {
    return { success: true };
  }
  async findCustomerByEmail(
    tenantId: string,
    email: string,
  ): Promise<any | null> {
    return null;
  }
  async findCustomerById(
    tenantId: string,
    customerId: string,
  ): Promise<any | null> {
    return null;
  }
  async createCustomer(tenantId: string, data: any): Promise<any> {
    return {};
  }
  async updateCustomer(
    tenantId: string,
    customerId: string,
    data: any,
  ): Promise<any> {
    return {};
  }
  async createCustomerSession(tenantId: string, data: any): Promise<any> {
    return {};
  }
  async findCustomerSession(
    tenantId: string,
    tokenHash: string,
  ): Promise<any | null> {
    return null;
  }
  async revokeCustomerSession(
    tenantId: string,
    tokenHash: string,
  ): Promise<void> {}
  async getCart(tenantId: string, customerId: string): Promise<any | null> {
    return null;
  }
  async createCart(tenantId: string, customerId: string): Promise<any> {
    return {};
  }
  async updateCartItem(
    tenantId: string,
    cartId: string,
    productId: string,
    data: any,
  ): Promise<any> {
    return {};
  }
  async removeCartItem(
    tenantId: string,
    cartId: string,
    itemId: string,
  ): Promise<void> {}
  async clearCart(tenantId: string, cartId: string): Promise<void> {}
  async getWishlist(tenantId: string, customerId: string): Promise<any | null> {
    return null;
  }
  async upsertWishlist(tenantId: string, customerId: string): Promise<any> {
    return {};
  }
  async addWishlistItem(
    tenantId: string,
    wishlistId: string,
    productId: string,
  ): Promise<any> {
    return {};
  }
  async removeWishlistItem(
    tenantId: string,
    wishlistId: string,
    itemId: string,
  ): Promise<void> {}
  async logEvent(tenantId: string, data: any): Promise<any> {
    return {};
  }
}
