import { IsString, IsOptional, IsDateString, IsUrl, IsObject } from "class-validator";

export class UploadComplianceDocumentDto {
  @IsString()
  employeeId: string;

  @IsString()
  documentType: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsUrl()
  fileUrl: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
