import { IsString, IsOptional, IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus, {
    message: `Status harus salah satu dari: pending, processing, shipped, completed, cancelled`,
  })
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  shipping_address?: string;

  @IsOptional()
  @IsString()
  tracking_code?: string;
}
