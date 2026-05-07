import {
    IsString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    MaxLength,
    Matches,
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

    // Tiga field finansial – String opsional, hanya berisi digit
    @IsString()
    @IsOptional()
    @Matches(/^\d*$/, { message: 'dp_amount must be a numeric string or empty' })
    dp_amount?: string;

    @IsString()
    @IsOptional()
    @Matches(/^\d*$/, { message: 'remaining_amount must be a numeric string or empty' })
    remaining_amount?: string;

    @IsString()
    @IsOptional()
    @Matches(/^\d*$/, { message: 'total_amount must be a numeric string or empty' })
    total_amount?: string;

    @IsInt()
    @IsOptional()
    payment_id?: number;

    @IsBoolean()
    @IsOptional()
    accept_status?: boolean;
}