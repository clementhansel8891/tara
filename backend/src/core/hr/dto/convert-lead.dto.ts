import { IsString, IsNotEmpty } from 'class-validator';

export class ConvertLeadDto {
  @IsString()
  @IsNotEmpty()
  requisitionId: string;
}
