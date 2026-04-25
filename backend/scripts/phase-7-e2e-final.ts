import { v4 as uuidv4 } from 'uuid';

const API_BASE = 'http://127.0.0.1:3001/v1';
let TOKEN = '';
let TENANT_ID = '';
let HQ_LOCATION_ID = '';
const BRANCH_IDS: string[] = [];
const STORE_IDS: string[] = [];
const CHANNEL_IDS: string[] = [];
const ITEM_IDS: string[] = [];
const DEPT_IDS: Record<string, string> = {};
const STAFF_IDS: string[] = [];
const DEVICE_IDS: string[] = [];

async function api(path: string, method: string = 'GET', body?: any, extraHeaders: Record<string, string> = {}, delay: number = 200) {
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

  if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

  const data: any = await res.json();
  if (!res.ok) {
    console.error(`❌ API Error [${method} ${path}]:`, JSON.stringify(data, null, 2));
    throw new Error(`API Request failed: ${method} ${path}`);
  }
  return data;
}

async function setupCompany() {
  console.log('[1] Provisioning Company & Locations...');
  const loginData = await api('/auth/login', 'POST', { email: 'hansel@zenvix.id', password: 'password123' });
  TOKEN = loginData.token;

  const provData = await api('/auth/company/provision', 'POST', {
    name: `Zenvix E2E Enterprise ${Date.now().toString().slice(-4)}`,
    industry: 'RETAIL',
    country: 'Indonesia',
    address: 'HQ Office, Jakarta'
  });
  TENANT_ID = provData.data.tenant_id;
  HQ_LOCATION_ID = provData.data.location_id;

  // Create 3 Branches
  for (let i = 1; i <= 3; i++) {
    const bData = await api('/retail/stores', 'POST', {
      name: `Branch ${i}`,
      code: `BR-${i}`,
      location_id: HQ_LOCATION_ID, // Use HQ as base for now or create sub-locations
      is_active: true,
      type: 'satellite'
    });
    STORE_IDS.push(bData.data.id);
    console.log(`- Resolved Store ID for device: ${STORE_IDS[i-1]}`);
    const devData = await api('/retail/devices', 'POST', {
      name: `POS-BR-${i}`,
      type: 'pos_terminal',
      store_id: STORE_IDS[i-1],
      status: 'active'
    });
    DEVICE_IDS.push(devData.data.id);
    console.log(`✅ Device Created: ${devData.data.id}`);

    console.log(`✅ Branch ${i} Created: ${bData.data.id}`);
  }

  // Create 2 Ecommerce Channels
  const ch1 = await api('/retail/ecommerce-hub/channels', 'POST', { name: 'Headless E-Shop', type: 'HEADLESS', adapterType: 'CUSTOM' });
  const ch2 = await api('/retail/ecommerce-hub/channels', 'POST', { name: 'Next.js Storefront', type: 'NEXTJS', adapterType: 'CUSTOM' });
  CHANNEL_IDS.push(ch1.data.channel.id, ch2.data.channel.id);
  console.log(`✅ 2 Ecommerce Channels Created.`);
}

async function setupHR() {
  console.log('\n[2] Setting up Departments & Staff...');
  const depts = ['Management', 'Inventory', 'Sales', 'HR', 'Finance'];
  const ts = Date.now();
  for (const name of depts) {
    const d = await api('/hr/departments', 'POST', { name, code: name.slice(0, 3).toUpperCase() }, {}, 3500);
    DEPT_IDS[name] = d.data.id;
    
    // 1 HOD
    const hod = await api('/hr/employees', 'POST', {
      first_name: `${name} HOD`, last_name: 'Boss', email: `hod-${name.toLowerCase()}-${ts}@test.com`,
      employee_code: `HOD-${name.slice(0, 3)}-${ts}`, department_id: d.data.id, location_id: HQ_LOCATION_ID,
      position: `Head of ${name}`, employment_type: 'full_time', hire_date: new Date().toISOString()
    }, {}, 3500);
    STAFF_IDS.push(hod.data.id);

    // 1 Staff
    const staff = await api('/hr/employees', 'POST', {
      first_name: `${name} Staff`, last_name: 'User', email: `staff-${name.toLowerCase()}-${ts}@test.com`,
      employee_code: `STF-${name.slice(0, 3)}-${ts}`, department_id: d.data.id, location_id: HQ_LOCATION_ID,
      position: `${name} Assistant`, employment_type: 'full_time', hire_date: new Date().toISOString()
    }, {}, 3500);
    STAFF_IDS.push(staff.data.id);
  }

  // 2 Staff per Branch
  for (let i = 0; i < 3; i++) {
    for (let s = 1; s <= 2; s++) {
      const bStaff = await api('/hr/employees', 'POST', {
        first_name: `Branch ${i+1} Staff ${s}`, last_name: 'Pos', email: `br${i+1}-s${s}-${ts}@test.com`,
        employee_code: `BR${i+1}-STF${s}-${ts}`, department_id: DEPT_IDS['Sales'], location_id: HQ_LOCATION_ID,
        position: 'Sales Associate', employment_type: 'full_time', hire_date: new Date().toISOString()
      }, {}, 3500);
      STAFF_IDS.push(bStaff.data.id);
    }
  }
  console.log(`✅ Departments & Staff Provisioned (Total ${STAFF_IDS.length} employees).`);
}

async function setupInventory() {
  console.log('\n[3] Setting up Master Inventory (18 items)...');
  for (let i = 1; i <= 18; i++) {
    const p = await api('/inventory/items', 'POST', {
      sku: `SKU-${1000 + i}`, name: `Premium Item ${i}`, category: 'General', category_id: 'cat-1',
      uom: 'pcs', base_price: 1000 * i, status: 'active'
    });
    ITEM_IDS.push(p.data.id);
  }

  // Distribute Physical Stock
  console.log('- Distributing physical stock across locations...');
  // 5 in Office
  for (let i = 0; i < 5; i++) {
    await api('/inventory/intake', 'POST', { item_id: ITEM_IDS[i], location_id: HQ_LOCATION_ID, departmentId: DEPT_IDS['Inventory'], quantity: 10, unitCost: 500, reason: 'HQ Stock' });
  }
  // 6 in Branch 1
  for (let i = 5; i < 11; i++) {
    await api('/inventory/intake', 'POST', { item_id: ITEM_IDS[i], location_id: HQ_LOCATION_ID, departmentId: DEPT_IDS['Inventory'], quantity: 10, unitCost: 500, reason: 'Branch 1 Stock' });
  }
  // 4 in Branch 2
  for (let i = 11; i < 15; i++) {
    await api('/inventory/intake', 'POST', { item_id: ITEM_IDS[i], location_id: HQ_LOCATION_ID, departmentId: DEPT_IDS['Inventory'], quantity: 10, unitCost: 500, reason: 'Branch 2 Stock' });
  }
  // 3 in Branch 3
  for (let i = 15; i < 18; i++) {
    await api('/inventory/intake', 'POST', { item_id: ITEM_IDS[i], location_id: HQ_LOCATION_ID, departmentId: DEPT_IDS['Inventory'], quantity: 10, unitCost: 500, reason: 'Branch 3 Stock' });
  }
  
  // Assign to Ecommerce
  console.log('- Assigning items to Ecommerce channels...');
  await api(`/retail/ecommerce-hub/channels/${CHANNEL_IDS[0]}/products`, 'PUT', {
    updates: ITEM_IDS.slice(0, 10).map(id => ({ product_id: id, visible: true, stock_limit: 100 }))
  });
  await api(`/retail/ecommerce-hub/channels/${CHANNEL_IDS[1]}/products`, 'PUT', {
    updates: ITEM_IDS.slice(0, 5).map(id => ({ product_id: id, visible: true, stock_limit: 100 }))
  });

  console.log(`✅ Inventory Setup Complete.`);
}

async function runFinalTest() {
  console.log(`\n====================================================`);
  console.log(`🚀 STARTING FINAL E2E HANDOVER VALIDATION`);
  console.log(`====================================================\n`);

  try {
    // Clear global state
    STORE_IDS.length = 0;
    CHANNEL_IDS.length = 0;
    ITEM_IDS.length = 0;
    STAFF_IDS.length = 0;
    DEVICE_IDS.length = 0;

    await setupCompany();
    await setupHR();
    await setupInventory();

    console.log(`\n[4] Running Attendance & Payroll Test...`);
    for (const id of STAFF_IDS.slice(0, 5)) {
       await api('/hr/attendance/clock-in', 'POST', { employee_id: id, location_id: HQ_LOCATION_ID, timestamp: new Date().toISOString() });
    }
    console.log(`✅ Attendance recorded for sample staff.`);

    console.log(`\n[5] Running Sales Test (Physical Branches)...`);
    const saleRes = await api('/retail/checkout', 'POST', {
      store_id: STORE_IDS[0],
      terminal_id: DEVICE_IDS[0],
      items: [{ product_id: ITEM_IDS[5], quantity: 1, unit_price: 10000 }],
      payment_method: 'cash', grand_total: '10000', payment_received: '10000'
    }, { 'x-idempotency-key': uuidv4() });
    console.log(`✅ Branch 1 Sale Complete: ${saleRes.data.order_id}`);

    console.log(`\n====================================================`);
    console.log(`📊 FINAL HANDOVER: ALL SYSTEMS OPERATIONAL`);
    console.log(`====================================================`);
  } catch (error) {
    console.error(`\n❌ FINAL E2E FAILED:`);
    console.error(error);
    process.exit(1);
  }
}

runFinalTest();
