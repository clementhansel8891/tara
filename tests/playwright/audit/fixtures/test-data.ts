/**
 * test-data.ts
 *
 * Seeded entity references for audit workflow E2E tests.
 *
 * These IDs and names correspond to records that exist in the live
 * backend at http://150.109.15.108:3010 after running the production
 * seed script (`npm run db:seed` / `tsx backend/prisma/seed-production-ready.ts`).
 *
 * Workflow tests should use these references to avoid creating duplicate
 * data on every test run and to keep workflows deterministic.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const AUTH_USER = {
  email: 'bambusilverkedonganan@gmail.com',
  password: 'estela1234',
  role: 'SUPER_ADMIN',
} as const;

// ─── Company / Tenant ─────────────────────────────────────────────────────────

export const COMPANY = {
  name: 'Zenvix Demo Company',
  /** Tenant identifier returned by /api/auth/me */
  tenantId: 'zenvix-demo',
} as const;

// ─── Products / Inventory ─────────────────────────────────────────────────────

export const PRODUCTS = {
  /** A simple product that should already exist in the seed */
  basic: {
    name: 'Demo Product A',
    sku: 'DEMO-A-001',
    barcode: '1234567890123',
    price: 50_000,
    unit: 'pcs',
  },
  withVariant: {
    name: 'Demo Product B',
    sku: 'DEMO-B-001',
    barcode: '1234567890124',
    price: 75_000,
    unit: 'pcs',
  },
} as const;

// ─── Locations / Warehouses ───────────────────────────────────────────────────

export const LOCATIONS = {
  main: {
    name: 'Main Warehouse',
    code: 'WH-MAIN',
  },
  branch: {
    name: 'Branch Store',
    code: 'WH-BRANCH',
  },
} as const;

// ─── Retail POS ───────────────────────────────────────────────────────────────

export const RETAIL = {
  /** Cashier shift that should already be openable */
  cashierName: 'Hansel',
  /** Payment method codes available in the seeded system */
  paymentMethods: ['CASH', 'TRANSFER', 'QRIS'] as const,
  /** Opening cash balance used in shift tests */
  openingBalance: 500_000,
} as const;

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const SUPPLIERS = {
  primary: {
    name: 'Demo Supplier Co',
    code: 'SUP-001',
    contactEmail: 'supplier@demo.com',
    phone: '+6221000001',
    address: 'Jl. Demo No. 1, Jakarta',
  },
  secondary: {
    name: 'Secondary Supplier',
    code: 'SUP-002',
    contactEmail: 'supplier2@demo.com',
    phone: '+6221000002',
    address: 'Jl. Demo No. 2, Jakarta',
  },
} as const;

// ─── Customers ────────────────────────────────────────────────────────────────

export const CUSTOMERS = {
  individual: {
    name: 'Demo Customer',
    email: 'customer@demo.com',
    phone: '+6281200000001',
    address: 'Jl. Customer No. 1, Jakarta',
    type: 'individual',
  },
  corporate: {
    name: 'Demo Corp Customer',
    email: 'corp@demo.com',
    phone: '+6221000003',
    address: 'Jl. Corp No. 1, Jakarta',
    type: 'corporate',
  },
} as const;

// ─── Employees / HR ───────────────────────────────────────────────────────────

export const EMPLOYEES = {
  regular: {
    name: 'Demo Employee',
    employeeId: 'EMP-001',
    email: 'employee@demo.com',
    department: 'Operations',
    position: 'Staff',
    salary: 5_000_000,
  },
  manager: {
    name: 'Demo Manager',
    employeeId: 'EMP-002',
    email: 'manager@demo.com',
    department: 'Operations',
    position: 'Manager',
    salary: 10_000_000,
  },
} as const;

// ─── Finance ──────────────────────────────────────────────────────────────────

export const FINANCE = {
  /** Chart of accounts codes present after seeding */
  accounts: {
    cash: { code: '1-1001', name: 'Kas' },
    ar: { code: '1-1100', name: 'Piutang Usaha' },
    revenue: { code: '4-1000', name: 'Pendapatan Usaha' },
  },
  taxRate: 11, // PPN 11%
  currency: 'IDR',
} as const;

// ─── Sales ────────────────────────────────────────────────────────────────────

export const SALES = {
  lead: {
    name: 'Demo Lead',
    company: 'Demo Company',
    email: 'lead@demo.com',
    phone: '+6281200000002',
    source: 'website',
    estimatedValue: 10_000_000,
  },
} as const;

// ─── F&B ──────────────────────────────────────────────────────────────────────

export const FNB = {
  table: {
    number: 'T-01',
    capacity: 4,
  },
  menuItem: {
    name: 'Demo Meal',
    code: 'MEAL-001',
    price: 35_000,
    category: 'Main Course',
  },
} as const;

// ─── IT Service Management ────────────────────────────────────────────────────

export const IT_SERVICE = {
  ticket: {
    title: 'Demo IT Ticket',
    description: 'Test ticket for audit workflow',
    priority: 'medium',
    category: 'hardware',
  },
  slaHours: 8,
} as const;

// ─── Marketing ────────────────────────────────────────────────────────────────

export const MARKETING = {
  campaign: {
    name: 'Demo Campaign',
    type: 'email',
    targetSegment: 'all_customers',
    budget: 1_000_000,
  },
} as const;

// ─── Procurement ──────────────────────────────────────────────────────────────

export const PROCUREMENT = {
  purchaseOrder: {
    notes: 'Demo PO for audit workflow',
    paymentTerms: 'NET30',
    deliveryDays: 7,
  },
} as const;

// ─── Settings ─────────────────────────────────────────────────────────────────

export const SETTINGS = {
  appName: 'Zenvix BFS',
  timezone: 'Asia/Jakarta',
  dateFormat: 'DD/MM/YYYY',
  currency: 'IDR',
  language: 'id',
} as const;

// ─── License ──────────────────────────────────────────────────────────────────

export const LICENSE = {
  /** Demo / test license key that should be accepted by the seeded backend */
  testKey: 'ZENVIX-DEMO-0000-0000',
  plan: 'enterprise',
  maxUsers: 100,
} as const;

// ─── Consolidated export ──────────────────────────────────────────────────────

export const TEST_DATA = {
  auth: AUTH_USER,
  company: COMPANY,
  products: PRODUCTS,
  locations: LOCATIONS,
  retail: RETAIL,
  suppliers: SUPPLIERS,
  customers: CUSTOMERS,
  employees: EMPLOYEES,
  finance: FINANCE,
  sales: SALES,
  fnb: FNB,
  itService: IT_SERVICE,
  marketing: MARKETING,
  procurement: PROCUREMENT,
  settings: SETTINGS,
  license: LICENSE,
} as const;
