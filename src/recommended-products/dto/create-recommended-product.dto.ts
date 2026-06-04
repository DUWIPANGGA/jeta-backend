import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRecommendedProductDto {
  @IsInt()
  @IsNotEmpty()
  product_id: number;

  @IsInt()
  @IsOptional()
  order?: number;
}
