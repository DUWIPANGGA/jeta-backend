import { PartialType } from '@nestjs/mapped-types';
import { CreateProgressReportDto } from './create-progress-report.dto';
import { IsBoolean, IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProgressReportDto extends PartialType(CreateProgressReportDto) {
  @IsBoolean()
  @IsOptional()
  approval_status?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity?: number;

  @IsString()
  @IsOptional()
  catatan?: string;
}