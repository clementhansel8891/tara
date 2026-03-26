import { Asset } from '../../domain/asset.interfaces';

export interface IAssetRepository {
  findById(tenantId: string, companyId: string, id: string): Promise<Asset | null>;
  findAll(tenantId: string, companyId: string): Promise<Asset[]>;
  save(asset: Asset): Promise<Asset>;
  updateStatus(tenantId: string, companyId: string, id: string, status: string): Promise<void>;
}
