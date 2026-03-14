import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  requisitionId: string;

  @IsString()
  source: string;

  @IsString()
  @IsOptional()
  resumeUrl?: string;
}
