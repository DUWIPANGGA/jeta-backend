import { IsOptional, IsString, IsEnum } from 'class-validator';
import { SalaryPeriodType } from '@prisma/client';

export class WeeklyTutupBukuQueryDto {
    @IsOptional()
    @IsEnum(SalaryPeriodType)
    period_type?: SalaryPeriodType; // 'daily' | 'weekly' | 'monthly'

    @IsOptional()
    @IsString()
    start_date?: string; // Format YYYY-MM-DD

    @IsOptional()
    @IsString()
    end_date?: string; // Format YYYY-MM-DD
}
