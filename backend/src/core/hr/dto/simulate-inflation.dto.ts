import { IsNumber, Min, Max } from 'class-validator';

export class SimulateInflationDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  inflationRate: number;
}
