import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomOrderDto } from './create-custom-order.dto';
import { IsBoolean, IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCustomOrderDto extends PartialType(CreateCustomOrderDto) {
    @IsBoolean()
    @IsOptional()
    accept_status?: boolean;

    // Field di bawah ini hanya boleh diupdate oleh admin
    @IsInt()
    @IsOptional()
    @Min(0)
    dp_amount?: number;

    @IsInt()
    @IsOptional()
    @Min(0)
    remaining_amount?: number;

    @IsInt()
    @IsOptional()
    @Min(0)
    total_amount?: number;

    @IsInt()
    @IsOptional()
    payment_id?: number;

    // User biasa hanya bisa update field ini
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