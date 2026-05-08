// update-custom-order.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomOrderDto } from './create-custom-order.dto';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateCustomOrderDto extends PartialType(CreateCustomOrderDto) {
    // Field finansial – hanya boleh diupdate oleh admin
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

    // Field status – hanya untuk admin
    @IsBoolean()
    @IsOptional()
    accept_status?: boolean;

    @IsBoolean()
    @IsOptional()
    payment_status?: boolean;
}