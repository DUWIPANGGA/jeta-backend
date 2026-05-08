import { IsInt, IsOptional, IsString, IsEnum, IsDateString, Min } from 'class-validator';
import { PaymentStatus, OrderType } from '@prisma/client';

export class CreatePaymentDto {
  @IsInt()
  @IsOptional()
  custom_order_id?: number;

  @IsInt()
  @IsOptional()
  order_id?: number;

  @IsInt()
  @IsOptional()
  payment_method_id?: number;

  @IsString()
  @IsOptional()
  amount?: string;

  @IsOptional()
  @IsDateString()
  paid_at?: string;

  @IsString()
  @IsOptional()
  payment_proof?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  payment_status?: PaymentStatus;

  @IsEnum(OrderType)
  @IsOptional()
  order_type?: OrderType;
}