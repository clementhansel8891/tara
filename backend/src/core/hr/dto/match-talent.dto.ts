import { IsArray, IsString, IsOptional, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class MatchTalentDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  skillIds: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  minProficiency?: number;
}
