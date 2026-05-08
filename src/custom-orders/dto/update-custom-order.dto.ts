// update-custom-order.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomOrderDto } from './create-custom-order.dto';
import { IsBoolean, IsOptional, IsString, IsInt, Matches } from 'class-validator';

export class UpdateCustomOrderDto extends PartialType(CreateCustomOrderDto) {
    // Field finansial – hanya boleh diupdate oleh admin
    @IsInt()
    @IsOptional()
    dp_amount?: number;

    @IsInt()
    @IsOptional()
    remaining_amount?: number;

    @IsInt()
    @IsOptional()
    total_amount?: number;

    // Field status – hanya untuk admin
    @IsBoolean()
    @IsOptional()
    accept_status?: boolean;

    @IsBoolean()
    @IsOptional()
    payment_status?: boolean;
}