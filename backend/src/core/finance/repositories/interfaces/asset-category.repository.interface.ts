import { AssetCategory } from '../../domain/asset.interfaces';

export interface IAssetCategoryRepository {
  findById(tenantId: string, companyId: string, id: string): Promise<AssetCategory | null>;
  findAll(tenantId: string, companyId: string): Promise<AssetCategory[]>;
  save(category: AssetCategory): Promise<AssetCategory>;
}
