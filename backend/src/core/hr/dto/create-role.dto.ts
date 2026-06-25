import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

/**
 * Create Role DTO
 * Defines structure for creating a new role with permissions
 */
export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  role_name: string;

  @IsObject()
  @IsOptional()
  permissions?: Record<string, any>;
}
