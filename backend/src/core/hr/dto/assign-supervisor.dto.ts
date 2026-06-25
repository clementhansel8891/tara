import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

/**
 * Assign Supervisor DTO
 * Defines structure for assigning a supervisor to an employee
 */
export class AssignSupervisorDto {
  @IsString()
  @IsNotEmpty()
  supervisor_id: string;
}

/**
 * Bulk Assign Supervisor DTO
 * Defines structure for assigning a supervisor to multiple employees
 */
export class BulkAssignSupervisorDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  employee_ids: string[];

  @IsString()
  @IsNotEmpty()
  supervisor_id: string;
}
