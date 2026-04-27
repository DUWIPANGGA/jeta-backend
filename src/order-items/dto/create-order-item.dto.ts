import { IsNumber, IsOptional } from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber()
  order_id: number;

  @IsNumber()
  product_id: number;

  @IsNumber()
  variant_id: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  price?: number;
}
