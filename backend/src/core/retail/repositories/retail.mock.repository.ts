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
  UpdateProductDto,
} from "../dto/retail.dto";

@Injectable()
export class RetailMockRepository implements IRetailRepository {
  private stores: RetailStore[] = [];
  private products: RetailProduct[] = [];
  private orders: RetailOrder[] = [];
  private shifts: RetailShift[] = [];
  private projections: ProductProjection[] = [];
  private labelConfigs: LabelConfig[] = [];
  private devices: any[] = [];
  private cameras: any[] = [];
  private sensors: any[] = [];
  private discoveredDevices: any[] = [];

  constructor() {
    // Initial mock data for testing projections
    this.products = [
      {
        id: "item-001",
        tenantId: "04bbc0e0-213d-4af4-9ce8-0e4674a58a90",
        sku: "ELEC-MBP-001",
        name: "MacBook Pro 14 M3",
        description: "High performance laptop",
        basePrice: 32999000,
        categoryId: "cat-1",
        categoryName: "Electronics",
        barcode: "888123456789",
        type: "ITEM",
        status: "active",
        unit: "PCS",
        stock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
      {
        id: "item-002",
        tenantId: "04bbc0e0-213d-4af4-9ce8-0e4674a58a90",
        sku: "ELEC-IPN-015",
        name: "iPhone 15 Pro",
        description: "Stronger than ever",
        basePrice: 18999000,
        categoryId: "cat-1",
        categoryName: "Electronics",
        barcode: "888987654321",
        type: "ITEM",
        status: "active",
        unit: "PCS",
        stock: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
      {
        id: "item-003",
        tenantId: "04bbc0e0-213d-4af4-9ce8-0e4674a58a90",
        sku: "CLOTH-TEE-BLK",
        name: "Minimalist Black Tee",
        description: "100% Cotton",
        basePrice: 249000,
        categoryId: "cat-2",
        categoryName: "Clothing",
        barcode: "111222333444",
        type: "ITEM",
        status: "active",
        unit: "PCS",
        stock: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
      {
        id: "item-004",
        tenantId: "04bbc0e0-213d-4af4-9ce8-0e4674a58a90",
        sku: "FURN-CHR-OAK",
        name: "Oak Dining Chair",
        description: "Solid oak wood",
        basePrice: 1500000,
        categoryId: "cat-3",
        categoryName: "Furniture",
        barcode: "555666777888",
        type: "ITEM",
        status: "active",
        unit: "PCS",
        stock: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ];

    this.projections = [];
  }

  async listProducts(
    tenantId: string,
    options?: {
      page?: number;
      pageSize?: number;
      categoryId?: string;
      type?: string;
      minPrice?: number;
      maxPrice?: number;
      q?: string;
      sortBy?: "name" | "price" | "createdAt";
      sortDir?: "asc" | "desc";
      locationId?: string;
    },
  ): Promise<{
    items: RetailProduct[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    console.log(`[MockRepo] listProducts for tenant ${tenantId}`, options);

    let filtered = this.products.filter((p) => p.tenantId === tenantId);

    // Apply filters
    if (options?.categoryId && options.categoryId !== "all") {
      filtered = filtered.filter((p) => p.categoryId === options.categoryId);
    }
    if (options?.type && options.type !== "all") {
      filtered = filtered.filter((p) => p.type === options.type);
    }
    if (options?.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.basePrice >= options.minPrice!);
    }
    if (options?.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.basePrice <= options.maxPrice!);
    }
    if (options?.q) {
      const q = options.q.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q),
      );
    }

    const items = filtered.map((p) => {
      // Data Resolution Logic: Hierarchical Overrides
      let projection = undefined;

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

    console.log(`[MockRepo] Returning ${items.length} items`);

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const start = (page - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
    };
  }

  // --- Implement other REQUIRED methods with minimal mock logic ---
  async listStores(
    tenantId: string,
    locationId?: string,
  ): Promise<RetailStore[]> {
    return this.stores.filter(
      (s) =>
        s.tenantId === tenantId && (!locationId || s.locationId === locationId),
    );
  }
  async listCategories(tenantId: string): Promise<any[]> {
    return [
      { id: "cat-1", name: "Electronics", tenantId },
      { id: "cat-2", name: "Clothing", tenantId },
      { id: "cat-3", name: "Furniture", tenantId },
    ];
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
    const store: RetailStore = {
      id: `store-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: tenantId,
      locationId: data.locationId || "loc-default",
      name: data.name,
      code: data.code,
      type: data.type as any,
      status: "active",
      address: data.address || "",
      phone: data.phone,
      email: data.email,
      timezone: data.timezone || "UTC",
      currency: data.currency || "USD",
      taxZone: data.tax_zone,
      managerId: data.managerId,
      inventoryPoolId: data.inventoryPoolId,
      operationalConfig: data.operational_config as any,
      supplyConfig: data.supply_config as any,
      infrastructureRegistry: data.infrastructure_registry as any,
      channelBinding: data.channel_binding as any,
      governance: (data.governance || {
        license_status: "active",
        activation_source: "Cloud",
        compliance_level: 1,
        audit_frequency_tier: "standard",
      }) as any,
      configVersion: {
        updated_by: "system_user",
        updated_at: new Date(),
        revision_number: 1,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.stores.push(store);
    return store;
  }
  async updateStore(
    tenantId: string,
    storeId: string,
    data: UpdateStoreDto,
  ): Promise<RetailStore> {
    const index = this.stores.findIndex(
      (s) => s.id === storeId && s.tenantId === tenantId,
    );
    if (index === -1) throw new Error("Store not found");

    const current = this.stores[index];
    const updated: RetailStore = {
      ...current,
      name: data.name ?? current.name,
      locationId: data.locationId ?? current.locationId,
      currency: data.currency ?? current.currency,
      type: (data.type as any) ?? current.type,
      status: (data.status as any) ?? current.status,
      address: data.address ?? current.address,
      phone: data.phone ?? current.phone,
      email: data.email ?? current.email,
      timezone: data.timezone ?? current.timezone,
      taxZone: data.tax_zone ?? current.taxZone,
      managerId: data.managerId ?? current.managerId,
      inventoryPoolId: data.inventoryPoolId ?? current.inventoryPoolId,
      operationalConfig: data.operational_config
        ? {
            ...(current.operationalConfig || {}),
            ...(data.operational_config as any),
          }
        : current.operationalConfig,
      supplyConfig: data.supply_config
        ? { ...(current.supplyConfig || {}), ...(data.supply_config as any) }
        : current.supplyConfig,
      infrastructureRegistry: data.infrastructure_registry
        ? {
            ...(current.infrastructureRegistry || {}),
            ...data.infrastructure_registry,
          }
        : current.infrastructureRegistry,
      channelBinding: data.channel_binding
        ? { ...(current.channelBinding || {}), ...data.channel_binding }
        : current.channelBinding,
      governance: data.governance
        ? { ...(current.governance as any), ...data.governance }
        : current.governance,
      updatedAt: new Date(),
    };

    // Update revision
    updated.configVersion = {
      updated_by: "system_user", // Mock user
      updated_at: new Date(),
      revision_number: (current.configVersion?.revision_number || 0) + 1,
    };

    this.stores[index] = updated;
    return updated;
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
    const product = this.products.find(
      (p) => p.id === productId && p.tenantId === tenantId,
    );
    return product || null;
  }
  async updateProduct(
    tenantId: string,
    productId: string,
    data: UpdateProductDto,
    locationId?: string,
  ): Promise<RetailProduct> {
    console.log(
      `[MockRepo] updateProduct for tenant ${tenantId}, product ${productId}`,
      data,
    );
    const index = this.products.findIndex(
      (p) => p.id === productId && p.tenantId === tenantId,
    );
    if (index === -1) {
      throw new Error("Product not found");
    }
    const updated = {
      ...this.products[index],
      name: data.name ?? this.products[index].name,
      description: data.description ?? this.products[index].description,
      categoryId: data.categoryId ?? this.products[index].categoryId,
      basePrice: data.basePrice ?? this.products[index].basePrice,
      unit: data.unit ?? this.products[index].unit,
      sku: data.sku ?? this.products[index].sku,
      barcode: data.barcode ?? this.products[index].barcode,
      type: data.type ?? this.products[index].type,
    };

    // Mock logic: resolve category name if ID changed
    if (data.categoryId) {
      const cats = await this.listCategories(tenantId);
      const cat = cats.find((c) => c.id === data.categoryId);
      if (cat) updated.categoryName = cat.name;
    }

    this.products[index] = updated;

    // Also update any projections that might be overriding this product's name/desc
    this.projections = this.projections.map((proj) => {
      if (proj.item_master_id === productId) {
        return {
          ...proj,
          custom_name: data.name ?? proj.custom_name,
          custom_description: data.description ?? proj.custom_description,
        };
      }
      return proj;
    });

    return updated;
  }

  async generateNextSku(
    tenantId: string,
    categoryId: string,
  ): Promise<{ sku: string; barcode: string }> {
    // Mock: derive prefix from known categories, generate a sequential-looking SKU
    const mockCats: Record<string, string> = {
      "cat-1": "ELEC",
      "cat-2": "CLOTH",
      "cat-3": "FURN",
    };
    const prefix = mockCats[categoryId] ?? "ITEM";
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const seq = String(
      this.products.filter((p) => p.sku?.startsWith(prefix)).length + 1,
    ).padStart(4, "0");
    const sku = `${prefix}-${dateStr}-${seq}`;
    const barcode =
      sku.replace(/[^A-Z0-9]/g, "") + String(Date.now()).slice(-4);
    return { sku, barcode };
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
    userId: string,
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
  async reserveStock(tenantId: string, locationId: string, productId: string, quantity: number): Promise<{ success: boolean; reservationId?: string }> {
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
    return this.devices.filter(
      (d) => d.tenant_id === tenantId && (!storeId || d.store_id === storeId),
    );
  }

  async registerDevice(
    tenantId: string,
    locationId: string,
    data: any,
  ): Promise<any> {
    const device = {
      id: `dev-${Math.random().toString(36).substr(2, 9)}`,
      tenant_id: tenantId,
      store_id: locationId,
      ...data,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.devices.push(device);
    return device;
  }

  async listCCTVs(tenantId: string, storeId?: string): Promise<any[]> {
    return this.cameras.filter(
      (c) => c.tenantId === tenantId && (!storeId || c.locationId === storeId),
    );
  }

  async validateCCTVConnection(
    tenantId: string,
    locationId: string,
    data: any,
  ): Promise<{ success: boolean; message?: string }> {
    // Mock Validation Logic Simulation
    if (!data.provider) {
      return { success: false, message: "Provider is required." };
    }

    if (
      data.provider === "ezviz" &&
      (!data.verificationCode || !data.cloudAccountId)
    ) {
      return {
        success: false,
        message: "EZVIZ requires Verification Code and Cloud Account ID.",
      };
    }

    if (
      data.provider === "hikvision" &&
      (!data.ipAddress || !data.username || !data.password)
    ) {
      return {
        success: false,
        message: "Hikvision requires IP, Username, and Password.",
      };
    }

    // Simulate network delay for validation check
    await new Promise((resolve) => setTimeout(resolve, 800));

    return { success: true, message: "Connection validated successfully." };
  }

  async registerCCTV(
    tenantId: string,
    locationId: string,
    data: any,
  ): Promise<any> {
    const camera = {
      id: `cam-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      locationId,
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cameras.push(camera);
    return camera;
  }

  async listSensors(tenantId: string, storeId?: string): Promise<any[]> {
    return this.sensors.filter(
      (s) => s.tenantId === tenantId && (!storeId || s.locationId === storeId),
    );
  }

  async registerSensor(
    tenantId: string,
    locationId: string,
    data: any,
  ): Promise<any> {
    const sensor = {
      id: `sns-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      locationId,
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sensors.push(sensor);
    return sensor;
  }

  async scanDevices(tenantId: string, locationId: string): Promise<any[]> {
    // Generate simulated discovery results
    this.discoveredDevices = [
      {
        discoveryId: "disc-101",
        name: "Discovered Printer",
        type: "thermal_printer",
        macAddress: "AA:BB:CC:DD:EE:01",
        ipAddress: "192.168.1.55",
        model: "Postek C168 (Simulated)",
        status: "discovered",
      },
      {
        discoveryId: "disc-102",
        name: "Discovered PC",
        type: "pc",
        macAddress: "AA:BB:CC:DD:EE:02",
        ipAddress: "192.168.1.102",
        model: "Dell OptiPlex (Simulated)",
        status: "discovered",
      },
    ];
    return this.discoveredDevices;
  }

  async commitScannedDevice(
    tenantId: string,
    locationId: string,
    discoveryId: string,
  ): Promise<any> {
    const found = this.discoveredDevices.find(
      (d) => d.discoveryId === discoveryId,
    );
    if (!found) return null;

    const device = {
      id: `dev-${discoveryId}`,
      tenantId,
      locationId,
      name: found.name,
      type: found.type,
      model: found.model,
      macAddress: found.macAddress,
      ipAddress: found.ipAddress,
      status: "online",
      isActive: true,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.devices.push(device);
    return device;
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
