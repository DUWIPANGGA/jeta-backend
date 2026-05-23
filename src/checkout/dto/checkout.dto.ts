import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutDto {
    @IsInt()
    @Type(() => Number)
    paymentMethodId: number;

    @IsString()
    @IsOptional()
    shippingAddress?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    shippingCost?: number;

    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    cart_item_ids?: number[];  // ← TAMBAH: ID cart items yang dipilih
}