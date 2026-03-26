import { IsNumber, IsDateString, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { FiscalPeriodStatus } from '../domain/finance.constants';

export class CreateFiscalYearDto {
  @IsNumber()
  year: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class UpdateFiscalPeriodDto {
  @IsEnum(FiscalPeriodStatus)
  status: FiscalPeriodStatus;
}
