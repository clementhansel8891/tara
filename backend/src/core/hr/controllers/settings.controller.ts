import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { SystemSettingsService } from '../services/system-settings.service';
import { AgentConfigService } from '../services/agent-config.service';
import {
  TaraJwtAuthGuard,
} from '../../auth/guards/tara-jwt-auth.guard';
import { TaraRoleGuard, Roles } from '../../auth/guards/tara-role.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TaraAuthPayload } from '../../auth/tara-auth.service';
import {
  UpdateAgentSettingDto,
  UpsertCategorySettingDto,
  UpdateAgentHealthDto,
} from '../dto/settings.dto';

/**
 * Maps the public Settings Page URL slug to the internal SystemSettings
 * category. The slugs follow the API contract in the design document /
 * task 20.3, while the categories match SYSTEM_SETTING_CATEGORIES.
 */
const SETTINGS_CATEGORY_BY_SLUG: Record<string, string> = {
  attendance: 'attendance',
  geofence: 'geo-fence',
  leaves: 'leave_policy',
  'public-holidays': 'public_holidays',
  notifications: 'notifications',
  'aws-devices': 'aws_integration',
};

const SUPPORTED_SLUGS = Object.keys(SETTINGS_CATEGORY_BY_SLUG);

/**
 * SettingsController for TARA HR System
 *
 * Exposes the Settings Page REST API used by HR_Team to manage system
 * configuration and the 7 autonomous agents. All endpoints are restricted to
 * the HR_Team role (Requirement 25.1 / 25.20); the Mobile interface never
 * surfaces these routes (Requirement 25.2).
 *
 * Agent management (Requirement 25.3, 25.4, 25.5):
 *   - GET    /api/settings/agents                    list agent configs + status
 *   - GET    /api/settings/agents/:agentName         single agent config
 *   - GET    /api/settings/agents/:agentName/health  single agent health view
 *   - PUT    /api/settings/agents/:agentName         enable/disable + configuration
 *   - PUT    /api/settings/agents/:agentName/health  set health status
 *
 * Category configuration (Requirement 25.6-25.15):
 *   - GET    /api/settings/:category                 list settings in a category
 *   - GET    /api/settings/:category/:key            single setting by key
 *   - PUT    /api/settings/:category                 create/update a setting
 *
 * Supported category slugs: attendance, geofence, leaves, public-holidays,
 * notifications, aws-devices.
 *
 * Task: 20.3
 */
@Controller('api/settings')
@UseGuards(TaraJwtAuthGuard, TaraRoleGuard)
@Roles('HR_Team')
export class SettingsController {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
    private readonly agentConfigService: AgentConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Agent connection management (Requirement 25.3, 25.4, 25.5)
  // ---------------------------------------------------------------------------

  /**
   * List the configuration and real-time status of all 7 autonomous agents.
   * Requirement 25.3.
   */
  @Get('agents')
  async getAgents() {
    const data = await this.agentConfigService.listAgentConfigs();
    return { data, count: data.length };
  }

  /**
   * Get a single agent's configuration.
   */
  @Get('agents/:agentName')
  async getAgent(@Param('agentName') agentName: string) {
    return this.agentConfigService.getAgentConfig(agentName);
  }

  /**
   * Get a compact health view for a single agent.
   * Requirement 25.5.
   */
  @Get('agents/:agentName/health')
  async getAgentHealth(@Param('agentName') agentName: string) {
    return this.agentConfigService.getAgentHealth(agentName);
  }

  /**
   * Update an agent: enable/disable it and/or replace its configuration.
   * Requirement 25.4 (enable/disable), 25.16/25.18 (validate + emit event).
   *
   * At least one of `is_enabled` or `configuration` must be provided.
   */
  @Put('agents/:agentName')
  @HttpCode(HttpStatus.OK)
  async updateAgent(
    @Param('agentName') agentName: string,
    @Body() dto: UpdateAgentSettingDto,
    @CurrentUser() user: TaraAuthPayload,
  ) {
    if (dto.is_enabled === undefined && dto.configuration === undefined) {
      throw new BadRequestException(
        'At least one of is_enabled or configuration must be provided',
      );
    }

    const actorId = user?.sub ?? 'system';
    let result;

    if (dto.is_enabled !== undefined) {
      result = await this.agentConfigService.setAgentEnabled(
        agentName,
        dto.is_enabled,
        actorId,
      );
    }

    if (dto.configuration !== undefined) {
      result = await this.agentConfigService.updateAgentConfiguration(
        agentName,
        dto.configuration,
        actorId,
      );
    }

    return result;
  }

  /**
   * Set an agent's health status and optional error message.
   * Requirement 25.5 (surface enabled/disabled/error states).
   */
  @Put('agents/:agentName/health')
  @HttpCode(HttpStatus.OK)
  async setAgentHealth(
    @Param('agentName') agentName: string,
    @Body() dto: UpdateAgentHealthDto,
    @CurrentUser() user: TaraAuthPayload,
  ) {
    return this.agentConfigService.setHealthStatus(
      agentName,
      dto.health_status,
      dto.error_message,
      user?.sub ?? 'system',
    );
  }

  // ---------------------------------------------------------------------------
  // Category configuration (Requirement 25.6 - 25.15)
  // ---------------------------------------------------------------------------

  /**
   * List all settings belonging to a configuration category.
   * Covers attendance, geo-fence, leave policy, public holidays, notifications
   * and AWS device categories (Requirement 25.6-25.15).
   */
  @Get(':category')
  async getCategorySettings(@Param('category') category: string) {
    const internalCategory = this.resolveCategory(category);
    const data = await this.systemSettingsService.getByCategory(
      internalCategory,
    );
    return { category, data, count: data.length };
  }

  /**
   * Get a single setting by key within a category.
   */
  @Get(':category/:key')
  async getCategorySetting(
    @Param('category') category: string,
    @Param('key') key: string,
  ) {
    // Validate the slug even though lookup is by key, so unknown categories
    // produce a descriptive error.
    const internalCategory = this.resolveCategory(category);
    const setting = await this.systemSettingsService.getByKey(key);

    if (setting.setting_category !== internalCategory) {
      throw new BadRequestException(
        `Setting '${key}' does not belong to category '${category}'`,
      );
    }

    return setting;
  }

  /**
   * Create or update a setting within a category. The category is taken from
   * the route; the body supplies the key, value and optional description.
   * Requirement 25.16 (validate before applying) / 25.18 (emit event) are
   * handled by SystemSettingsService.
   */
  @Put(':category')
  @HttpCode(HttpStatus.OK)
  async upsertCategorySetting(
    @Param('category') category: string,
    @Body() dto: UpsertCategorySettingDto,
    @CurrentUser() user: TaraAuthPayload,
  ) {
    const internalCategory = this.resolveCategory(category);

    return this.systemSettingsService.upsert({
      setting_key: dto.setting_key,
      setting_value: dto.setting_value,
      setting_category: internalCategory,
      description: dto.description,
      last_modified_by: user?.sub ?? 'system',
    });
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Resolve a public URL slug to an internal SystemSettings category.
   * @throws BadRequestException for unsupported slugs.
   */
  private resolveCategory(slug: string): string {
    const category = SETTINGS_CATEGORY_BY_SLUG[slug];
    if (!category) {
      throw new BadRequestException(
        `Unknown settings category '${slug}'. Supported categories: ${SUPPORTED_SLUGS.join(
          ', ',
        )}`,
      );
    }
    return category;
  }
}
