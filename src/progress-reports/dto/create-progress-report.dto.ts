// src/progress-reports/dto/create-progress-report.dto.ts
import { IsInt, IsNotEmpty, IsOptional, IsString, IsEnum, Min, Max } from 'class-validator';
import { ProgressStatus } from '@prisma/client';

export class CreateProgressReportDto {
  @IsInt()
  @IsNotEmpty()
  project_id: number;

  @IsInt()
  @IsNotEmpty()
  stage_id: number;

  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsEnum(ProgressStatus)
  @IsOptional()
  status?: ProgressStatus;

  @IsString()
  @IsOptional()
  catatan?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  percentage?: number;
}