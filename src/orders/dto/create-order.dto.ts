import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class CreateOrderDto {
  @IsNumber()
  user_id: number;

  @IsString()
  order_number: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsNumber()
  grand_total: number;

  @IsString()
  shipping_address: string;

  @IsNumber()
  shipping_cost: number;

  @IsString()
  payment_method: string;

  @IsOptional()
  @IsString()
  tracking_code?: string;
}
