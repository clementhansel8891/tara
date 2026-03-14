import { IsString, IsIn } from 'class-validator';

export class GenerateDescriptionDto {
  @IsString()
  @IsIn(['PROFESSIONAL', 'MODERN', 'AGGRESSIVE'])
  tone: 'PROFESSIONAL' | 'MODERN' | 'AGGRESSIVE';
}
