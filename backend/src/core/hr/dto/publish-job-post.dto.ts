import { IsArray, IsString } from 'class-validator';

export class PublishJobPostDto {
  @IsArray()
  @IsString({ each: true })
  channels: string[];
}
