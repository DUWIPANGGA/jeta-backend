import { IsArray, IsEnum, IsInt, IsOptional, IsString, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { SalaryPeriodType } from '@prisma/client';

export class ProcessSalaryDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    @Type(() => Number)
    staff_ids: number[];

    @IsEnum(SalaryPeriodType)
    period_type: SalaryPeriodType;

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    year?: number;

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    month?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}