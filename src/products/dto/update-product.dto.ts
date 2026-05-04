import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsEnum, IsNumber, Min, IsString } from 'class-validator';
import { ProductStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  category_id?: number;
}