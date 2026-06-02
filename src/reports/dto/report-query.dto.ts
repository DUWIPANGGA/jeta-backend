// src/reports/dto/report-query.dto.ts
import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum PeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
  ALL = 'all',
}

export class ReportQueryDto {
  @IsOptional()
  @IsEnum(PeriodType)
  periodType?: PeriodType = PeriodType.ALL;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
