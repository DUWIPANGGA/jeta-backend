import { IsNotEmpty, IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { ProgressStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateProgressReportDto {
  @IsNotEmpty()
  @Type(() => Number)
  project_id: number;

  @IsNotEmpty()
  @Type(() => Number)
  custom_order_item_id: number;  // ← TAMBAH: wajib

  @IsNotEmpty()
  @Type(() => Number)
  stage_id: number;

  @IsEnum(ProgressStatus)
  @IsOptional()
  status?: ProgressStatus;

  @IsString()
  @IsOptional()
  catatan?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}