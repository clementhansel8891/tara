import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { ISettingsRepository, OrgProfileDto, TenantPreferencesDto } from '../interfaces/settings.repository.interface';

@Injectable()
export class SettingsDbRepository implements ISettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(tenant_id: string): Promise<any> {
    const companyId = await this.resolveOrgCompanyId(tenant_id);
    if (!companyId) return null;
    return this.prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        code: true,
        country: true,
        currency: true,
        industry: true,
        created_at: true,
        updated_at: true,
      }
    });
  }

  /**
   * Resolve the organization's primary company id for a tenant.
   * Historically the code assumed company.id === tenant_id, but normally-onboarded
   * tenants have a company with a distinct uuid. Prefer the id==tenant_id record
   * (legacy convention) and fall back to the tenant's oldest company.
   */
  private async resolveOrgCompanyId(tenant_id: string): Promise<string | null> {
    const direct = await this.prisma.companies.findUnique({
      where: { id: tenant_id },
      select: { id: true },
    });
    if (direct) return direct.id;
    const primary = await this.prisma.companies.findFirst({
      where: { tenant_id },
      orderBy: { created_at: 'asc' },
      select: { id: true },
    });
    return primary?.id ?? null;
  }

  async updateProfile(tenant_id: string, data: OrgProfileDto): Promise<any> {
    const companyId = await this.resolveOrgCompanyId(tenant_id);
    if (!companyId) {
      throw new NotFoundException('Organization profile (company) not found for this tenant.');
    }
    const where: any = { id: companyId };
    if (data.last_updated_at) {
      where.updated_at = new Date(data.last_updated_at);
    }

    try {
      return await this.prisma.companies.update({
        where,
        data: {
          name: data.name,
          country: data.country,
          currency: data.currency,
          updated_at: new Date(),
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        // With a resolved company id, P2025 only occurs on a genuine optimistic-lock
        // mismatch (stale last_updated_at), not a missing record.
        throw new ConflictException('Settings were updated by another user. Please refresh and try again.');
      }
      throw error;
    }
  }

  async getPreferences(tenant_id: string): Promise<any> {
    return this.prisma.tenant_settings.findUnique({
      where: { tenant_id }
    });
  }

  async updatePreferences(tenant_id: string, data: TenantPreferencesDto): Promise<any> {
    const where: any = { tenant_id };
    if (data.last_updated_at) {
      where.updated_at = new Date(data.last_updated_at);
    }

    try {
      return await this.prisma.tenant_settings.upsert({
        where: { tenant_id },
        update: {
          procurement_mode: data.procurement_mode,
          updated_at: new Date(),
          // Concurrency check only works if we don't use upsert for pure updates,
          // but Prisma doesn't support 'where' outside of the primary key for updates in upsert.
          // For true optimistic locking, we should check it manually or use update if exists.
        },
        create: {
          id: `ts-${tenant_id.slice(0, 8)}`,
          tenant_id,
          procurement_mode: data.procurement_mode || 'DIRECT',
        }
      });
    } catch (error) {
      // Note: Upsert makes optimistic locking harder. In a real scenario, we'd check current version first.
      return this.prisma.tenant_settings.update({
        where,
        data: {
          procurement_mode: data.procurement_mode,
          updated_at: new Date(),
        }
      }).catch(() => {
        throw new ConflictException('Preferences were updated by another user.');
      });
    }
  }

  async getChildCompanies(tenant_id: string): Promise<any[]> {
    // Exclude the organization's own primary company so it isn't listed as a child.
    const orgCompanyId = await this.resolveOrgCompanyId(tenant_id);
    return this.prisma.companies.findMany({
      where: {
        tenant_id,
        NOT: {
          id: orgCompanyId ?? tenant_id,
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getMemberships(tenant_id: string): Promise<any[]> {
    return this.prisma.user_companies.findMany({
      where: { tenant_id },
      include: {
        users: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async getLocations(tenant_id: string): Promise<any[]> {
    return this.prisma.locations.findMany({
      where: {
        tenant_id,
        deleted_at: null,
      },
      orderBy: { name: 'asc' }
    });
  }

  async createLocation(tenant_id: string, data: any, user_id: string): Promise<any> {
    const code = data.code || `LOC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    return this.prisma.locations.create({
      data: {
        tenant_id,
        company_id: data.company_id || null,
        name: data.name,
        code,
        type: data.type || 'OFFICE',
        address: data.address,
        latitude: data.latitude ? parseFloat(data.latitude.toString()) : null,
        longitude: data.longitude ? parseFloat(data.longitude.toString()) : null,
        geofence_radius: data.geofence_radius ? parseFloat(data.geofence_radius.toString()) : 200,
        country: data.country || 'US',
        currency: data.currency || 'USD',
      }
    });
  }

  async createChildCompany(tenant_id: string, data: any, user_id: string): Promise<any> {
    const code = data.code || `CC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the child company
      const company = await tx.companies.create({
        data: {
          name: data.name,
          code,
          industry: data.industry || 'retail',
          country: data.country || 'US',
          currency: data.currency || 'USD',
          tenant_id, // Link to parent
        }
      });

      // 2. Create the Primary Location (HQ) for this company
      const primaryLoc = await tx.locations.create({
        data: {
          tenant_id,
          company_id: company.id,
          name: `${data.name} HQ`,
          code: `${code}-HQ`,
          type: 'HQ',
          address: data.address,
          latitude: data.latitude ? parseFloat(data.latitude.toString()) : null,
          longitude: data.longitude ? parseFloat(data.longitude.toString()) : null,
          geofence_radius: data.geofence_radius ? parseFloat(data.geofence_radius.toString()) : 200,
          country: data.country || 'US',
          currency: data.currency || 'USD',
        }
      });

      // 3. Update company with primary_location_id
      await tx.companies.update({
        where: { id: company.id },
        data: { primary_location_id: primaryLoc.id }
      });

      // 4. Link the creator as OWNER of the new child company
      await tx.user_companies.create({
        data: {
          user_id,
          tenant_id: company.id,
          role: 'OWNER',
          is_default: false
        }
      });

      return { ...company, primary_location: primaryLoc };
    });
  }
}
