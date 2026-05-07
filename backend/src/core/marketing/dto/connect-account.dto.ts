import { IsArray, IsIn, IsNotEmpty, IsString } from "class-validator";

export type ConnectedProvider = "META" | "GOOGLE" | "TIKTOK" | "YOUTUBE" | "INSTAGRAM" | "FACEBOOK";

export class ConnectAccountDto {
  @IsString()
  @IsIn(["META", "GOOGLE", "TIKTOK", "YOUTUBE", "INSTAGRAM", "FACEBOOK"])
  provider: ConnectedProvider;

  @IsString()
  @IsNotEmpty()
  account_name: string;

  @IsArray()
  scopes: string[];

  @IsString()
  @IsNotEmpty()
  branch_id?: string;

  @IsString()
  @IsNotEmpty()
  ecommerce_id?: string;
}
