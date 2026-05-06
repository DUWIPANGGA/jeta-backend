// src/custom-orders/dto/update-custom-order.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomOrderDto } from './create-custom-order.dto';
import { IsBoolean, IsOptional, IsInt, Min, IsString } from 'class-validator';

export class UpdateCustomOrderDto extends PartialType(CreateCustomOrderDto) {
    @IsBoolean()
    @IsOptional()
    accept_status?: boolean;

    @IsInt()
    @IsOptional()
    @Min(0)
    dp_amount?: number;

    @IsInt()
    @IsOptional()
    @Min(0)
    remaining_amount?: number;

    @IsString()
    @IsOptional()
    phone?: string;  // ← String
}