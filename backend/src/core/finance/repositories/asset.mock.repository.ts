import { Injectable } from '@nestjs/common';
import { IAssetRepository } from './interfaces/asset.repository.interface';
import { Asset } from '../domain/asset.interfaces';

@Injectable()
export class AssetMockRepository implements IAssetRepository {
  private assets: Asset[] = [];

  async findById(tenantId: string, companyId: string, id: string): Promise<Asset | null> {
    return this.assets.find(a => a.tenantId === tenantId && a.companyId === companyId && a.id === id) || null;
  }

  async findAll(tenantId: string, companyId: string): Promise<Asset[]> {
    return this.assets.filter(a => a.tenantId === tenantId && a.companyId === companyId);
  }

  async save(asset: Asset): Promise<Asset> {
    const index = this.assets.findIndex(a => a.id === asset.id);
    if (index >= 0) {
      this.assets[index] = asset;
    } else {
      this.assets.push(asset);
    }
    return asset;
  }

  async updateStatus(tenantId: string, companyId: string, id: string, status: any): Promise<void> {
    const asset = await this.findById(tenantId, companyId, id);
    if (asset) asset.status = status;
  }
}
