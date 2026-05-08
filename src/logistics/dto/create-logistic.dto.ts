// src/logistics/dto/create-logistic.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateLogisticDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama logistik tidak boleh kosong' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Alias (seperti JNE/JNT) wajib diisi' })
  @MaxLength(10, { message: 'Alias maksimal 10 karakter' })
  alias: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}