import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CreateMentorshipDto {
  @IsString()
  @IsNotEmpty()
  mentorId: string;

  @IsString()
  @IsNotEmpty()
  menteeId: string;

  @IsArray()
  @IsString({ each: true })
  focusSkills: string[];
}
