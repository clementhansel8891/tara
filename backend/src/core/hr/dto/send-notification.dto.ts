import { IsString, IsEnum, IsOptional, IsNotEmpty, IsArray, IsUUID } from 'class-validator';

/**
 * DTO for sending a single notification
 * Task 13.1: NotificationService
 */
export class SendNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  recipient_id: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsEnum(['private', 'public'], {
    message: "visibility must be either 'private' or 'public'",
  })
  visibility: 'private' | 'public';

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  metadata?: any;
}

/**
 * DTO for sending bulk notifications
 */
export class SendBulkNotificationDto {
  @IsArray()
  @IsUUID('4', { each: true })
  recipient_ids: string[];

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsEnum(['private', 'public'], {
    message: "visibility must be either 'private' or 'public'",
  })
  visibility: 'private' | 'public';

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  metadata?: any;
}

/**
 * DTO for sending public announcements
 */
export class SendPublicAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  exclude_ids?: string[];
}
