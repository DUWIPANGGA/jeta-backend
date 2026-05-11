import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ProgressStatus } from '@prisma/client';

export class CreateProgressReportDto {
  @IsNotEmpty()
  project_id: any;

  @IsNotEmpty()
  stage_id: any;

  @IsEnum(ProgressStatus)
  @IsOptional()
  status?: ProgressStatus;

  @IsString()
  @IsOptional()
  catatan?: string;

  @IsOptional()
  quantity?: any;

  // TAMBAHKAN field image opsional (hanya untuk menghindari error validasi, tidak akan tersimpan)
  @IsOptional()
  image?: any;
}