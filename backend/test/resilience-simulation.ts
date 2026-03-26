import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/persistence/prisma.service';
import { OutboxWorkerService } from '../src/shared/maintenance/outbox-worker.service';
import { v4 as uuidv4 } from 'uuid';

async function simulate() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const worker = app.get(OutboxWorkerService);

  console.log('--- STARTING RESILIENCE SIMULATION ---');

  const tenantId = '00000000-0000-0000-0000-000000000001'; // Default tenant

  // 1. Cleanup old events
  await prisma.outboxEvent.deleteMany({ where: { tenantId } });

  console.log('Step 1: Simulating Event Storm (100 Mixed Priority Events)...');
  const events = [];
  
  // 50 LOW priority (Insights)
  for (let i = 0; i < 50; i++) {
    events.push({
      id: uuidv4(),
      tenantId,
      type: 'hr.insight.anomaly.v1',
      payload: { detail: `Insight ${i}` },
      status: 'PENDING',
    });
  }

  // 10 HIGH priority (Payroll)
  for (let i = 0; i < 10; i++) {
    events.push({
      id: uuidv4(),
      tenantId,
      type: 'hr.payroll.executed.v1',
      payload: { payrollRunId: uuidv4() },
      status: 'PENDING',
    });
  }

  await prisma.outboxEvent.createMany({ data: events });

  console.log('Step 2: Running Worker (Priority & Backpressure Check)...');
  // We manually call the worker trigger
  await worker.handleOutbox();

  const processed = await prisma.outboxEvent.findMany({
    where: { tenantId, status: 'PROCESSED' },
    orderBy: { updatedAt: 'asc' },
  });

  console.log(`Processed: ${processed.length} events.`);
  const highPriorityProcessed = processed.filter(e => e.type.includes('payroll'));
  console.log(`High Priority Processed: ${highPriorityProcessed.length}`);

  // 3. Trigger Degradation
  console.log('Step 3: Simulating High Error Rate (Degradation Mode)...');
  // We'll mark some as FAILED to simulate history
  const failedEvents = [];
  for (let i = 0; i < 20; i++) {
    failedEvents.push({
      id: uuidv4(),
      tenantId,
      type: 'hr.insight.test.v1',
      payload: { error: true },
      status: 'FAILED',
      attempts: 1,
    });
  }
  await prisma.outboxEvent.createMany({ data: failedEvents });

  console.log('Running Worker again (Degradation Expected)...');
  await worker.handleOutbox();

  console.log('--- SIMULATION COMPLETE ---');
  await app.close();
}

simulate().catch(err => {
  console.error(err);
  process.exit(1);
});
