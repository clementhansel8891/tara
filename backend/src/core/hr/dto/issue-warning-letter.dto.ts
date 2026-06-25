import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
} from 'class-validator';

/**
 * Warning levels for TARA system
 * Requirement 11.6: Support multiple warning levels (SP1, SP2, SP3)
 */
export enum WarningLevelDto {
  SP1 = 'SP1',
  SP2 = 'SP2',
  SP3 = 'SP3',
}

/**
 * DTO for issuing a warning letter (Surat Peringatan)
 *
 * Validates all input fields with class-validator decorators
 * to ensure proper data before database operations.
 *
 * Requirements: 11.1, 11.5, 27.14
 */
export class IssueWarningLetterDto {
  @IsUUID('4', { message: 'employee_id must be a valid UUID' })
  @IsNotEmpty({ message: 'employee_id is required' })
  employee_id: string;

  @IsEnum(WarningLevelDto, {
    message: 'warning_level must be one of: SP1, SP2, SP3',
  })
  @IsNotEmpty({ message: 'warning_level is required' })
  warning_level: WarningLevelDto;

  @IsString()
  @IsNotEmpty({ message: 'reason is required' })
  reason: string;

  @IsUUID('4', { message: 'issued_by must be a valid UUID' })
  @IsNotEmpty({ message: 'issued_by is required' })
  issued_by: string;

  @IsString()
  @IsNotEmpty({ message: 'content is required' })
  content: string;
}
