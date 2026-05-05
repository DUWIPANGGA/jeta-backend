import { IsString, IsOptional, IsNumber, Min, IsNotEmpty } from 'class-validator';
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
  @IsOptional()
  image?: string;
}