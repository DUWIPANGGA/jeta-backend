import { IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStageDto {
  @IsString()
  stage_name: string;

  @Type(() => Number)
  @Min(0)
  order_index: number;

  @IsString()
  @IsOptional()
  description?: string;
}