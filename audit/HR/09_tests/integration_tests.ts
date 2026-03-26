import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { HRModule } from '../hr.module';

describe('HR Module (Integration Audit)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HRModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  const TENANT_ID = 'test-tenant-123';

  it('SHOULD enforce tenant isolation on GET /employees', async () => {
    return request(app.getHttpServer())
      .get('/hr/employees')
      .set('x-tenant-id', TENANT_ID)
      .expect(200)
      .expect((res) => {
        expect(res.body.tenantId).toBe(TENANT_ID);
        res.body.data.forEach((emp: any) => {
          expect(emp.tenantId).toBe(TENANT_ID);
        });
      });
  });

  it('SHOULD reject invalid clock-ins without locationId', async () => {
    return request(app.getHttpServer())
      .post('/hr/attendance/clock-in')
      .set('x-tenant-id', TENANT_ID)
      .send({ employeeId: 'emp-1' }) // Missing locationId
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
