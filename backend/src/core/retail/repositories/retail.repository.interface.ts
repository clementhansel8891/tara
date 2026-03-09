import {
  RetailStore,
  RetailProduct,
  RetailOrder,
  RetailShift,
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

export abstract class IRetailRepository {
  // ============================================================
  // BRANCHES (Physical Stores)
  // ============================================================
  abstract listStores(
    tenantId: string,
    locationId?: string,
  ): Promise<RetailStore[]>;
  abstract listCategories(tenantId: string): Promise<any[]>;
  abstract getStore(
    tenantId: string,
    storeId: string,
  ): Promise<RetailStore | null>;
  abstract createStore(
    tenantId: string,
    data: CreateStoreDto,
  ): Promise<RetailStore>;
  abstract updateStore(
    tenantId: string,
    storeId: string,
    data: UpdateStoreDto,
  ): Promise<RetailStore>;
  abstract deleteStore(tenantId: string, storeId: string): Promise<void>;

  // ============================================================
  // INVENTORY POOLS
  // ============================================================
  abstract listInventoryPools(tenantId: string): Promise<any[]>;
  abstract createInventoryPool(
    tenantId: string,
    data: CreateInventoryPoolDto,
  ): Promise<any>;
  abstract getInventoryPool(
    tenantId: string,
    poolId: string,
  ): Promise<any | null>;
  abstract deleteInventoryPool(tenantId: string, poolId: string): Promise<void>;

  // ============================================================
  // E-COMMERCE STORES
  // ============================================================
  abstract listEcommerceStores(
    tenantId: string,
    storeId?: string,
  ): Promise<any[]>;
  abstract getEcommerceStore(
    tenantId: string,
    storeId: string,
  ): Promise<any | null>;
  abstract createEcommerceStore(
    tenantId: string,
    data: CreateEcommerceStoreDto,
  ): Promise<any>;
  abstract updateEcommerceStore(
    tenantId: string,
    storeId: string,
    data: UpdateEcommerceStoreDto,
  ): Promise<any>;
  abstract deleteEcommerceStore(
    tenantId: string,
    storeId: string,
  ): Promise<void>;
  abstract linkEcommerceToBranch(
    tenantId: string,
    ecommerceId: string,
    branchId: string,
  ): Promise<void>;
  abstract unlinkEcommerceFromBranch(
    tenantId: string,
    ecommerceId: string,
    branchId: string,
  ): Promise<void>;

  // ============================================================
  // PRODUCTS
  // ============================================================
  abstract listProducts(
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
    },
  ): Promise<{
    items: RetailProduct[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  abstract getProduct(
    tenantId: string,
    productId: string,
  ): Promise<RetailProduct | null>;
  abstract updateProduct(
    tenantId: string,
    productId: string,
    data: UpdateProductDto,
    locationId?: string,
  ): Promise<RetailProduct>;
  abstract generateNextSku(
    tenantId: string,
    categoryId: string,
  ): Promise<{ sku: string; barcode: string }>;

  // ============================================================
  // ORDERS
  // ============================================================
  abstract listOrders(
    tenantId: string,
    storeId?: string,
  ): Promise<RetailOrder[]>;
  abstract getOrder(
    tenantId: string,
    orderId: string,
  ): Promise<RetailOrder | null>;
  abstract createOrder(
    tenantId: string,
    locationId: string,
    data: CreateOrderDto,
    userId: string,
  ): Promise<RetailOrder>;
  abstract updateOrderStatus(
    tenantId: string,
    orderId: string,
    status: string,
    metadata?: any,
  ): Promise<RetailOrder>;

  // ============================================================
  // INVENTORY / STOCK
  // ============================================================
  abstract reserveStock(
    tenantId: string,
    productId: string,
    quantity: number,
  ): Promise<{ success: boolean; reservationId?: string }>;
  abstract releaseStock(
    tenantId: string,
    productId: string,
    quantity: number,
  ): Promise<void>;
  abstract checkStock(
    tenantId: string,
    productId: string,
  ): Promise<{ available: number; status: string }>;

  abstract getInventoryStats(
    tenantId: string,
    options?: { categoryId?: string; q?: string },
  ): Promise<{
    total: number;
    critical: number;
    lowStock: number;
    overstock: number;
    outOfStock: number;
    totalSOH: number;
    totalATS: number;
    // User requested fields:
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  }>;

  // ============================================================
  // SHIFTS
  // ============================================================
  abstract getActiveShift(
    tenantId: string,
    storeId: string,
    employeeId: string,
  ): Promise<RetailShift | null>;
  abstract openShift(
    tenantId: string,
    locationId: string,
    employeeId: string,
    data: OpenShiftDto,
  ): Promise<RetailShift>;
  abstract closeShift(
    tenantId: string,
    shiftId: string,
    data: CloseShiftDto,
  ): Promise<RetailShift>;
  abstract listShifts(
    tenantId: string,
    storeId?: string,
  ): Promise<RetailShift[]>;

  // ============================================================
  // PROMOTIONS
  // ============================================================
  abstract listPromotions(tenantId: string): Promise<any[]>;
  abstract updatePromotion(
    tenantId: string,
    promotionId: string,
    data: any,
  ): Promise<any>;

  // ============================================================
  // CHANNELS (Legacy - Ecommerce Hub integration)
  // ============================================================
  abstract listChannels(tenantId: string): Promise<any[]>;
  abstract createChannel(tenantId: string, data: any): Promise<any>;
  abstract updateChannel(
    tenantId: string,
    channelId: string,
    data: any,
  ): Promise<any>;
  abstract deleteChannel(
    tenantId: string,
    channelId: string,
  ): Promise<{ success: boolean }>;
  abstract syncChannel(
    tenantId: string,
    channelId: string,
  ): Promise<{ success: boolean }>;
  abstract getChannelById(
    tenantId: string,
    channelId: string,
  ): Promise<any | null>;
  abstract updateChannelCredentials(
    tenantId: string,
    channelId: string,
    credentials: any,
  ): Promise<any>;
  abstract findChannelByClientId(
    tenantId: string,
    clientId: string,
  ): Promise<any | null>;

  // ============================================================
  // DEVICES
  // ============================================================
  abstract listDevices(tenantId: string, storeId?: string): Promise<any[]>;
  abstract registerDevice(
    tenantId: string,
    locationId: string,
    data: any,
  ): Promise<any>;
  abstract listCCTVs(tenantId: string, storeId?: string): Promise<any[]>;
  abstract registerCCTV(
    tenantId: string,
    locationId: string,
    data: any,
  ): Promise<any>;
  abstract validateCCTVConnection(
    tenantId: string,
    locationId: string,
    data: any,
  ): Promise<{ success: boolean; message?: string }>;
  abstract listSensors(tenantId: string, storeId?: string): Promise<any[]>;
  abstract registerSensor(
    tenantId: string,
    locationId: string,
    data: any,
  ): Promise<any>;
  abstract pingDevice(
    tenantId: string,
    deviceId: string,
  ): Promise<{ success: boolean }>;

  abstract scanDevices(tenantId: string, locationId: string): Promise<any[]>;
  abstract commitScannedDevice(
    tenantId: string,
    locationId: string,
    discoveryId: string,
  ): Promise<any>;

  // ============================================================
  // PAYMENTS & RETURNS
  // ============================================================
  abstract processPayment(
    tenantId: string,
    orderId: string,
    data: { amount: number; method: string; shiftId?: string },
  ): Promise<any>;
  abstract processReturn(
    tenantId: string,
    orderId: string,
    data: { itemIds: string[]; shiftId?: string },
  ): Promise<{ success: boolean }>;

  // ============================================================
  // INVENTORY OPERATIONS
  // ============================================================
  abstract submitOpname(
    tenantId: string,
    data: { storeId: string; adjustments: any[]; shiftId?: string },
  ): Promise<{ success: boolean }>;
  abstract receiveGoods(
    tenantId: string,
    data: {
      storeId: string;
      shipmentId: string;
      items: any[];
      shiftId?: string;
    },
  ): Promise<{ success: boolean }>;

  // ============================================================
  // PUBLIC GATEWAY (Customer, Cart, Wishlist)
  // ============================================================

  // Customers
  abstract findCustomerByEmail(
    tenantId: string,
    email: string,
  ): Promise<any | null>;
  abstract findCustomerById(
    tenantId: string,
    customerId: string,
  ): Promise<any | null>;
  abstract createCustomer(tenantId: string, data: any): Promise<any>;
  abstract updateCustomer(
    tenantId: string,
    customerId: string,
    data: any,
  ): Promise<any>;

  // Auth & Sessions
  abstract createCustomerSession(tenantId: string, data: any): Promise<any>;
  abstract findCustomerSession(
    tenantId: string,
    tokenHash: string,
  ): Promise<any | null>;
  abstract revokeCustomerSession(
    tenantId: string,
    tokenHash: string,
  ): Promise<void>;

  // Cart
  abstract getCart(tenantId: string, customerId: string): Promise<any | null>;
  abstract createCart(tenantId: string, customerId: string): Promise<any>;
  abstract updateCartItem(
    tenantId: string,
    cartId: string,
    productId: string,
    data: { quantity: number; unitPrice: number },
  ): Promise<any>;
  abstract removeCartItem(
    tenantId: string,
    cartId: string,
    itemId: string,
  ): Promise<void>;
  abstract clearCart(tenantId: string, cartId: string): Promise<void>;

  // Wishlist
  abstract getWishlist(
    tenantId: string,
    customerId: string,
  ): Promise<any | null>;
  abstract upsertWishlist(tenantId: string, customerId: string): Promise<any>;
  abstract addWishlistItem(
    tenantId: string,
    wishlistId: string,
    productId: string,
  ): Promise<any>;
  abstract removeWishlistItem(
    tenantId: string,
    wishlistId: string,
    itemId: string,
  ): Promise<void>;

  // Events
  abstract logEvent(tenantId: string, data: any): Promise<any>;
}
