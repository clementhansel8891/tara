import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from './event-bus.service';
import { ConfigurationValidationService } from './configuration-validation.service';

/**
 * Supported system configuration categories.
 *
 * HR_Team can only create or modify settings that belong to one of these
 * categories. Any attempt to use a different category is rejected before the
 * change is applied (Requirement 15.7 / 15.8).
 */
export const SYSTEM_SETTING_CATEGORIES = [
  'attendance',
  'geo-fence',
  'leave_policy',
  'public_holidays',
  'notifications',
  'aws_integration',
] as const;

export type SystemSettingCategory = (typeof SYSTEM_SETTING_CATEGORIES)[number];

/**
 * Maps a setting category to the Event Bus event type emitted when a setting in
 * that category changes. Categories without a dedicated event fall back to the
 * generic `config.updated` event.
 */
const CATEGORY_EVENT_TYPE: Record<string, string> = {
  attendance: 'config.attendance_policy_updated',
  'geo-fence': 'config.geofence_updated',
  leave_policy: 'config.leave_policy_updated',
  public_holidays: 'config.public_holidays_updated',
  notifications: 'config.notifications_updated',
  aws_integration: 'config.aws_integration_updated',
};

export interface UpsertSettingInput {
  setting_key: string;
  setting_value: any;
  setting_category: string;
  description?: string;
  last_modified_by?: string;
}

export interface UpdateSettingInput {
  setting_value?: any;
  setting_category?: string;
  description?: string;
  last_modified_by?: string;
}

/**
 * SystemSettingsService for TARA HR System
 *
 * Provides CRUD operations over the SystemSettings table for system
 * configuration. Configuration is partitioned into a fixed set of categories
 * (attendance, geo-fence, leave_policy, public_holidays, notifications,
 * aws_integration). All write operations validate the change before applying it
 * and emit a configuration change event to the Event Bus so that downstream
 * consumers (agents, external systems) can react.
 *
 * Requirements: 15 (Agent Configuration and Management)
 * - 15.7: Validate all configuration changes before applying them
 * - 15.8: Reject invalid changes with a descriptive error message
 * Task: 20.1
 */
@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  private readonly configValidation: ConfigurationValidationService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {
    this.configValidation = new ConfigurationValidationService();
  }

  /**
   * Retrieve all system settings, optionally filtered by category.
   *
   * @param category - Optional category filter (must be a supported category)
   * @returns Array of system settings ordered by category then key
   */
  async get(category?: string): Promise<any[]> {
    if (category !== undefined) {
      this.assertValidCategory(category);
    }

    return this.prisma.systemSettings.findMany({
      where: category ? { setting_category: category } : undefined,
      orderBy: [{ setting_category: 'asc' }, { setting_key: 'asc' }],
    });
  }

  /**
   * Retrieve all settings belonging to a configuration category.
   *
   * @param category - One of the supported configuration categories
   * @returns Array of settings in the category
   * @throws BadRequestException if the category is not supported
   */
  async getByCategory(category: string): Promise<any[]> {
    this.assertValidCategory(category);

    return this.prisma.systemSettings.findMany({
      where: { setting_category: category },
      orderBy: { setting_key: 'asc' },
    });
  }

  /**
   * Retrieve a single setting by its unique key.
   *
   * @param settingKey - The unique setting key
   * @returns The matching setting
   * @throws NotFoundException if no setting exists for the key
   */
  async getByKey(settingKey: string): Promise<any> {
    if (!settingKey || !settingKey.trim()) {
      throw new BadRequestException('setting_key is required');
    }

    const setting = await this.prisma.systemSettings.findUnique({
      where: { setting_key: settingKey },
    });

    if (!setting) {
      throw new NotFoundException(
        `System setting with key '${settingKey}' not found`,
      );
    }

    return setting;
  }

  /**
   * Create a new setting or update an existing one (by setting_key).
   *
   * The change is validated before being applied and a configuration change
   * event is emitted to the Event Bus on success.
   *
   * @param input - The setting to create or update
   * @returns The created or updated setting
   * @throws BadRequestException if validation fails
   */
  async upsert(input: UpsertSettingInput): Promise<any> {
    this.validateUpsert(input);

    // Domain-specific validation (Task 20.5): geo-fence radius, working hours,
    // public holiday dates. Runs before persistence to reject invalid config
    // changes with descriptive errors (Requirement 15.7 / 15.8 / 8.8).
    this.configValidation.validate(
      input.setting_category,
      input.setting_key,
      input.setting_value,
    );

    const existing = await this.prisma.systemSettings.findUnique({
      where: { setting_key: input.setting_key },
    });

    const data = {
      setting_key: input.setting_key,
      setting_value: input.setting_value as any,
      setting_category: input.setting_category,
      description: input.description ?? null,
      last_modified_by: input.last_modified_by ?? null,
      updated_at: new Date(),
    };

    const setting = await this.prisma.systemSettings.upsert({
      where: { setting_key: input.setting_key },
      create: data,
      update: {
        setting_value: data.setting_value,
        setting_category: data.setting_category,
        description: data.description,
        last_modified_by: data.last_modified_by,
        updated_at: data.updated_at,
      },
    });

    await this.emitConfigChange(
      setting,
      existing ? 'updated' : 'created',
      existing?.setting_value,
    );

    this.logger.log(
      `System setting '${setting.setting_key}' (${setting.setting_category}) ${existing ? 'updated' : 'created'}`,
    );

    return setting;
  }

  /**
   * Update an existing setting by key. Only the provided fields are changed.
   *
   * The change is validated before being applied and a configuration change
   * event is emitted to the Event Bus on success.
   *
   * @param settingKey - The unique key of the setting to update
   * @param input - The fields to update
   * @returns The updated setting
   * @throws NotFoundException if the setting does not exist
   * @throws BadRequestException if validation fails
   */
  async update(settingKey: string, input: UpdateSettingInput): Promise<any> {
    const existing = await this.getByKey(settingKey);

    this.validateUpdate(input);

    // Domain-specific validation (Task 20.5) on the new value in the context
    // of its existing category.
    if (input.setting_value !== undefined) {
      const category = input.setting_category ?? existing.setting_category;
      this.configValidation.validate(category, settingKey, input.setting_value);
    }

    const setting = await this.prisma.systemSettings.update({
      where: { setting_key: settingKey },
      data: {
        ...(input.setting_value !== undefined
          ? { setting_value: input.setting_value as any }
          : {}),
        ...(input.setting_category !== undefined
          ? { setting_category: input.setting_category }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.last_modified_by !== undefined
          ? { last_modified_by: input.last_modified_by }
          : {}),
        updated_at: new Date(),
      },
    });

    await this.emitConfigChange(setting, 'updated', existing.setting_value);

    this.logger.log(
      `System setting '${setting.setting_key}' (${setting.setting_category}) updated`,
    );

    return setting;
  }

  /**
   * Delete a setting by key and emit a configuration change event.
   *
   * @param settingKey - The unique key of the setting to delete
   * @returns The deleted setting
   * @throws NotFoundException if the setting does not exist
   */
  async delete(settingKey: string): Promise<any> {
    const existing = await this.getByKey(settingKey);

    const setting = await this.prisma.systemSettings.delete({
      where: { setting_key: settingKey },
    });

    await this.emitConfigChange(setting, 'deleted', existing.setting_value);

    this.logger.log(
      `System setting '${setting.setting_key}' (${setting.setting_category}) deleted`,
    );

    return setting;
  }

  /**
   * Validate a create/upsert payload before applying it.
   * Requirement 15.7 / 15.8.
   */
  private validateUpsert(input: UpsertSettingInput): void {
    if (!input) {
      throw new BadRequestException('Setting payload is required');
    }

    if (!input.setting_key || !input.setting_key.trim()) {
      throw new BadRequestException('setting_key is required');
    }

    this.assertValidCategory(input.setting_category);
    this.assertValidValue(input.setting_value);
  }

  /**
   * Validate an update payload before applying it.
   * Requirement 15.7 / 15.8.
   */
  private validateUpdate(input: UpdateSettingInput): void {
    if (!input || Object.keys(input).length === 0) {
      throw new BadRequestException('No update fields provided');
    }

    if (input.setting_category !== undefined) {
      this.assertValidCategory(input.setting_category);
    }

    if (input.setting_value !== undefined) {
      this.assertValidValue(input.setting_value);
    }
  }

  /**
   * Ensure the supplied category is one of the supported configuration
   * categories. Rejects the change with a descriptive error otherwise.
   */
  private assertValidCategory(category: string): void {
    if (
      !category ||
      !SYSTEM_SETTING_CATEGORIES.includes(category as SystemSettingCategory)
    ) {
      throw new BadRequestException(
        `Invalid setting_category '${category}'. Supported categories: ${SYSTEM_SETTING_CATEGORIES.join(', ')}`,
      );
    }
  }

  /**
   * Ensure the supplied setting value is a defined, JSON-serialisable value.
   */
  private assertValidValue(value: any): void {
    if (value === undefined || value === null) {
      throw new BadRequestException('setting_value is required');
    }

    try {
      JSON.stringify(value);
    } catch {
      throw new BadRequestException(
        'setting_value must be a JSON-serialisable value',
      );
    }
  }

  /**
   * Emit a configuration change event to the Event Bus. Failures are logged but
   * never propagated so that a transient Event Bus issue does not roll back a
   * successfully persisted configuration change.
   */
  private async emitConfigChange(
    setting: any,
    operation: 'created' | 'updated' | 'deleted',
    previousValue?: any,
  ): Promise<void> {
    const eventType =
      CATEGORY_EVENT_TYPE[setting.setting_category] ?? 'config.updated';

    try {
      await this.eventBus.emit({
        event_type: eventType,
        actor: {
          id: setting.last_modified_by || 'system',
          type: setting.last_modified_by ? 'employee' : 'system',
        },
        entity: {
          id: setting.setting_key,
          type: 'system_setting',
        },
        payload: {
          operation,
          setting_key: setting.setting_key,
          setting_category: setting.setting_category,
          setting_value: operation === 'deleted' ? null : setting.setting_value,
          previous_value: previousValue ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit config change event for '${setting.setting_key}': ${error.message}`,
        error.stack,
      );
    }
  }
}
