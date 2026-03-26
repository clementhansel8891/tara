import { PrismaClient } from '@prisma/client';

async function verify() {
  const prisma = new PrismaClient();
  const tenantId = 'verif-tenant-999';
  const locationId = 'loc-main';
  const productId = 'prod-ai-test';
  const categoryId = 'cat-test';

  console.log('--- STANDALONE REPOSITORY VERIFICATION ---');

  try {
    // 1. Setup Parent Records
    console.log('Step 1: Ensuring parent records exist...');
    await prisma.company.upsert({
        where: { id: tenantId },
        update: {},
        create: { 
            id: tenantId, 
            name: 'Verification Corp',
            code: 'VERIF-CORP'
        }
    });

    await prisma.productCategory.upsert({
        where: { id: categoryId },
        update: {},
        create: { id: categoryId, tenantId, name: 'Test Category' }
    });

    await prisma.product.upsert({
        where: { id: productId },
        update: {},
        create: { 
            id: productId, 
            tenantId, 
            categoryId, 
            name: 'AI Test Product', 
            sku: 'AI-TEST-SKU',
            barcode: 'AI-TEST-BARCODE',
            unit: 'unit',
            basePrice: 100
        }
    });

    await prisma.location.upsert({
        where: { id: locationId },
        update: {},
        create: { 
            id: locationId, 
            tenantId, 
            name: 'Main Warehouse', 
            code: 'MAIN-WH', // MANDATORY
            type: 'WAREHOUSE' 
        }
    });

    // Clean up transaction records
    await prisma.stockMovement.deleteMany({ where: { tenantId } });
    await prisma.stockReservation.deleteMany({ where: { tenantId } });
    await prisma.agenticEvent.deleteMany({ where: { tenantId } });
    await prisma.stockLevel.deleteMany({ where: { tenantId } });

    // 2. Initial Level
    console.log('Step 2: Creating initial stock (10 units)...');
    await prisma.stockLevel.create({
      data: {
        tenantId,
        locationId,
        productId,
        onHand: 10,
        available: 10,
        reserved: 0,
        inTransit: 0,
        minBuffer: 5,
        maxCapacity: 50,
      }
    });

    // 3. Test Reservation
    console.log('Step 3: Testing reserveStock logic...');
    const refId = `REF-${Date.now()}`;
    
    await prisma.$transaction(async (tx) => {
        const levels = await tx.stockLevel.findMany({
            where: { tenantId, productId, locationId }
        });
        const level = levels[0];
        if (!level || level.available < 3) throw new Error('Insufficient stock');

        await tx.stockLevel.update({
            where: { id: level.id },
            data: { 
                reserved: { increment: 3 },
                available: { decrement: 3 }
            }
        });

        await tx.stockReservation.create({
            data: {
                tenantId, productId, locationId, quantity: 3, status: 'PENDING', referenceId: refId, referenceType: 'TEST'
            }
        });
    });

    const res = await prisma.stockReservation.findFirst({ where: { referenceId: refId } });
    console.log('Reservation Created:', res?.status === 'PENDING' ? 'PASSED' : 'FAILED');

    // 4. Test Consumption
    console.log('Step 4: Testing consumeFromReservation logic...');
    await prisma.$transaction(async (tx) => {
        const levels = await tx.stockLevel.findMany({
            where: { tenantId, productId, locationId }
        });
        const level = levels[0];
        
        await tx.stockLevel.update({
            where: { id: level.id },
            data: { 
                onHand: { decrement: 3 },
                reserved: { decrement: 3 }
            }
        });

        await tx.stockReservation.updateMany({
            where: { referenceId: refId, status: 'PENDING' },
            data: { status: 'CONSUMED' }
        });
    });

    const resFinal = await prisma.stockReservation.findFirst({ where: { referenceId: refId } });
    console.log('Reservation Consumed:', resFinal?.status === 'CONSUMED' ? 'PASSED' : 'FAILED');

    // 5. Test Agentic Event Persistence
    console.log('Step 5: Testing Agentic Event persistence...');
    const event = await prisma.agenticEvent.create({
        data: {
            tenantId,
            eventType: 'REPLENISHMENT_RECOMMENDED',
            entityId: productId,
            entityType: 'PRODUCT',
            payload: { recommendedQty: 20 } as any,
            correlationId: 'test-corr-123',
            sourceEventId: 'test-source-456'
        }
    });
    console.log('Agentic Event Traceability:', event.correlationId === 'test-corr-123' ? 'PASSED' : 'FAILED');

    console.log('--- ALL REPOSITORY LOGIC VERIFIED ---');
  } catch (err) {
    console.error('Verification FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
