import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * Update Role DTO
 * Defines structure for updating role details and permissions
 */
export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  role_name?: string;

  @IsObject()
  @IsOptional()
  permissions?: Record<string, any>;
}
