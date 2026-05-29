import { Expose, Type } from 'class-transformer';
import { SalaryPeriodType } from '@prisma/client';

export class WorkLogDetailDto {
    @Expose()
    date: Date;

    @Expose()
    quantity: number;

    @Expose()
    amount: number;

    @Expose()
    stage_name?: string;

    @Expose()
    project_name?: string;
}

export class StaffSalaryPreviewDto {
    @Expose()
    staff_id: number;

    @Expose()
    name: string;

    @Expose()
    email: string;

    @Expose()
    base_salary: number;

    @Expose()
    total_quantity: number;

    @Expose()
    total_salary: number;

    @Expose()
    rate_per_unit: number;

    @Expose()
    already_paid: boolean;

    @Expose()
    @Type(() => WorkLogDetailDto)
    work_logs: WorkLogDetailDto[];
}

export class PeriodInfoDto {
    @Expose()
    type: SalaryPeriodType;

    @Expose()
    start_date: Date;

    @Expose()
    end_date: Date;

    @Expose()
    label: string;  // contoh: "Mei 2026" atau "Minggu ke-2 2026"
}

export class SalaryPreviewSummaryDto {
    @Expose()
    total_staff: number;

    @Expose()
    total_quantity: number;

    @Expose()
    total_salary: number;
}

export class SalaryPreviewResponseDto {
    @Expose()
    @Type(() => PeriodInfoDto)
    period: PeriodInfoDto;

    @Expose()
    @Type(() => SalaryPreviewSummaryDto)
    summary: SalaryPreviewSummaryDto;

    @Expose()
    @Type(() => StaffSalaryPreviewDto)
    staff_salaries: StaffSalaryPreviewDto[];
}