import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomOrderDto } from './create-custom-order.dto';
import { IsBoolean, IsOptional, IsInt, Min, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCustomOrderDto extends PartialType(CreateCustomOrderDto) {
    @IsBoolean()
    @IsOptional()
    accept_status?: boolean;

    // Field finansial (hanya admin)
    @IsString()
    @IsOptional()
    @Matches(/^\d*$/, { message: 'dp_amount must be a numeric string' })
    dp_amount?: string;

    @IsString()
    @IsOptional()
    @Matches(/^\d*$/, { message: 'remaining_amount must be a numeric string' })
    remaining_amount?: string;

    @IsString()
    @IsOptional()
    @Matches(/^\d*$/, { message: 'total_amount must be a numeric string' })
    total_amount?: string;

    @IsInt()
    @IsOptional()
    payment_id?: number;

    // Field umum (user biasa)
    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    catatan_tambahan?: string;

    @IsString()
    @IsOptional()
    upload_referensi?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    jenis_produk?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    jumlah?: number;

    @Type(() => Date)
    @IsOptional()
    deadline?: Date;
}