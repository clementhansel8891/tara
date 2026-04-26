import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { ICompanyGroupRepository } from './interfaces/company-group.repository.interface';
import { CompanyGroup, CompanyGroupMember } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CompanyGroupDbRepository implements ICompanyGroupRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async findById(tenant_id: string, id: string): Promise<CompanyGroup | null> {
    const raw = await this.db.finance_company_groups.findUnique({
      where: { id },
      include: { companies: true }
    });
    if (!raw || raw.tenant_id !== tenant_id) return null;
    return this.mapEntity(raw);
  }

  async findByName(tenant_id: string, name: string): Promise<CompanyGroup | null> {
    const raw = await this.db.finance_company_groups.findFirst({
      where: { tenant_id, name },
      include: { companies: true }
    });
    if (!raw) return null;
    return this.mapEntity(raw);
  }

  async listGroups(tenant_id: string): Promise<CompanyGroup[]> {
    const raws = await this.db.finance_company_groups.findMany({
      where: { tenant_id },
      include: { companies: true }
    });
    return raws.map(r => this.mapEntity(r));
  }

  async createGroup(tenant_id: string, data: Partial<CompanyGroup>): Promise<CompanyGroup> {
    const id = uuid();
    const saved = await this.db.finance_company_groups.create({
      data: {
        id,
        tenant_id,
        name: data.name!,
        description: data.description,
        metadata: (data.metadata as Prisma.InputJsonValue) || {},
      }
    });
    return this.mapEntity(saved);
  }

  async addMember(groupId: string, company_id: string, ownershipPercentage: number): Promise<CompanyGroupMember> {
    // This is a many-to-many relation in Prisma. 
    // We update the group to include the company.
    await this.db.finance_company_groups.update({
      where: { id: groupId },
      data: {
        companies: {
          connect: { id: company_id }
        }
      }
    });

    return {
      id: uuid(),
      groupId,
      company_id,
      ownershipPercentage,
      joinedAt: new Date(),
    };
  }

  async findMembers(groupId: string): Promise<CompanyGroupMember[]> {
    const raw = await this.db.finance_company_groups.findUnique({
      where: { id: groupId },
      include: { companies: true }
    });
    if (!raw) return [];
    return (raw.companies || []).map((c: any) => ({
      id: uuid(),
      groupId,
      company_id: c.id,
      ownershipPercentage: 100,
      joinedAt: raw.created_at,
    }));
  }

  async findGroupsByCompany(company_id: string): Promise<CompanyGroupMember[]> {
    const groups = await this.db.finance_company_groups.findMany({
      where: {
        companies: {
          some: { id: company_id }
        }
      }
    });
    return groups.map(g => ({
      id: uuid(),
      groupId: g.id,
      company_id,
      ownershipPercentage: 100,
      joinedAt: g.created_at,
    }));
  }

  async findSubGroups(parentGroupId: string): Promise<CompanyGroup[]> {
    // Currently no parent-child group structure in schema, return empty
    return [];
  }

  private mapEntity(raw: any): CompanyGroup {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      name: raw.name,
      description: raw.description,
      metadata: raw.metadata as Record<string, any>,
      members: (raw.companies || []).map((c: any) => ({
        id: uuid(),
        groupId: raw.id,
        company_id: c.id,
        ownershipPercentage: 100,
        joinedAt: raw.created_at,
      })),
    };
  }
}
