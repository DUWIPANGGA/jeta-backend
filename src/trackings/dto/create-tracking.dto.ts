import { IsInt, IsString, IsOptional, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTrackingDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  order_id?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  custom_order_id?: number;

  @IsString()
  current_stage: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progress_percentage: number;

  @IsDateString()
  estimated_completion: string;
}