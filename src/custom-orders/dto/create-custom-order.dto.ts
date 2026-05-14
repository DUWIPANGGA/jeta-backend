// src/custom-orders/dto/create-custom-order.dto.ts
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsArray, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateCustomOrderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Type(() => Date)
  @IsNotEmpty()
  deadline: Date;

  @IsString()
  @IsOptional()
  catatan_tambahan?: string;

  @Transform(({ value }) => {
    // Parse JSON string dari FormData
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed;
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @IsNotEmpty()
  items: Array<{
    sub_category_id: number;
    quantity: number;
  }>;

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