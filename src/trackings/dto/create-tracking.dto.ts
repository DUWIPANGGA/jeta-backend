import { IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateTrackingDto {
  @IsNumber()
  order_id: number;

  @IsString()
  current_stage: string;

  @IsNumber()
  progress_percentage: number;

  @IsDateString()
  estimated_completion: string;
}
