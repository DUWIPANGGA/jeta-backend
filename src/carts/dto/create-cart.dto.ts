import { IsInt, IsPositive } from 'class-validator';

export class CreateCartDto {
    @IsInt()
    @IsPositive()
    product_id: number;

    @IsInt()
    @IsPositive()
    product_variant_id: number;

    // Catatan: user_id biasanya diambil dari token JWT di Controller, 
    // bukan dikirim manual lewat body demi keamanan.
}