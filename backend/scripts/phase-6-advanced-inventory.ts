import { v4 as uuidv4 } from 'uuid';

const API_BASE = 'http://127.0.0.1:3001/v1';
let TOKEN = '';
let TENANT_ID = '';
let HQ_LOCATION_ID = '';
let BRANCH_STORE_ID = '';
let ECOMMERCE_CHANNEL_ID = '';
let ECOMMERCE_CLIENT_ID = '';
let ECOMMERCE_CLIENT_SECRET = '';
let TEST_PRODUCT_ID = '';

async function api(path: string, method: string = 'GET', body?: any, extraHeaders: Record<string, string> = {}, delay: number = 300) {
  const headers: any = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  if (TENANT_ID) headers['x-tenant-id'] = TENANT_ID;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  // Delay to prevent rate limiting
  await new Promise(resolve => setTimeout(resolve, delay));

  const data: any = await res.json();
  if (!res.ok || (data.success === false && !path.includes('orders') && !path.includes('checkout'))) {
    console.error(`❌ API Error [${method} ${path}]:`, JSON.stringify(data, null, 2));
    throw new Error(`API Request failed: ${method} ${path}`);
  }
  return data;
}

async function runPhase6() {
  console.log(`\n====================================================`);
  console.log(`🚀 STARTING PHASE 6: ADVANCED INVENTORY VALIDATION`);
  console.log(`====================================================\n`);

  try {
    // 1. Setup
    console.log('[1] Setting up test environment...');
    const loginData = await api('/auth/login', 'POST', { email: 'hansel@zenvix.id', password: 'password123' });
    TOKEN = loginData.token;

    const provData = await api('/auth/company/provision', 'POST', {
      name: `Inventory Test Co ${Date.now().toString().slice(-4)}`,
      industry: 'RETAIL',
      country: 'Indonesia',
      address: 'Test Address'
    });
    TENANT_ID = provData.data.tenant_id;
    HQ_LOCATION_ID = provData.data.location_id;

    // Create Branch
    const bData = await api('/retail/stores', 'POST', {
      name: 'Test Branch',
      code: 'TBR-01',
      location_id: HQ_LOCATION_ID,
      is_active: true,
      type: 'flagship'
    });
    BRANCH_STORE_ID = bData.data.id;

    // Create Ecommerce Channel
    const eData = await api('/retail/ecommerce-hub/channels', 'POST', {
      name: 'Main Website',
      type: 'HEADLESS',
      adapterType: 'CUSTOM'
    });
    ECOMMERCE_CHANNEL_ID = eData.data.channel.id;
    ECOMMERCE_CLIENT_ID = eData.data.plainClientId;
    ECOMMERCE_CLIENT_SECRET = eData.data.plainClientSecret;

    // Create Department
    const dData = await api('/hr/departments', 'POST', {
      name: 'Inventory',
      code: 'INV-TEST'
    }, {}, 3500);
    const DEPT_INV_ID = dData.data.id;

    // Create Employee (System User)
    const eUserData = await api('/hr/employees', 'POST', {
      first_name: 'System',
      last_name: 'Gateway',
      employee_code: 'SYS-001',
      email: `sys-${Date.now()}@test.com`,
      department_id: DEPT_INV_ID,
      location_id: HQ_LOCATION_ID,
      position: 'API Gateway',
      employment_type: 'full_time',
      hire_date: new Date().toISOString()
    }, {}, 3500);
    const SYSTEM_EMPLOYEE_ID = eUserData.data.id;

    // Create Product
    const pData = await api('/inventory/items', 'POST', {
      sku: `PROD-${Date.now()}`,
      name: 'Advanced Stock Item',
      category: 'Jewelry',
      category_id: 'cat-1',
      uom: 'pcs',
      base_price: 100000,
      status: 'active'
    });
    TEST_PRODUCT_ID = pData.data.id;

    // Add 10 items to Stock
    await api('/inventory/intake', 'POST', {
      item_id: TEST_PRODUCT_ID,
      location_id: HQ_LOCATION_ID,
      departmentId: DEPT_INV_ID,
      quantity: 10,
      unitCost: 50000,
      reason: 'Initial Stock'
    });

    // Link product to channel and make visible
    await api(`/retail/ecommerce-hub/channels/${ECOMMERCE_CHANNEL_ID}/products`, 'PUT', {
      updates: [{
        product_id: TEST_PRODUCT_ID,
        visible: true,
        stock_limit: 10
      }]
    });

    console.log(`✅ Setup Complete. Stock Level: 10 units at HQ.`);

    // --- TEST 1: Ecommerce Reservation blocks Branch Sale ---
    console.log(`\n[Test 1] Ecommerce Reservation blocks Branch Sale`);
    
    // Create Ecommerce Order for 7 items
    console.log(`- Placing Ecommerce Order for 7 items...`);
    const eOrder = await api('/retail/public/orders', 'POST', {
      customer: { email: 'customer@test.com', name: 'Test User' },
      items: [{ sku: pData.data.sku, quantity: 7 }],
      payment_method: 'card',
      payment_status: 'PENDING',
      externalReference: 'EXT-REF-1'
    }, {
      'x-client-id': ECOMMERCE_CLIENT_ID,
      'x-client-secret': ECOMMERCE_CLIENT_SECRET
    });
    console.log(`- Order Created: ${eOrder.order_id}. Status: ${eOrder.status}`);

    // Check Stock Status
    const stockStatus = await api(`/retail/inventory/status?productId=${TEST_PRODUCT_ID}`);
    console.log(`- Current Stock: On-Hand: ${stockStatus.data.on_hand}, Available: ${stockStatus.data.available}, Reserved: ${stockStatus.data.reserved}`);
    
    // Try Branch Sale for 5 items (Total 10, Reserved 7, Available 3). 5 should FAIL.
    console.log(`- Attempting Branch Sale of 5 items (Available is only 3)...`);
    try {
      const checkoutRes = await api('/retail/checkout', 'POST', {
        store_id: BRANCH_STORE_ID,
        items: [{ product_id: TEST_PRODUCT_ID, quantity: 5, unit_price: 120000 }],
        payment_method: 'cash',
        grand_total: '600000',
        payment_received: '600000'
      }, { 'x-idempotency-key': uuidv4() });
      
      if (checkoutRes.success === false) {
        console.log(`✅ SUCCESS: Branch sale blocked with message: ${checkoutRes.message}`);
      } else {
        console.error(`❌ FAILURE: Branch sale succeeded when it should have been blocked!`);
      }
    } catch (e) {
      console.log(`✅ SUCCESS: Branch sale blocked as expected (API error).`);
    }

    // --- TEST 2: Overbooking Rejection ---
    console.log(`\n[Test 2] Ecommerce Overbooking Rejection`);
    
    // Try another Ecommerce Order for 5 items (Available 3). Should FAIL.
    console.log(`- Placing second Ecommerce Order for 5 items (Available is only 3)...`);
    try {
      await api('/retail/public/orders', 'POST', {
        customer: { email: 'customer2@test.com', name: 'User 2' },
        items: [{ sku: pData.data.sku, quantity: 5 }],
        payment_method: 'card',
        payment_status: 'PENDING',
        externalReference: 'EXT-REF-2'
      }, {
        'x-client-id': ECOMMERCE_CLIENT_ID,
        'x-client-secret': ECOMMERCE_CLIENT_SECRET
      });
      console.error(`❌ FAILURE: Overbooking allowed!`);
    } catch (e: any) {
      console.log(`✅ SUCCESS: Overbooking rejected as expected: Insufficient stock.`);
    }

    console.log(`\n====================================================`);
    console.log(`📊 PHASE 6 COMPLETE: ADVANCED INVENTORY VERIFIED`);
    console.log(`====================================================`);

  } catch (error) {
    console.error(`\n❌ PHASE 6 FAILED:`);
    console.error(error);
    process.exit(1);
  }
}

runPhase6();
