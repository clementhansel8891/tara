
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { financeService } from './financeService';
import { financeRepo } from '@/core/repositories/finance/financeRepo';
import { audit } from '@/core/logging/audit';

// Mock dependencies
vi.mock('@/core/repositories/finance/financeRepo', () => ({
  financeRepo: {
    createAsset: vi.fn(),
    createCapexRequest: vi.fn(),
    listAssets: vi.fn().mockResolvedValue([]),
    listJournalEntries: vi.fn().mockResolvedValue([]),
    createJournalEntry: vi.fn(),
    updateJournalEntry: vi.fn(),
    listPayables: vi.fn().mockResolvedValue([]),
    createPayable: vi.fn(),
    updatePayable: vi.fn(),
    listReceivables: vi.fn().mockResolvedValue([]),
    createReceivable: vi.fn(),
    updateReceivable: vi.fn(),
    listSources: vi.fn().mockResolvedValue([]),
    updateSource: vi.fn(),
    listTransfers: vi.fn().mockResolvedValue([]),
    createTransfer: vi.fn(),
    listSettlements: vi.fn().mockResolvedValue([]),
    createSettlement: vi.fn(),
    listCapexRequests: vi.fn().mockResolvedValue([]),
    updateCapexRequest: vi.fn(),
    updateAsset: vi.fn(),
  },
}));

vi.mock('@/core/logging/audit', () => ({
  audit: {
    log: vi.fn(),
  },
}));

vi.mock('@/core/org/departmentResolver', () => ({
  resolveDepartment: vi.fn((id) => ({ code: id, name: id })),
}));

vi.mock('@/core/services/hr/workflowService', () => ({
  workflowService: {
    createRequest: vi.fn((tenantId, session, params) => ({ id: `wf-${Date.now()}` })),
    listRequests: vi.fn().mockReturnValue([]),
  },
}));

describe('financeService', () => {
  const tenantId = 'test-tenant';
  const session = { tenantId, userId: 'user-1', role: 'ADMIN', departmentId: 'DEP-1' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks for budget check
    (financeRepo.listJournalEntries as any).mockResolvedValue([
      {
        status: 'posted',
        lines: [
          {
            accountCode: 'BUD-CAPEX-IT',
            debit: 100000000,
            credit: 0,
          },
        ],
      },
    ]);
    (financeRepo.listCapexRequests as any).mockResolvedValue([]);
  });

  describe('createAsset', () => {
    it('should create an asset and log audit', async () => {
      const payload = { 
        assetDescription: 'New Asset', 
        department: 'IT',
        requestedAmount: 1000,
        location: 'HQ',
        acquisitionDate: '2024-01-01',
        usefulLifeYears: 5,
        residualValue: 0,
        depreciationMethod: 'STRAIGHT_LINE',
        assetClass: 'EQUIPMENT'
      } as any;
      const createdAsset = { id: 'asset-1', ...payload };
      const createdCapex = { id: 'capex-1', ...payload };
      
      (financeRepo.createAsset as any).mockResolvedValue(createdAsset);
      (financeRepo.createCapexRequest as any).mockResolvedValue(createdCapex);

      const result = await financeService.createAsset(tenantId, session, payload);

      console.log('Repo createAsset calls:', (financeRepo.createAsset as any).mock.calls);
      console.log('Audit log calls:', (audit.log as any).mock.calls);

      expect(result).toEqual(createdAsset);
      expect(financeRepo.createAsset).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalled();
    });
  });

  describe('createCapexRequest', () => {
    it('should create capex request and log audit', async () => {
        const payload = { 
            assetDescription: 'New Capex', 
            department: 'IT',
            requestedAmount: 1000,
            location: 'HQ',
            acquisitionDate: '2024-01-01',
            usefulLifeYears: 5,
            residualValue: 0,
            depreciationMethod: 'STRAIGHT_LINE',
            assetClass: 'EQUIPMENT'
        } as any;
        const createdCapex = { id: 'capex-1', ...payload, budgetMatched: true };
        const createdAsset = { id: 'asset-1', ...payload };

        (financeRepo.createCapexRequest as any).mockResolvedValue(createdCapex);
        (financeRepo.createAsset as any).mockResolvedValue(createdAsset);

        const result = await financeService.createCapexRequest(tenantId, session, payload);

        console.log('Repo createCapexRequest calls:', (financeRepo.createCapexRequest as any).mock.calls);

        expect(result.capex).toEqual(createdCapex);
        expect(financeRepo.createCapexRequest).toHaveBeenCalled();
        expect(audit.log).toHaveBeenCalled();
    });
  });

});
