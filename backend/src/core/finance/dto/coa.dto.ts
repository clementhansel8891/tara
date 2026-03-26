import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { AccountType, NormalBalance } from '../domain/finance.constants';

export class CreateCOADto {
  @IsString()
  @IsNotEmpty()
  accountCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsEnum(NormalBalance)
  normalBalance: NormalBalance;

  @IsString()
  @IsOptional()
  parentAccountId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateCOADto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(AccountType)
  @IsOptional()
  accountType?: AccountType;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}
