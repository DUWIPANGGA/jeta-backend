import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
  MaxLength,
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// EXPORT class ini
export class CustomOrderItemDto {
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
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @IsNotEmpty()
  variant_option_ids: number[];

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}

export class CreateCustomOrderDto {
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
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CustomOrderItemDto)
  items: CustomOrderItemDto[];

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