/**
 * ============================================================
 * ZENVIX DATABASE SEED SCRIPT
 * 
 * Creates initial demo data for development and testing
 * Run with: npx prisma db seed
 * ============================================================
 */

import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

console.log('📡 DATABASE_URL in seed script:', process.env.DATABASE_URL ? 'FOUND (hidden)' : 'MISSING');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================
  // 1. Create Demo Company
  // ============================================================
  const company = await prisma.company.upsert({
    where: { code: 'DEMO-A' },
    update: {},
    create: {
      id: 'comp-demo-a',
      name: 'Demo Company A',
      code: 'DEMO-A',
      status: 'active',
    },
  });
  console.log('✅ Created company:', company.name);

  // ============================================================
  // 2. Create Locations
  // ============================================================
  const locationJKT = await prisma.location.upsert({
    where: { companyId_code: { companyId: company.id, code: 'JKT' } },
    update: {},
    create: {
      id: 'loc-jkt',
      companyId: company.id,
      name: 'Jakarta Branch',
      code: 'JKT',
      address: 'Jl. Sudirman No. 123, Jakarta',
      type: 'branch',
    },
  });

  const locationBDG = await prisma.location.upsert({
    where: { companyId_code: { companyId: company.id, code: 'BDG' } },
    update: {},
    create: {
      id: 'loc-bdg',
      companyId: company.id,
      name: 'Bandung Branch',
      code: 'BDG',
      address: 'Jl. Asia Afrika No. 456, Bandung',
      type: 'branch',
    },
  });
  console.log('✅ Created locations:', locationJKT.name, locationBDG.name);

  // ============================================================
  // 3. Create Departments
  // ============================================================
  const departments = [
    { id: 'dept-eng', code: 'ENG', name: 'Engineering' },
    { id: 'dept-hr', code: 'HR', name: 'Human Resources' },
    { id: 'dept-sales', code: 'SALES', name: 'Sales' },
    { id: 'dept-ops', code: 'OPS', name: 'Operations' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: dept.code } },
      update: {},
      create: {
        id: dept.id,
        companyId: company.id,
        code: dept.code,
        name: dept.name,
        status: 'active',
      },
    });
  }
  console.log('✅ Created departments:', departments.map(d => d.name).join(', '));

  // ============================================================
  // 4. Create Employees
  // ============================================================
  const employees = [
    {
      id: 'emp-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@demo.com',
      phone: '+62812345678',
      position: 'Software Engineer',
      employeeCode: 'EMP-001',
      departmentId: 'dept-eng',
      locationId: 'loc-jkt',
      hireDate: new Date('2024-01-15'),
    },
    {
      id: 'emp-002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@demo.com',
      phone: '+62812345679',
      position: 'HR Manager',
      employeeCode: 'EMP-002',
      departmentId: 'dept-hr',
      locationId: 'loc-jkt',
      hireDate: new Date('2024-02-01'),
    },
    {
      id: 'emp-003',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@demo.com',
      phone: '+62812345680',
      position: 'Sales Representative',
      employeeCode: 'EMP-003',
      departmentId: 'dept-sales',
      locationId: 'loc-bdg',
      hireDate: new Date('2024-03-10'),
    },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { companyId_employeeCode: { companyId: company.id, employeeCode: emp.employeeCode } },
      update: {},
      create: {
        ...emp,
        companyId: company.id,
        status: 'active',
      },
    });
  }
  console.log('✅ Created employees:', employees.map(e => `${e.firstName} ${e.lastName}`).join(', '));

  // ============================================================
  // 5. Create Retail Stores
  // ============================================================
  const storeJKT = await prisma.store.upsert({
    where: { companyId_code: { companyId: company.id, code: 'STORE-JKT-01' } },
    update: {},
    create: {
      id: 'store-jkt-01',
      companyId: company.id,
      locationId: 'loc-jkt',
      name: 'Jakarta Store 1',
      code: 'STORE-JKT-01',
      type: 'physical',
      status: 'active',
    },
  });

  const storeOnline = await prisma.store.upsert({
    where: { companyId_code: { companyId: company.id, code: 'STORE-ONLINE' } },
    update: {},
    create: {
      id: 'store-online',
      companyId: company.id,
      locationId: 'loc-jkt',
      name: 'Online Store',
      code: 'STORE-ONLINE',
      type: 'online',
      status: 'active',
    },
  });
  console.log('✅ Created stores:', storeJKT.name, storeOnline.name);

  // ============================================================
  // 6. Create Ecommerce Connector
  // ============================================================
  const connector = await prisma.ecommerceConnector.upsert({
    where: { apiKey: 'demo-api-key-12345' },
    update: {},
    create: {
      id: 'conn-demo-01',
      companyId: company.id,
      name: 'Demo Ecommerce',
      domain: 'demo-store.example.com',
      apiKey: 'demo-api-key-12345',
      status: 'active',
      branches: {
        connect: [{ id: storeJKT.id }]
      }
    },
  });
  console.log('✅ Created ecommerce connector:', connector.domain);

  // ============================================================
  // 8. Create POS Devices
  // ============================================================
  await prisma.pOSDevice.createMany({
    data: [
      {
        companyId: company.id,
        storeId: storeJKT.id,
        name: 'Register 1 - JKT',
        type: 'pos_terminal',
        isActive: true,
      },
      {
        companyId: company.id,
        storeId: storeJKT.id,
        name: 'Kiosk 1 - JKT',
        type: 'kiosk',
        isActive: true,
      },
      {
        companyId: company.id,
        storeId: storeOnline.id,
        name: 'Web Checkout',
        type: 'mobile_pos', // Virtual
        isActive: true,
      }
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created POS devices');

  // ============================================================
  // 9. Create Retail Infrastructure (Gateway Clusters)
  // ============================================================
  const lbCore = await prisma.retailLoadBalancer.upsert({
    where: { id: 'lb-core-01' },
    update: {},
    create: {
      id: 'lb-core-01',
      companyId: company.id,
      name: 'Retail Gateway Cluster - Global',
      virtualIp: '10.0.5.100',
      algorithm: 'LEAST_CONNECTIONS',
      status: 'ONLINE',
    }
  });

  const nodes = [
    { id: 'node-gty-01', name: 'GTY-JKT-01', ip: '10.0.5.101', region: 'ID-JKT', version: 'v2.4.1' },
    { id: 'node-gty-02', name: 'GTY-JKT-02', ip: '10.0.5.102', region: 'ID-JKT', version: 'v2.4.1' },
    { id: 'node-gty-03', name: 'GTY-SGP-01', ip: '10.0.5.201', region: 'SG-CORE', version: 'v2.4.2' },
  ];

  for (const n of nodes) {
    await prisma.retailGatewayNode.upsert({
      where: { id: n.id },
      update: {},
      create: {
        id: n.id,
        companyId: company.id,
        loadBalancerId: lbCore.id,
        nodeName: n.name,
        ipAddress: n.ip,
        port: 443,
        status: 'ACTIVE',
        healthScore: 100,
        version: n.version,
        region: n.region,
      }
    });
  }
  console.log('✅ Created retail infrastructure clusters');

  // ============================================================
  // 10. Create Retail Channels
  // ============================================================
  const channels = [
    { id: 'chan-shp-01', name: 'Shopify Main Store', type: 'MARKETPLACE', adapter: 'SHOPIFY' },
    { id: 'chan-amz-01', name: 'Amazon US', type: 'MARKETPLACE', adapter: 'AMAZON' },
    { id: 'chan-tkp-01', name: 'Tokopedia Official', type: 'MARKETPLACE', adapter: 'TOKOPEDIA' },
    { id: 'chan-hdl-01', name: 'Headless Storefront (Next.js)', type: 'OWNED', adapter: 'CUSTOM' },
  ];

  for (const c of channels) {
    await prisma.retailChannel.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        companyId: company.id,
        name: c.name,
        type: c.type,
        adapterType: c.adapter,
        status: 'active',
        syncFrequency: '5m',
        credentials: { apiKey: `key-${Math.random().toString(36).substring(7)}` },
        webhookUrl: `https://api.zenvix.com/webhooks/retail/${c.id}`,
      }
    });
  }
  console.log('✅ Created retail e-commerce channels');

  // ============================================================
  // 9. Create Product Catalog
  // ============================================================
  // Categories
  const catNames = ['Electronics', 'Clothing', 'Groceries'];
  const cats: Record<string, any> = {};

  for (const name of catNames) {
    cats[name] = await prisma.productCategory.upsert({
      where: { companyId_name: { companyId: company.id, name } },
      update: {},
      create: {
        companyId: company.id,
        name,
        icon: name === 'Electronics' ? 'smartphone' : name === 'Clothing' ? 'checkroom' : 'local_grocery_store',
      }
    });
  }
  const catElec = cats['Electronics'];
  const catCloth = cats['Clothing'];
  const catGroc = cats['Groceries'];

  // Products
  const prodLaptop = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'ELEC-LAP-001' } },
    update: {},
    create: {
      companyId: company.id,
      categoryId: catElec.id,
      name: 'Pro Laptop 14"',
      sku: 'ELEC-LAP-001',
      barcode: '8991001001',
      basePrice: 15000000,
      unit: 'unit',
      status: 'active',
    }
  });

  const prodTshirt = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'CLOTH-TSHIRT-BLK' } },
    update: {},
    create: {
      companyId: company.id,
      categoryId: catCloth.id,
      name: 'Cotton T-Shirt Black',
      sku: 'CLOTH-TSHIRT-BLK',
      barcode: '8991002001',
      basePrice: 150000,
      unit: 'pcs',
      status: 'active',
    }
  });

  const prodApple = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'GROC-FRUIT-APL' } },
    update: {},
    create: {
      companyId: company.id,
      categoryId: catGroc.id,
      name: 'Fuji Apple',
      sku: 'GROC-FRUIT-APL',
      barcode: '8991003001',
      basePrice: 50000,
      unit: 'kg',
      status: 'active',
    }
  });
  console.log('✅ Created catalog:', prodLaptop.name, prodTshirt.name, prodApple.name);

  // ============================================================
  // 10. Initialize Inventory
  // ============================================================
  await prisma.stockLevel.createMany({
    data: [
      { companyId: company.id, locationId: locationJKT.id, productId: prodLaptop.id, onHand: 10, available: 10, departmentId: 'dept-ops' },
      { companyId: company.id, locationId: locationJKT.id, productId: prodTshirt.id, onHand: 50, available: 50, departmentId: 'dept-sales' },
      { companyId: company.id, locationId: locationJKT.id, productId: prodApple.id, onHand: 100, available: 100 },
      { companyId: company.id, locationId: locationBDG.id, productId: prodLaptop.id, onHand: 5, available: 5 },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Initialized stock levels');

  // ============================================================
  // 11. Create Retail Customers
  // ============================================================
  await prisma.retailCustomer.createMany({
    data: [
      {
        companyId: company.id,
        name: 'Alice Shopper',
        email: 'alice@example.com',
        phone: '+62811111111',
        tier: 'gold',
        points: 1500,
      },
      {
        companyId: company.id,
        name: 'Bob Buyer',
        email: 'bob@example.com',
        phone: '+62822222222',
        tier: 'regular',
        points: 50,
      }
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created retail customers');

  // ============================================================
  // 12. Create Promotion
  // ============================================================
  await prisma.retailPromotion.upsert({
    where: { companyId_title: { companyId: company.id, title: 'Summer Sale' } },
    update: {},
    create: {
      companyId: company.id,
      title: 'Summer Sale',
      type: 'percentage',
      value: 10.00, // 10%
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'active',
      target: 'all',
    }
  });
  console.log('✅ Created active promotion');
  // ============================================================
  // 13. Finance Module Seeding
  // ============================================================
  
  // Money Sources
  const bankBCA = await prisma.moneySource.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Bank BCA - Operational' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Bank BCA - Operational',
      type: 'BANK',
      currency: 'IDR',
      balance: 1500000000,
      provider: 'BCA',
    }
  });

  const cashRegister = await prisma.moneySource.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Main Cash Register' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Main Cash Register',
      type: 'CASH_REGISTER',
      currency: 'IDR',
      balance: 25000000,
    }
  });
  console.log('✅ Created money sources:', bankBCA.name, cashRegister.name);

  // Journal Entry (Opening Balance)
  const openingBalance = await prisma.journalEntry.upsert({
    where: { companyId_description: { companyId: company.id, description: 'Opening Balance 2024' } },
    update: {},
    create: {
      companyId: company.id,
      description: 'Opening Balance 2024',
      status: 'posted',
      lines: {
        create: [
          {
            accountCode: '1000', // Assets
            description: 'Cash & Bank',
            debit: 1525000000,
            credit: 0,
          },
          {
            accountCode: '3000', // Equity
            description: 'Capital',
            debit: 0,
            credit: 1525000000,
          }
        ]
      }
    }
  });
  console.log('✅ Created journal entry:', openingBalance.description);

  // Payables
  const existingPayable = await prisma.payable.findFirst({
    where: { companyId: company.id, vendorName: 'PT. Supply Indo' }
  });
  if (!existingPayable) {
    await prisma.payable.create({
      data: {
        companyId: company.id,
        vendorName: 'PT. Supply Indo',
        amount: 15000000,
        currency: 'IDR',
        dueDate: new Date('2024-06-30'),
        status: 'pending',
      }
    });
  }

  // Receivables
  const existingReceivable = await prisma.receivable.findFirst({
    where: { companyId: company.id, customerName: 'CV. Maju Jaya' }
  });
  if (!existingReceivable) {
    await prisma.receivable.create({
      data: {
        companyId: company.id,
        customerName: 'CV. Maju Jaya',
        amount: 45000000,
        currency: 'IDR',
        dueDate: new Date('2024-06-15'),
        status: 'issued',
      }
    });
  }
  console.log('✅ Created sample payables and receivables');

  // ============================================================
  // 14. Procurement Module Seeding
  // ============================================================
  
  // Suppliers
  const supplierIndo = await prisma.supplierMaster.upsert({
    where: { id: 'sup-001' },
    update: {},
    create: {
      id: 'sup-001',
      companyId: company.id,
      name: 'Nusantara Industrial Supply',
      taxId: 'NPWP-01.234.567.8-091.000',
      complianceStatus: 'VERIFIED',
      globalRating: 88,
      riskTier: 'LOW',
      categories: ['Machinery', 'MRO'],
    },
  });

  const supplierOffice = await prisma.supplierMaster.upsert({
    where: { id: 'sup-002' },
    update: {},
    create: {
      id: 'sup-002',
      companyId: company.id,
      name: 'Archipelago Office Systems',
      taxId: 'NPWP-98.765.432.1-091.000',
      complianceStatus: 'VERIFIED',
      globalRating: 79,
      riskTier: 'MEDIUM',
      categories: ['Office', 'IT'],
    },
  });

  // Supplier Branches
  const branchJKT = await prisma.supplierBranch.upsert({
    where: { id: 'sup-001-jkt' },
    update: {},
    create: {
      id: 'sup-001-jkt',
      companyId: company.id,
      supplierId: supplierIndo.id,
      branchCode: 'JKT',
      branchName: 'Jakarta Fulfillment',
      location: 'Jakarta',
      leadTimeDays: 3,
      localRating: 90,
      riskTier: 'LOW',
      active: true,
    },
  });

  const branchSBY = await prisma.supplierBranch.upsert({
    where: { id: 'sup-001-sby' },
    update: {},
    create: {
      id: 'sup-001-sby',
      companyId: company.id,
      supplierId: supplierIndo.id,
      branchCode: 'SBY',
      branchName: 'Surabaya Fulfillment',
      location: 'Surabaya',
      leadTimeDays: 4,
      localRating: 84,
      riskTier: 'LOW',
      active: true,
    },
  });

  // Supplier Products
  const supProdCNC = await prisma.supplierProduct.upsert({
    where: { id: 'sup-prd-001' },
    update: {},
    create: {
      id: 'sup-prd-001',
      companyId: company.id,
      supplierId: supplierIndo.id,
      branchId: branchJKT.id,
      sku: 'MCH-CNC-12',
      name: 'CNC Cutting Unit',
      category: 'Machinery',
      unitPrice: 280000000,
      currency: 'IDR',
      qualityScore: 90,
      active: true,
    },
  });

  // Requisition
  const requisition001 = await prisma.procurementRequisition.upsert({
    where: { id: 'req-001' },
    update: {},
    create: {
      id: 'req-001',
      companyId: company.id,
      requesterId: 'emp-001',
      departmentId: 'dept-ops',
      branchCode: 'JKT',
      title: 'Packaging line motor replacement',
      description: 'Urgent replacement for line B production continuity.',
      category: 'Machinery',
      budgetClass: 'OPEX',
      amount: 310000000,
      currency: 'IDR',
      status: 'PENDING_REQUESTER_HOD',
      approvals: {
        requesterHod: false,
        procurementHodDraft: false,
        legal: false,
        financeHod: false,
        requesterHodFinal: false,
        procurementHodFinal: false,
      },
      contractRequired: true,
    },
  });

  console.log('✅ Created procurement data:', supplierIndo.name, requisition001.title);

  // ============================================================
  // 15. Sales Module Seeding
  // ============================================================
  
  // Leads
  const lead1 = await prisma.salesLead.upsert({
    where: { id: 'lead-001' },
    update: {},
    create: {
      id: 'lead-001',
      companyId: company.id,
      companyName: 'Nusantara Tech',
      contactName: 'Andi Pratama',
      contactEmail: 'andi@ntech.id',
      source: 'MARKETING',
      ownerId: 'emp-003', // Bob Johnson (Sales)
      ownerName: 'Bob Johnson',
      score: 85,
      potentialValue: 120000000,
      currency: 'IDR',
      priority: 'HIGH',
      status: 'QUALIFIED',
      slaDueAt: new Date(Date.now() + 86400000), // Tomorrow
    },
  });

  // Opportunities
  const opportunity1 = await prisma.salesOpportunity.upsert({
    where: { id: 'opp-001' },
    update: {},
    create: {
      id: 'opp-001',
      companyId: company.id,
      leadId: lead1.id,
      accountName: 'Nusantara Tech',
      ownerId: 'emp-003',
      ownerName: 'Bob Johnson',
      stage: 'PROPOSAL',
      probability: 60,
      amount: 110000000,
      currency: 'IDR',
      expectedCloseDate: new Date(Date.now() + 30 * 86400000), // In 30 days
      health: 'LOW_RISK',
      nextAction: 'Send updated proposal',
    },
  });

  // Quotes
  const quote1 = await prisma.salesQuote.upsert({
    where: { id: 'quote-sales-001' },
    update: {},
    create: {
      id: 'quote-sales-001',
      companyId: company.id,
      opportunityId: opportunity1.id,
      accountName: 'Nusantara Tech',
      version: 1,
      amount: 110000000,
      discountPercent: 5,
      netAmount: 104500000,
      currency: 'IDR',
      status: 'SENT',
      validUntil: new Date(Date.now() + 14 * 86400000), // In 14 days
      createdBy: 'emp-003',
      notes: 'Standard enterprise license discount applied.',
    },
  });

  console.log('✅ Created sales data:', lead1.companyName, opportunity1.accountName);

  // ============================================================
  // 16. Payment Module Seeding
  // ============================================================
  
  // Payment Providers
  const providerBCA = await prisma.paymentProvider.upsert({
    where: { id: 'BANK_BCA' },
    update: {},
    create: {
      id: 'BANK_BCA',
      companyId: company.id,
      name: 'Bank BCA',
      channels: ['BANK_TRANSFER', 'QR'],
      status: 'HEALTHY',
      maxAmountPerTxn: 500000000,
      settlementSlaHours: 24,
      priority: 1,
    },
  });

  const providerStripe = await prisma.paymentProvider.upsert({
    where: { id: 'STRIPE' },
    update: {},
    create: {
      id: 'STRIPE',
      companyId: company.id,
      name: 'Stripe Global',
      channels: ['CARD_ONLINE', 'WALLET'],
      status: 'HEALTHY',
      maxAmountPerTxn: 1000000000,
      settlementSlaHours: 48,
      priority: 2,
    },
  });

  // Routing Policy
  const existingPolicy = await prisma.paymentRoutingPolicy.findFirst({
    where: { companyId: company.id, name: 'Default High-Value Policy' }
  });
  if (!existingPolicy) {
    await prisma.paymentRoutingPolicy.create({
      data: {
        companyId: company.id,
        name: 'Default High-Value Policy',
        enabled: true,
        priorities: ['BANK_BCA', 'STRIPE'],
        fallbackProviders: ['STRIPE'],
      },
    });
  }

  // POS Device
  const posDevice = await prisma.paymentPosDevice.upsert({
    where: { deviceCode: 'JKT-POS-001' },
    update: {},
    create: {
      companyId: company.id,
      locationId: locationJKT.id,
      deviceCode: 'JKT-POS-001',
      approved: true,
      status: 'ONLINE',
      providerId: providerBCA.id,
    },
  });

  // Transaction
  await prisma.paymentTransaction.upsert({
    where: { idempotencyKey: 'tx-2024-05-001' },
    update: {},
    create: {
      companyId: company.id,
      type: 'CUSTOMER_COLLECTION',
      amount: 1250000,
      channel: 'BANK_TRANSFER',
      providerId: providerBCA.id,
      idempotencyKey: 'tx-2024-05-001',
      status: 'SETTLED',
      createdBy: 'system',
      externalReference: 'INV-2024-001',
      destination: 'Acc-12345678',
    },
  });

  console.log('✅ Created payment data:', providerBCA.name, posDevice.deviceCode);

  // ============================================================
  // 17. Inventory Module Seeding (Audit, Alerts, Events)
  // ============================================================

  // Audit Cycle
  const auditCycle = await prisma.inventoryAuditCycle.create({
    data: {
      companyId: company.id,
      locationCode: 'JKT',
      scope: 'LOCATION',
      status: 'OPEN',
      openedBy: 'system',
    }
  });

  // Alerts
  await prisma.inventoryAlert.createMany({
    data: [
      {
        companyId: company.id,
        type: 'LOW_STOCK',
        severity: 'HIGH',
        status: 'OPEN',
        entityId: prodLaptop.id,
        message: `Low stock for ${prodLaptop.name} at JKT`
      },
      {
        companyId: company.id,
        type: 'EXPIRY_WARNING',
        severity: 'MEDIUM',
        status: 'OPEN',
        entityId: prodApple.id,
        message: `Expiry warning for ${prodApple.name} batch B-001`
      }
    ]
  });

  // Integration Event
  await prisma.inventoryIntegrationEvent.create({
    data: {
      companyId: company.id,
      target: 'FINANCE',
      status: 'PENDING',
      eventType: 'STOCK_VALUATION_SYNC',
      entityId: 'BATCH-2024-05-20',
      detail: 'End of day stock valuation sync'
    }
  });

  console.log('✅ Created inventory extension data');

  // ============================================================
  // HR: Attendance Records
  // ============================================================
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.attendanceRecord.createMany({
    data: [
      {
        id: 'att-001',
        companyId: company.id,
        employeeId: 'emp-001',
        locationId: 'loc-jkt',
        date: today,
        status: 'present',
        checkIn: { time: new Date(today.setHours(8, 30, 0, 0)).toISOString(), method: 'manual' },
        workDurationMinutes: 0,
      },
      {
        id: 'att-002',
        companyId: company.id,
        employeeId: 'emp-002',
        locationId: 'loc-jkt',
        date: yesterday,
        status: 'present',
        checkIn: { time: new Date(yesterday.setHours(9, 0, 0, 0)).toISOString(), method: 'manual' },
        checkOut: { time: new Date(yesterday.setHours(17, 30, 0, 0)).toISOString(), method: 'manual' },
        workDurationMinutes: 510,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created attendance records');

  // ============================================================
  // HR: Leave Requests
  // ============================================================
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.leaveRequest.createMany({
    data: [
      {
        id: 'leave-001',
        companyId: company.id,
        employeeId: 'emp-001',
        departmentId: 'dept-eng',
        type: 'annual',
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
        reason: 'Family vacation',
        status: 'requested',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created leave requests');

  // ============================================================
  // HR: Payroll
  // ============================================================
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const payrollRun = await prisma.payrollRun.upsert({
    where: { id: 'payroll-run-001' },
    update: {},
    create: {
      id: 'payroll-run-001',
      companyId: company.id,
      periodStart: currentMonth,
      periodEnd: currentMonthEnd,
      status: 'draft',
      totalEmployees: 3,
      totalGrossPay: 45000000,
      totalNetPay: 40500000,
    },
  });

  await prisma.payrollLine.createMany({
    data: [
      {
        id: 'payroll-001',
        companyId: company.id,
        payrollRunId: payrollRun.id,
        employeeId: 'emp-001',
        grossPay: 15000000,
        adjustments: 1500000,
        netPay: 13500000,
      },
      {
        id: 'payroll-002',
        companyId: company.id,
        payrollRunId: payrollRun.id,
        employeeId: 'emp-002',
        grossPay: 18000000,
        adjustments: 1800000,
        netPay: 16200000,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created payroll data');
  
  // ============================================================
  // 18. IT Module Seeding
  // ============================================================
  
  // IT Devices
  await prisma.iTDevice.createMany({
    data: [
      {
        id: 'it-dev-001',
        companyId: company.id,
        locationId: 'loc-jkt',
        ownerId: 'emp-001', // John Doe
        deviceType: 'laptop',
        deviceName: 'MacBook Pro 14 - John',
        serialNumber: 'ZVX-LP-1001',
        status: 'active',
        lastSeen: new Date(),
      },
      {
        id: 'it-dev-002',
        companyId: company.id,
        locationId: 'loc-jkt',
        deviceType: 'scanner',
        deviceName: 'Warehouse Scanner A1',
        serialNumber: 'ZVX-SC-2002',
        status: 'monitoring',
      },
      {
        id: 'it-dev-003',
        companyId: company.id,
        locationId: 'loc-bdg',
        deviceType: 'terminal',
        deviceName: 'Branch Terminal B1',
        serialNumber: 'ZVX-TR-3003',
        status: 'maintenance',
      },
    ],
    skipDuplicates: true,
  });

  // IT System Health
  await prisma.iTSystemHealth.createMany({
    data: [
      {
        companyId: company.id,
        component: 'identity',
        status: 'healthy',
        latencyMs: 12,
      },
      {
        companyId: company.id,
        component: 'database',
        status: 'healthy',
        latencyMs: 5,
      },
      {
        companyId: company.id,
        component: 'gateway',
        status: 'degraded',
        latencyMs: 450,
      },
    ],
  });

  // IT Provisioning Requests
  await prisma.iTProvisioningRequest.createMany({
    data: [
      {
        id: 'it-prov-001',
        companyId: company.id,
        employeeId: 'emp-002',
        type: 'ACCOUNT',
        reason: 'New HR Manager onboarding',
        status: 'PROVISIONED',
        requestedBy: 'system',
        provisionedBy: 'admin-it',
      },
      {
        id: 'it-prov-002',
        companyId: company.id,
        supplierId: 'sup-001',
        type: 'SUPPLIER_PORTAL',
        scope: 'full_portal',
        status: 'REQUESTED',
        requestedBy: 'emp-001',
      },
    ],
    skipDuplicates: true,
  });

  // IT Settings
  await prisma.iTSetting.createMany({
    data: [
      {
        companyId: company.id,
        key: 'auth.mfa_enabled',
        value: 'true',
        category: 'security',
      },
      {
        companyId: company.id,
        key: 'procurement.auto_approve_limit',
        value: '5000000',
        category: 'finance',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created IT module data');

  console.log('🏁 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
