// src/custom-orders/dto/update-custom-order.dto.ts
import { IsOptional, IsString, IsEmail, IsArray, ValidateNested, IsInt, Min, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateCustomOrderItemDto {
  @IsInt()
  @IsOptional()
  sub_category_id?: number;

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