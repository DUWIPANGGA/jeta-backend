import { IsInt, IsNotEmpty, Min, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AcceptCustomOrderDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  total_amount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  dp_amount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  remaining_amount?: number;
}