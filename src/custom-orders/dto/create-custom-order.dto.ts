import {
    IsInt,
    IsString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    Min,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

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

    @Type(() => Date)
    @IsNotEmpty()
    deadline: Date;

    @IsString()
    @IsNotEmpty()
    upload_referensi: string;

    @IsString()
    @IsOptional()
    catatan_tambahan?: string;

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
    total_amount?: number;        // ← tambahkan

    @IsInt()
    @IsOptional()
    payment_id?: number;

    @IsBoolean()
    @IsOptional()
    accept_status?: boolean;
}