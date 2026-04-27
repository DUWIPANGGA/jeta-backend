import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @IsNumber()
  order_id: number;

  @IsString()
  payment_method: string;

  @IsNumber()
  amount: number;

  @IsString()
  transaction_id: string;

  @IsOptional()
  @IsDateString()
  paid_at?: string;

  @IsString()
  payment_proof: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;
}
