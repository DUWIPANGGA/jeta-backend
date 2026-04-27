import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsString()
  image: string;

  @IsEnum(ProductStatus)
  status: ProductStatus;
}
