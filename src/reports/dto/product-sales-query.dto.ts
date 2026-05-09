import { IsOptional, IsEnum, IsDateString, IsInt, Min, Max, IsBooleanString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class ProductSalesQueryDto {
  @IsOptional()
  @IsEnum({ 
    pending: OrderStatus.pending,
    processing: OrderStatus.processing,
    shipped: OrderStatus.shipped,
    completed: OrderStatus.completed,
    cancelled: OrderStatus.cancelled,
    all: 'all'
  })
  status?: string = 'completed';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsEnum({ product: 'product', variant: 'variant' })
  groupBy?: string = 'product';

  @IsOptional()
  @IsEnum({ quantity: 'quantity', revenue: 'revenue' })
  sortBy?: string = 'quantity';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 5;

  @IsOptional()
  @IsBooleanString()
  includeStats?: string = 'true';
}