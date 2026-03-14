import { IsString, IsOptional, IsEmail, IsUrl, IsArray, IsObject } from "class-validator";

export class IngestTalentLeadDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUrl()
  @IsOptional()
  externalProfileUrl?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsArray()
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  source?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
