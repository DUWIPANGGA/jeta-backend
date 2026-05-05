import { IsString, IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class CreatePaymentMethodDto {
    @IsString()
    bank_code: string;

    @IsString()
    bank_name: string;

    @IsString()
    bank_account: string;

    @IsString()
    owner_name: string;

    @IsEnum(PaymentType)
    type: PaymentType;

    @IsBoolean()
    @IsOptional()
    status_method?: boolean;

    @IsInt()
    @IsOptional()
    expired_duration_minutes?: number;
}