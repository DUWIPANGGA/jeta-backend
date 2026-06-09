import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CombinationDto {
  @Type(() => Number)
  color_option_id: number;

  @Type(() => Number)
  size_option_id: number;

  @Type(() => Number)
  material_option_id: number;
}

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
  @ValidateNested({ each: true })
  @Type(() => CombinationDto)
  @IsOptional()
  combinations?: CombinationDto[];
}
