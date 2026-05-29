import { IsNumber, IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminOrderItemDto {
  @IsNumber()
  product_variant_id: number;

  @IsNumber()
  quantity: number;
}

export class CreateAdminOrderDto {
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsString()
  offline_customer_name?: string;

  @IsOptional()
  @IsString()
  offline_phone?: string;

  @IsOptional()
  @IsString()
  offline_address?: string;

  @IsOptional()
  @IsString()
  shipping_address?: string;

  @IsNumber()
  payment_method_id: number;

  @IsOptional()
  @IsBoolean()
  payment_status?: boolean; // true = Lunas Instan di Kasir

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminOrderItemDto)
  items: AdminOrderItemDto[];
}
