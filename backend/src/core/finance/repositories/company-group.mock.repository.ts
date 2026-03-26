import { Injectable } from '@nestjs/common';
import { CompanyGroup, CompanyGroupMember } from '../domain/finance.interfaces';

@Injectable()
export class CompanyGroupMockRepository {
  private groups: CompanyGroup[] = [];
  private members: CompanyGroupMember[] = [];

  async findById(id: string): Promise<CompanyGroup | null> {
    return this.groups.find(g => g.id === id) || null;
  }

  async findMembers(groupId: string): Promise<CompanyGroupMember[]> {
    return this.members.filter(m => m.companyGroupId === groupId);
  }

  async saveGroup(group: CompanyGroup): Promise<void> {
    this.groups.push(group);
  }

  async addMember(member: CompanyGroupMember): Promise<void> {
    this.members.push(member);
  }
}
