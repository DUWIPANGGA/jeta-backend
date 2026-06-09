import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateCustomJerseyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  deadline: Date;

  @IsString()
  @IsOptional()
  catatan_tambahan?: string;

  @IsString()
  @IsOptional()
  team_name?: string;

  @Transform(({ value }) => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? value : num;
  })
  @IsInt()
  @IsNotEmpty()
  jersey_template_id: number;

  @Transform(({ value }) => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? value : num;
  })
  @IsInt()
  @IsNotEmpty()
  color_option_id: number;

  @Transform(({ value }) => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? value : num;
  })
  @IsInt()
  @IsNotEmpty()
  material_option_id: number;

  @Transform(({ value }) => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? value : num;
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  name_item?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsOptional()
  pemain?: any[];

  @IsInt()
  @IsOptional()
  dp_amount?: number;

  @IsInt()
  @IsOptional()
  remaining_amount?: number;

  @IsInt()
  @IsOptional()
  total_amount?: number;
}
