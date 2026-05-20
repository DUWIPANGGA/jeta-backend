import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductVariantDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  product_id: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  size_id?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  color_id?: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @Type(() => Number)
  stock: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price_adjustment?: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;
}