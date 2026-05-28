import {
    IsString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsInt,
    IsArray,
    ValidateNested,
    Min,
    ArrayMinSize,
    MaxLength,
    IsDateString,
    IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AdminCustomOrderItemDto {
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return parsed.map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id);
            } catch {
                return value;
            }
        }
        if (Array.isArray(value)) {
            return value.map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id);
        }
        return value;
    })
    @IsArray({ message: 'variant_option_ids must be an array' })
    @ArrayMinSize(1, { message: 'variant_option_ids must have at least 1 item' })
    @IsInt({ each: true, message: 'each value in variant_option_ids must be an integer number' })
    variant_option_ids: number[];

    @Transform(({ value }) => {
        const num = typeof value === 'string' ? parseInt(value, 10) : value;
        return isNaN(num) ? value : num;
    })
    @IsInt({ message: 'quantity must be an integer number' })
    @Min(1, { message: 'quantity must be at least 1' })
    @IsNotEmpty({ message: 'quantity is required' })
    quantity: number;

    @Transform(({ value }) => {
        const num = typeof value === 'string' ? parseInt(value, 10) : value;
        return isNaN(num) ? value : num;
    })
    @IsInt({ message: 'manual_price_per_pcs must be an integer number' })
    @Min(0, { message: 'manual_price_per_pcs must be at least 0' })
    @IsOptional()
    manual_price_per_pcs?: number;
}

export class CreateAdminCustomOrderDto {
    // Data Customer (pilih salah satu: user_id ATAU offline data)
    @IsInt()
    @IsOptional()
    user_id?: number;

    // Offline Customer Data
    @IsString()
    @IsOptional()
    @MaxLength(255)
    offline_customer_name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    offline_phone?: string;

    @IsString()
    @IsOptional()
    offline_address?: string;

    // Order Data
    @IsDateString()
    @IsNotEmpty()
    deadline: string;

    @IsString()
    @IsOptional()
    catatan_tambahan?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => AdminCustomOrderItemDto)
    items: AdminCustomOrderItemDto[];

    // Financial Data (Admin bisa langsung set)
    @IsInt()
    @Min(0)
    @IsOptional()
    dp_amount?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    total_amount?: number;

    // Admin Settings
    @IsInt()
    @Min(1)
    @IsOptional()
    production_estimate?: number;  // default 14

}