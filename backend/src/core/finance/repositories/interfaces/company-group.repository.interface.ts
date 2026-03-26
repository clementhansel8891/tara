import { CompanyGroup, CompanyGroupMember } from '../../domain/finance.interfaces';

export interface ICompanyGroupRepository {
  findById(tenantId: string, id: string): Promise<CompanyGroup | null>;
  findByName(tenantId: string, name: string): Promise<CompanyGroup | null>;
  listGroups(tenantId: string): Promise<CompanyGroup[]>;
  createGroup(tenantId: string, data: Partial<CompanyGroup>): Promise<CompanyGroup>;
  
  addMember(groupId: string, companyId: string, ownershipPercentage: number): Promise<CompanyGroupMember>;
  findMembers(groupId: string): Promise<CompanyGroupMember[]>;
  findGroupsByCompany(companyId: string): Promise<CompanyGroupMember[]>;
  findSubGroups(parentGroupId: string): Promise<CompanyGroup[]>;
}
