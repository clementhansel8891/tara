import { IsString, IsOptional, IsEnum, IsBoolean, IsDate, IsArray, IsJSON } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateIncentivePlanDto } from './create-plan.dto';

export class UpdateIncentivePlanDto extends PartialType(CreateIncentivePlanDto) {}
