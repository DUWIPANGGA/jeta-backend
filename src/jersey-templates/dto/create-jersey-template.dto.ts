import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJerseyTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsArray()
  @Type(() => Number)
  @IsOptional()
  color_ids?: number[];

  @IsArray()
  @Type(() => Number)
  @IsOptional()
  size_ids?: number[];

  @IsArray()
  @Type(() => Number)
  @IsOptional()
  material_ids?: number[];
}
