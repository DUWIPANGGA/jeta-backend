import { PartialType } from '@nestjs/mapped-types';
import { CreateTrackingDto } from './create-tracking.dto';
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTrackingDto extends PartialType(CreateTrackingDto) {
    @IsInt()
    @Min(0)
    @Max(100)
    @IsOptional()
    @Type(() => Number)
    progress_percentage?: number;
}