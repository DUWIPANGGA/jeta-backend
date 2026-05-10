// src/progress-reports/dto/update-progress-report.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProgressReportDto } from './create-progress-report.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProgressReportDto extends PartialType(CreateProgressReportDto) {
  @IsBoolean()
  @IsOptional()
  approval_status?: boolean;
}