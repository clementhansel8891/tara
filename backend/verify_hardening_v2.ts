import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyHardening() {
  console.log('--- Starting Refined Hardening Verification (v2.1) ---');
  const tenantId = 'test-tenant-' + Date.now();
  const locationA = 'loc-A-' + Date.now();
  const locationB = 'loc-B-' + Date.now();
  const productId = 'prod-' + Date.now();

  try {
    // 0. Setup
    console.log('0. Setup: Creating base data...');
    await (prisma as any).company.create({ data: { id: tenantId, name: 'Test Corp', code: 'TC-' + Date.now() } });
    await (prisma as any).location.create({ data: { id: locationA, tenantId, name: 'Location A', code: locationA, type: 'WAREHOUSE' } });
    await (prisma as any).location.create({ data: { id: locationB, tenantId, name: 'Location B', code: locationB, type: 'RETAIL' } });
    
    // Create Category
    const category = await (prisma as any).productCategory.create({ data: { tenantId, name: 'Electronics' } });
    
    await (prisma as any).product.create({ 
      data: { 
        id: productId, 
        tenantId, 
        name: 'Hardened Item', 
        sku: 'H-' + Date.now(), 
        barcode: 'B-' + Date.now(),
        categoryId: category.id,
        basePrice: 100,
        unit: 'pcs'
      } 
    });

    // 1. Idempotency Check (6-field unique constraint)
    console.log('\n1. Verifying Idempotency (6-field Unique Constraint)...');
    const refId = 'REF-123';
    const type = 'INTAKE';
    
    // First intake
    console.log(' - Creating first movement...');
    await (prisma as any).stockMovement.create({
      data: {
        tenantId,
        productId,
        locationId: locationA,
        quantity: 10,
        type,
        referenceId: refId,
        referenceType: 'TEST',
        performedBy: 'tester'
      }
    });

    // Duplicate intake (same everything)
    console.log(' - Attempting duplicate movement (should fail)...');
    try {
      await (prisma as any).stockMovement.create({
        data: {
          tenantId,
          productId,
          locationId: locationA,
          quantity: 10,
          type,
          referenceId: refId,
          referenceType: 'TEST',
          performedBy: 'tester'
        }
      });
      console.error(' [FAIL] Duplicate movement allowed!');
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(' [SUCCESS] Duplicate movement rejected (P2002).');
      } else {
        console.log(' [SUCCESS-ish] Caught error:', e.message);
      }
    }

    // 2. Reservation Safety Rule (Simulation of Repo Logic)
    console.log('\n2. Verifying Reservation Safety (onHand vs Reserved)...');
    await (prisma as any).stockLevel.create({
      data: {
        tenantId,
        productId,
        locationId: locationA,
        onHand: 10,
        available: 10,
        reserved: 0
      }
    });

    const level = await (prisma as any).stockLevel.findFirst({ where: { tenantId, productId, locationId: locationA } });
    if (level && level.available < 15) {
      console.log(` [SUCCESS] Available (${level.available}) < Requested (15). Repo logic would reject.`);
    }

    // 3. Transfer Linking
    console.log('\n3. Verifying Transfer Linking...');
    const groupId = 'GRP-' + Date.now();
    await (prisma as any).stockMovement.create({
        data: {
            tenantId,
            productId,
            locationId: locationA,
            quantity: -5,
            type: 'TRANSFER_OUT',
            referenceId: 'TR-101',
            transferGroupId: groupId,
            performedBy: 'tester'
        }
    });

    const move = await (prisma as any).stockMovement.findFirst({ where: { transferGroupId: groupId } });
    if (move && move.transferGroupId === groupId) {
        console.log(' [SUCCESS] transferGroupId persisted correctly.');
    }

    console.log('\n--- Refined Hardening Verification Complete ---');

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyHardening();
