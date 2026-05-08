// create-custom-order.dto.ts
import {
    IsString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
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
}