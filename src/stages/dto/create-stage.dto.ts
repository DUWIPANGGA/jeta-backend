import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateStageDto {
  @IsString()
  stage_name: string;

  @IsInt()
  @Min(0)
  order_index: number;

  @IsString()
  @IsOptional()
  description?: string;
}