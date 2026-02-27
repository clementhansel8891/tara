import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum ProvisioningScope {
  QUOTE = "quote",
  INVOICE = "invoice",
  DELIVERY_PROOF = "delivery_proof",
  FULL_PORTAL = "full_portal",
}

export class CreateProvisioningRequestDto {
  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  supplierBranchId?: string;

  @IsEnum(ProvisioningScope)
  scope: ProvisioningScope;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  requestedBy?: string;
}
