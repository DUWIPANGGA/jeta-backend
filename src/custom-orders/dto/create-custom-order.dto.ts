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
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CustomOrderItemDto {
  @Transform(({ value }) => {
    // Handle jika value berupa string JSON
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // Pastikan setiap item adalah number
        return parsed.map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id);
      } catch {
        return value;
      }
    }
    // Jika sudah array, pastikan semua item number
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
}

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

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  deadline: Date;

  @IsString()
  @IsOptional()
  catatan_tambahan?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray({ message: 'items must be an array' })
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => CustomOrderItemDto)
  items: CustomOrderItemDto[];

  @IsInt()
  @IsOptional()
  dp_amount?: number;

  @IsInt()
  @IsOptional()
  remaining_amount?: number;

  @IsInt()
  @IsOptional()
  total_amount?: number;
}