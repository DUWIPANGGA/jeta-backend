// src/portofolio/dto/create-portofolio.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePortofolioDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama portofolio tidak boleh kosong' })
  name: string;

  @IsString()
  @IsOptional()
  image?: string; // Biasanya berisi path/URL gambar

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  order?: number;
}

