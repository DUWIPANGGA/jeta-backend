import { IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SalaryPeriodType } from '@prisma/client';

export class CalculateSalaryDto {
    @IsEnum(SalaryPeriodType)
    period_type: SalaryPeriodType;  // daily, weekly, monthly

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    year?: number;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Max(12)
    @Type(() => Number)
    month?: number;
}