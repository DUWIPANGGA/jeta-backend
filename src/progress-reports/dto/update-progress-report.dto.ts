// src/progress-reports/dto/update-progress-report.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProgressReportDto } from './create-progress-report.dto';

export class UpdateProgressReportDto extends PartialType(CreateProgressReportDto) {}