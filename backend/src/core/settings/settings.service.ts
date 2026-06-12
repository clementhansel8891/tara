import { Injectable, Logger } from '@nestjs/common';
import { SettingsDbRepository } from './repositories/settings.db.repository';
import { AuditService } from '../../shared/audit/audit.service';
import { OrgProfileDto, TenantPreferencesDto } from './interfaces/settings.repository.interface';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly repository: SettingsDbRepository,
    private readonly audit: AuditService,
  ) {}

  async getProfile(tenant_id: string) {
    return this.repository.getProfile(tenant_id);
  }

  async updateProfile(tenant_id: string, data: OrgProfileDto, user_id: string) {
    const before = await this.repository.getProfile(tenant_id);
    const result = await this.repository.updateProfile(tenant_id, data);
    
    // Audit Logging
    await this.audit.log({
      tenant_id,
      user_id,
      module: 'CORE',
      action: 'UPDATE_ORG_PROFILE',
      entity_type: 'COMPANY',
      entity_id: tenant_id,
      changes: data,
      before_state: before,
      after_state: result,
      severity: 'CRITICAL',
    });

    return result;
  }

  async getPreferences(tenant_id: string) {
    return this.repository.getPreferences(tenant_id);
  }

  async updatePreferences(tenant_id: string, data: TenantPreferencesDto, user_id: string) {
    const before = await this.repository.getPreferences(tenant_id);
    const result = await this.repository.updatePreferences(tenant_id, data);

    // Audit Logging
    await this.audit.log({
      tenant_id,
      user_id,
      module: 'CORE',
      action: 'UPDATE_TENANT_PREFERENCES',
      entity_type: 'TENANT_SETTING',
      entity_id: tenant_id,
      changes: data,
      before_state: before,
      after_state: result,
      severity: 'INFO',
    });

    return result;
  }

  async getChildCompanies(tenant_id: string) {
    return this.repository.getChildCompanies(tenant_id);
  }

  async getRoles(tenant_id: string) {
    const ROLE_DESCRIPTIONS: Record<string, string> = {
      SUPERADMIN: 'Global platform access across all tenants and system controls.',
      OWNER: 'Full access to this organization, including billing and security policies.',
      ADMIN: 'Manage operations, configuration, and team members within the organization.',
      MANAGER: 'Approvals, reporting, and supervision for an assigned scope.',
      MEMBER: 'Standard operational access to assigned modules.',
    };
    const PRIVILEGED = ['SUPERADMIN', 'OWNER', 'ADMIN', 'MANAGER'];

    const memberships = await this.repository.getMemberships(tenant_id);

    const byRole = new Map<string, { role: string; description: string; users: number; lastUpdated: Date }>();
    for (const m of memberships) {
      const role = m.role || 'MEMBER';
      const updated = m.updated_at ?? m.created_at;
      if (!byRole.has(role)) {
        byRole.set(role, {
          role,
          description: ROLE_DESCRIPTIONS[role] || 'Custom role.',
          users: 0,
          lastUpdated: updated,
        });
      }
      const entry = byRole.get(role)!;
      entry.users += 1;
      if (updated && updated > entry.lastUpdated) entry.lastUpdated = updated;
    }

    const roles = Array.from(byRole.values()).sort((a, b) => b.users - a.users);
    const members = memberships.map((m: any) => ({
      id: m.user_id,
      name: [m.users?.first_name, m.users?.last_name].filter(Boolean).join(' ') || m.users?.email || m.user_id,
      email: m.users?.email ?? null,
      role: m.role,
      joinedAt: m.created_at,
    }));

    return {
      roles,
      members,
      totalUsers: memberships.length,
      privilegedUsers: memberships.filter((m: any) => PRIVILEGED.includes(m.role)).length,
    };
  }

  async getLocations(tenant_id: string) {
    return this.repository.getLocations(tenant_id);
  }

  async createLocation(tenant_id: string, data: any, user_id: string) {
    this.logger.log(`Creating location for tenant: ${tenant_id}`);
    
    const result = await this.repository.createLocation(tenant_id, data, user_id);

    await this.audit.log({
      tenant_id,
      user_id,
      module: 'CORE',
      action: 'CREATE_LOCATION',
      entity_type: 'LOCATION',
      entity_id: result.id,
      metadata: { name: result.name, type: result.type },
      severity: 'INFO',
    });

    return result;
  }

  async createChildCompany(tenant_id: string, data: any, user_id: string) {
    this.logger.log(`Creating child company for parent tenant: ${tenant_id}`);
    
    const result = await this.repository.createChildCompany(tenant_id, data, user_id);

    await this.audit.log({
      tenant_id,
      user_id,
      module: 'CORE',
      action: 'CREATE_CHILD_COMPANY',
      entity_type: 'COMPANY',
      entity_id: result.id,
      metadata: { name: result.name, code: result.code },
      severity: 'CRITICAL',
    });

    return result;
  }
}
