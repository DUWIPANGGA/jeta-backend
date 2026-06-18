import { IsArray, IsEnum, IsInt, IsOptional, IsString, ArrayMinSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SalaryPeriodType } from '@prisma/client';

export class ProcessSalaryDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    @Transform(({ value }) => {
        if (Array.isArray(value)) {
            return value.map(v => Number(v));
        }
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.map(v => Number(v));
                }
            } catch (e) {
                if (value.includes(',')) {
                    return value.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
                }
            }
            const parsedSingle = parseInt(value, 10);
            if (!isNaN(parsedSingle)) {
                return [parsedSingle];
            }
        }
        if (typeof value === 'number') {
            return [value];
        }
        return [];
    })
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