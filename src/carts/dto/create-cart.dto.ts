import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateCartDto {
    @IsInt()
    @IsPositive()
    product_id: number;

    @IsInt()
    @IsPositive()
    product_variant_id: number;

    @IsOptional()
    @IsInt()
    @IsPositive()
    quantity?: number;
}