import { Expose, Type } from 'class-transformer';

class SalaryPaymentResultDto {
    @Expose()
    staff_id: number;

    @Expose()
    staff_name: string;

    @Expose()
    status: string;

    @Expose()
    message?: string;

    @Expose()
    payment_id?: number;

    @Expose()
    total_amount?: number;

    @Expose()
    period_start?: Date;

    @Expose()
    period_end?: Date;
}

export class SalaryPaymentResponseDto {
    @Expose()
    message: string;

    @Expose()
    @Type(() => SalaryPaymentResultDto)
    results: SalaryPaymentResultDto[];
}