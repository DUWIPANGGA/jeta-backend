// src/work-logs/dto/create-work-log.dto.ts
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkLogDto {
  @IsString()
  @IsNotEmpty()
  order_type: string; // 'CUSTOM' or 'SPORT'

  @IsInt()
  @IsOptional()
  custom_order_id?: number;

  @IsInt()
  @IsOptional()
  sport_order_id?: number;

  @IsInt()
  @IsNotEmpty()
  stage_id: number;

  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsInt()
  @IsOptional()
  earned_amount?: number;
}