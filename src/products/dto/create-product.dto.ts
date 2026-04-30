import { IsString, IsOptional, IsEnum, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ProductStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  category_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}