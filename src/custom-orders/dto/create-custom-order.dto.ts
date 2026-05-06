// src/custom-orders/dto/create-custom-order.dto.ts
import {
    IsInt,
    IsString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsDateString,
    Min,
    MaxLength
} from 'class-validator';

export class CreateCustomOrderDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    phone: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    jenis_produk: string;

    @IsInt()
    @IsNotEmpty()
    @Min(1)
    jumlah: number;

    @IsDateString()
    @IsNotEmpty()
    deadline: Date;  // Input manual dari user

    @IsString()
    @IsNotEmpty()
    upload_referensi: string;

    @IsString()
    @IsOptional()
    catatan_tambahan: string;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    dp_amount: number;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    remaining_amount: number;

    @IsInt()
    @IsNotEmpty()
    payment_id: number;

    @IsBoolean()
    @IsOptional()
    accept_status?: boolean;
}