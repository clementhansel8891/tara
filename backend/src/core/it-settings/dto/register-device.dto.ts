import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum DeviceType {
  POS = 'pos',
  BIOMETRIC = 'biometric',
  PRINTER = 'printer',
  SCANNER = 'scanner',
  TERMINAL = 'terminal',
}

export class RegisterDeviceDto {
  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  macAddress?: string;
}
