import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantOptionDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  custom_variant_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}