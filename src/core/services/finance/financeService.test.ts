
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { financeService } from './financeService';

// ─── Mock the API client ──────────────────────────────────────────────────────
// financeService is now fully API-backed; we mock apiRequest at module level.
vi.mock('@/core/api/apiClient', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public message: string, public status: number, public data: any = null) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

import { apiRequest } from '@/core/api/apiClient';

// ─── Sessions (snake_case per SessionContext interface) ───────────────────────
const tenantId = 'test-tenant';
const session = {
  user_id: 'user-1',
  tenant_id: tenantId,
  role: 'SUPERADMIN' as const,
  department_id: 'DEP-1',
  location_id: 'LOC-1',
  permissions: [],
} as any;

// ─── Test Suites ─────────────────────────────────────────────────────────────
describe('financeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAsset', () => {
    it('should delegate to createCapexRequest and return asset', async () => {
      const payload = {
        assetDescription: 'New Asset',
        department: 'IT',
        requestedAmount: 1_000_000,
        location: 'HQ',
        acquisitionDate: '2024-01-01',
        usefulLifeYears: 5,
        residualValue: 0,
        depreciationMethod: 'STRAIGHT_LINE',
        assetClass: 'EQUIPMENT',
      } as any;

      const mockAsset = { id: 'asset-1', ...payload };
      const mockCapex = { id: 'capex-1', ...payload };

      // createAsset calls createCapexRequest which calls apiRequest once
      (apiRequest as any).mockResolvedValueOnce({ asset: mockAsset, capex: mockCapex });

      const result = await financeService.createAsset(tenantId, session, payload);

      expect(apiRequest).toHaveBeenCalledOnce();
      expect(apiRequest).toHaveBeenCalledWith(
        '/v1/finance/capex/requests',
        'POST',
        session,
        payload,
      );
      expect(result).toEqual(mockAsset);
    });
  });

  describe('createCapexRequest', () => {
    it('should POST to capex/requests and return asset + capex', async () => {
      const payload = {
        assetDescription: 'New Capex',
        department: 'IT',
        requestedAmount: 5_000_000,
        location: 'HQ',
        acquisitionDate: '2024-01-01',
        usefulLifeYears: 5,
        residualValue: 0,
        depreciationMethod: 'STRAIGHT_LINE',
        assetClass: 'EQUIPMENT',
      } as any;

      const mockAsset = { id: 'asset-1', ...payload };
      const mockCapex = { id: 'capex-1', ...payload, status: 'PENDING_HOD_APPROVAL', budgetMatched: true };

      (apiRequest as any).mockResolvedValueOnce({ asset: mockAsset, capex: mockCapex });

      const result = await financeService.createCapexRequest(tenantId, session, payload);

      expect(apiRequest).toHaveBeenCalledOnce();
      expect(result.capex).toEqual(mockCapex);
      expect(result.asset).toEqual(mockAsset);
    });
  });

  describe('approveCapexRequest', () => {
    it('should POST to approve endpoint', async () => {
      const mockCapex = { id: 'capex-1', status: 'PENDING_CFO_APPROVAL' };
      (apiRequest as any).mockResolvedValueOnce(mockCapex);

      const result = await financeService.approveCapexRequest(tenantId, session, 'capex-1');

      expect(apiRequest).toHaveBeenCalledWith(
        '/v1/finance/capex/requests/capex-1/approve',
        'POST',
        session,
      );
      expect(result?.status).toBe('PENDING_CFO_APPROVAL');
    });
  });

  describe('listAssets', () => {
    it('should GET finance assets', async () => {
      const mockAssets = [{ id: 'asset-1' }, { id: 'asset-2' }];
      (apiRequest as any).mockResolvedValueOnce(mockAssets);

      const result = await financeService.listAssets(tenantId, session);

      expect(apiRequest).toHaveBeenCalledWith('/v1/finance/assets', 'GET', session);
      expect(result).toHaveLength(2);
    });
  });

  describe('createReceivable', () => {
    it('should POST to receivables endpoint', async () => {
      const payload = { customer: 'Acme Corp', amount: 120_000_000, dueDate: '2026-03-31' };
      const mockReceivable = { id: 'rec-1', ...payload, status: 'PENDING' };
      (apiRequest as any).mockResolvedValueOnce(mockReceivable);

      const result = await financeService.createReceivable(tenantId, session, payload);

      expect(apiRequest).toHaveBeenCalledWith('/v1/finance/receivables', 'POST', session, payload);
      expect(result.id).toBe('rec-1');
    });
  });

  describe('createPayable', () => {
    it('should POST to payables endpoint via capturePayableInvoice', async () => {
      const payload = { vendor: 'Vendor Prime', amount: 80_000_000, dueDate: '2026-03-31' };
      const mockPayable = { id: 'bill-1', status: 'PENDING' };
      (apiRequest as any).mockResolvedValueOnce(mockPayable);

      const result = await financeService.createPayable(tenantId, session, payload);

      expect(apiRequest).toHaveBeenCalledOnce();
      expect(result.id).toBe('bill-1');
    });
  });

  describe('listReceivables', () => {
    it('should GET receivables', async () => {
      (apiRequest as any).mockResolvedValueOnce([{ id: 'rec-1' }]);
      const result = await financeService.listReceivables(tenantId, session);
      expect(result).toHaveLength(1);
    });
  });

  describe('listPayments', () => {
    it('should GET payments', async () => {
      (apiRequest as any).mockResolvedValueOnce([{ id: 'pay-1' }, { id: 'pay-2' }]);
      const result = await financeService.listPayments(tenantId, session);
      expect(result).toHaveLength(2);
    });
  });

  describe('lockPeriod', () => {
    it('should POST to period lock endpoint', async () => {
      (apiRequest as any).mockResolvedValueOnce(undefined);
      await financeService.lockPeriod(tenantId, session, 'period-1');
      expect(apiRequest).toHaveBeenCalledWith('/v1/finance/periods/period-1/lock', 'POST', session);
    });
  });

  describe('generateAssetAuditPack', () => {
    it('should GET audit pack for asset', async () => {
      const mockPack = {
        assetId: 'asset-1',
        checksum: 'abc123',
        signatureVersion: 'v1',
        signature: 'sig-abc',
      };
      (apiRequest as any).mockResolvedValueOnce(mockPack);

      const result = await financeService.generateAssetAuditPack(tenantId, session, 'asset-1');

      expect(apiRequest).toHaveBeenCalledWith(
        '/v1/finance/assets/asset-1/audit-pack',
        'GET',
        session,
      );
      expect(result.signatureVersion).toBe('v1');
    });
  });

  describe('verifyAssetAuditPack', () => {
    it('should POST to verify endpoint', async () => {
      (apiRequest as any).mockResolvedValueOnce(true);
      const mockPack = { assetId: 'asset-1', checksum: 'abc', signature: 'sig', signatureVersion: 'v1' } as any;

      const result = await financeService.verifyAssetAuditPack(tenantId, session, mockPack);

      expect(apiRequest).toHaveBeenCalledWith(
        '/v1/finance/assets/audit-pack/verify',
        'POST',
        session,
        { pack: mockPack },
      );
      expect(result).toBe(true);
    });
  });
});
