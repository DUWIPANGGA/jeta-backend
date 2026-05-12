// src/progress-reports/dto/create-progress-report.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ProgressStatus } from '@prisma/client';

export class CreateProgressReportDto {
  @IsNotEmpty()
  project_id: string;

  @IsNotEmpty()
  stage_id: string;

  @IsEnum(ProgressStatus)
  @IsOptional()
  status?: ProgressStatus;

  @IsString()
  @IsOptional()
  catatan?: string;

  @IsOptional()
  quantity?: any;

  @IsString()
  @IsOptional()
  image?: string; // ← opsional, agar tidak ditolak validation pipe
}