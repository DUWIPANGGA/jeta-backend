// src/finance/dto/create-payment.dto.ts
import { IsInt, IsNotEmpty, IsOptional, IsArray, ArrayMinSize, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreatePaymentDto {
    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    staff_id: number;

    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    @Transform(({ value }) => {
        // Jika value sudah array, langsung validasi
        if (Array.isArray(value)) {
            return value;
        }
        // Jika value adalah string, coba parse
        if (typeof value === 'string') {
            // Coba parse sebagai JSON
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (e) {
                // Jika bukan JSON, coba split berdasarkan koma
                if (value.includes(',')) {
                    return value.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
                }
            }
        }
        // Fallback: kembalikan array kosong (akan gagal validasi karena @ArrayMinSize)
        return [];
    })
    project_ids: number[];

    @IsString()
    @IsOptional()
    notes?: string;
}