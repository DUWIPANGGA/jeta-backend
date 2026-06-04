import { PartialType } from '@nestjs/mapped-types';
import { CreateRecommendedProductDto } from './create-recommended-product.dto';

export class UpdateRecommendedProductDto extends PartialType(CreateRecommendedProductDto) {}
