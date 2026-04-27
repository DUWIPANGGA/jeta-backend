import { IsNumber, IsOptional } from 'class-validator';

export class CreateCartItemDto {
  @IsNumber()
  user_id: number;

  @IsNumber()
  product_id: number;

  @IsNumber()
  variant_id: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  price_at_add?: number;
}
