import { Injectable, Logger, Inject } from '@nestjs/common';
import { Asset, AssetType } from '../domain/asset.interfaces';
import { PostingGatewayService } from './posting-gateway.service';
import { IAssetCategoryRepository } from '../repositories/interfaces/asset-category.repository.interface';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    private readonly gateway: PostingGatewayService,
    @Inject('IAssetCategoryRepository')
    private readonly categoryRepo: IAssetCategoryRepository,
  ) {}

  /**
   * Registers a new fixed asset and triggers the acquisition posting.
   */
  async acquireAsset(asset: Asset): Promise<void> {
    this.logger.log(`Acquiring Asset: ${asset.name} (Cat: ${asset.categoryId}) for ${asset.acquisitionCost} ${asset.currency}`);

    const category = await this.categoryRepo.findById(asset.tenantId, asset.companyId, asset.categoryId);
    if (!category) throw new Error(`Asset Category ${asset.categoryId} not found.`);

    const postingRequest = {
        requestId: `ASSET-ACQ-${asset.id}`,
        tenantId: asset.tenantId,
        companyId: asset.companyId,
        sourceModule: 'ASSET_MANAGEMENT',
        sourceEventId: asset.id,
        eventType: 'ASSET_ACQUIRED',
        eventVersion: '1.0.0',
        schemaVersion: '2026-Q1',
        payload: {
          assetId: asset.id,
          cost: asset.acquisitionCost,
          currency: asset.currency,
          glAccountId: category.defaultAssetAccountId,
          fiscalPeriodId: '2026-03',
        },
        createdAt: new Date(),
    };

    const result = await this.gateway.postEvent(postingRequest as any);
    
    if (result.status === 'POSTED') {
      this.logger.log(`Asset ${asset.name} successfully acquired and posted.`);
    } else {
      this.logger.error(`Asset acquisition failed: ${result.errorMessage}`);
      throw new Error(`Financial posting failed: ${result.errorMessage}`);
    }
  }

  /**
   * Transfers an asset between branches.
   */
  async transferAsset(asset: Asset, toBranchId: string): Promise<void> {
    this.logger.log(`Transferring Asset ${asset.id} to Branch ${toBranchId}`);
    
    asset.branchId = toBranchId;

    const postingRequest = {
        requestId: `ASSET-TRF-${asset.id}-${Date.now()}`,
        tenantId: asset.tenantId,
        companyId: asset.companyId,
        sourceModule: 'ASSET_MANAGEMENT',
        sourceEventId: `TRF-${asset.id}`,
        eventType: 'ASSET_TRANSFERRED',
        eventVersion: '1.0.0',
        schemaVersion: '2026-Q1',
        payload: {
          assetId: asset.id,
          fromBranchId: asset.branchId,
          toBranchId: toBranchId,
        },
        createdAt: new Date(),
    };

    await this.gateway.postEvent(postingRequest as any);
  }

  /**
   * Disposes of a percentage of an asset.
   */
  async partialDispose(asset: Asset, percentage: number): Promise<void> {
    this.logger.log(`Partial Disposal of Asset ${asset.id}: ${percentage}%`);

    const postingRequest = {
        requestId: `ASSET-PDISP-${asset.id}-${Date.now()}`,
        tenantId: asset.tenantId,
        companyId: asset.companyId,
        sourceModule: 'ASSET_MANAGEMENT',
        sourceEventId: `PDISP-${asset.id}`,
        eventType: 'ASSET_DISPOSED',
        eventVersion: '1.0.0',
        schemaVersion: '2026-Q1',
        payload: {
          assetId: asset.id,
          partialPercentage: percentage,
          fiscalPeriodId: '2026-03',
        },
        createdAt: new Date(),
    };

    await this.gateway.postEvent(postingRequest as any);
  }
}
