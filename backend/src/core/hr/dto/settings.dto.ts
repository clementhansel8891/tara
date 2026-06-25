import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsIn,
  ValidateIf,
} from 'class-validator';

/**
 * DTOs for the Settings Page backend endpoints.
 *
 * Task 20.3: Settings Page backend endpoints (HR_Team only)
 * Requirements: 25.1, 25.2, 25.6-25.15, 25.20
 */

/**
 * Body for updating an agent's configuration via
 * `PUT /api/settings/agents/:agentName`.
 *
 * At least one of `is_enabled` or `configuration` must be supplied.
 */
export class UpdateAgentSettingDto {
  /** Enable (true) or disable (false) the agent. Requirement 25.4. */
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;

  /** Agent-specific configuration persisted as JSONB. */
  @IsOptional()
  @IsObject({ message: 'configuration must be a JSON object' })
  configuration?: Record<string, any>;
}

/**
 * Body for creating/updating a single system setting within a category via
 * `PUT /api/settings/:category`.
 *
 * The category is taken from the route, so the body only carries the key,
 * value, and an optional human-readable description.
 */
export class UpsertCategorySettingDto {
  /** Unique key identifying the setting (e.g. `working_hours`). */
  @IsString()
  @IsNotEmpty()
  setting_key: string;

  /** The setting value. Any JSON-serialisable value is accepted. */
  @ValidateIf((o) => o.setting_value === undefined)
  @IsNotEmpty({ message: 'setting_value is required' })
  setting_value: any;

  /** Optional description shown in the Settings Page. */
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Body for updating an agent's health status (used by monitoring tooling).
 */
export class UpdateAgentHealthDto {
  @IsString()
  @IsIn(['healthy', 'degraded', 'down', 'unknown'])
  health_status: string;

  @IsOptional()
  @IsString()
  error_message?: string;
}
