import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  size: string;

  @IsString()
  color: string;

  @IsNumber()
  product_id: number;

  @IsNumber()
  stock: number;

  @IsNumber()
  price_adjustment: number;
}
