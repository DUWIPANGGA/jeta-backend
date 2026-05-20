// src/custom-orders/dto/update-custom-order.dto.ts
import { IsOptional, IsString, IsEmail, IsArray, ValidateNested, IsInt, Min, IsBoolean, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateCustomOrderItemDto {
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
  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  variant_option_ids?: number[];  // ← array of IDs, bukan single sub_category_id

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

export class UpdateCustomOrderDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @Type(() => Date)
  @IsOptional()
  deadline?: Date;

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
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateCustomOrderItemDto)
  items?: UpdateCustomOrderItemDto[];

  @IsInt()
  @IsOptional()
  dp_amount?: number;

  @IsInt()
  @IsOptional()
  remaining_amount?: number;

  @IsInt()
  @IsOptional()
  total_amount?: number;

  @IsBoolean()
  @IsOptional()
  accept_status?: boolean;

  @IsBoolean()
  @IsOptional()
  payment_status?: boolean;
}