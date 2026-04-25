import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();
const hashSecret = (secret) => createHash('sha256').update(secret).digest('hex');

async function test() {
  const tenantId = 'comp-demo-a'; // from seed.ts
  const clientId = 'test-client-123';
  const clientSecret = 'test-secret';

  // 1. Setup channel with known credentials
  await prisma.retailChannel.upsert({
    where: { id: 'test-chan-01' },
    update: {
      credentials: {
        clientId,
        clientSecretHash: hashSecret(clientSecret),
        branchId: 'loc-jkt'
      }
    },
    create: {
      id: 'test-chan-01',
      companyId: tenantId,
      name: 'Test Setup Channel',
      type: 'OWNED',
      adapterType: 'CUSTOM',
      status: 'active',
      syncFrequency: '5m',
      credentials: {
        clientId,
        clientSecretHash: hashSecret(clientSecret),
        branchId: 'loc-jkt'
      },
      webhookUrl: 'https://test.com/webhooks',
    }
  });

  console.log('✅ Temporary channel registered.');

  const headers = {
    'x-tenant-id': tenantId,
    'x-client-id': clientId,
    'x-client-secret': clientSecret,
    'Content-Type': 'application/json'
  };

  const API_URL = 'http://localhost:3001/api/retail/public';

  console.log('\n--- GET /products ---');
  const res1 = await fetch(`${API_URL}/products`, { headers });
  const data1 = await res1.json();
  console.log(`Status: ${res1.status}`);
  if (data1.length) {
    console.log(JSON.stringify(data1, null, 2).substring(0, 300) + '...');
  } else {
    console.log(data1);
  }
  
  if (data1.length > 0) {
    const prodId = data1[0].id;
    console.log(`\n--- GET /products/${prodId} (Deep Dive) ---`);
    const res2 = await fetch(`${API_URL}/products/${prodId}`, { headers });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status}`);
    console.log(JSON.stringify(data2, null, 2));

    console.log('\n--- POST /orders (Order Integrity) ---');
    const orderPayload = {
      items: [{ sku: data1[0].sku, quantity: 2 }],
      customer: { email: 'alice@example.com' },
      paymentMethod: 'card',
      paymentStatus: 'UNPAID'
    };
    const res3 = await fetch(`${API_URL}/orders`, { 
      method: 'POST',
      headers,
      body: JSON.stringify(orderPayload)
    });
    const data3 = await res3.json();
    console.log(`Status: ${res3.status}`);
    console.log(JSON.stringify(data3, null, 2));
  }

  console.log('\n--- GET /categories (Dynamic Taxonomy) ---');
  const res4 = await fetch(`${API_URL}/categories`, { headers });
  const data4 = await res4.json();
  console.log(`Status: ${res4.status}`);
  console.log(JSON.stringify(data4, null, 2));

  console.log('\n--- GET /promotions (Promotions Engine) ---');
  const res5 = await fetch(`${API_URL}/promotions`, { headers });
  const data5 = await res5.json();
  console.log(`Status: ${res5.status}`);
  console.log(JSON.stringify(data5, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
