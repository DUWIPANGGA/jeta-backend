import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffDto } from './create-staff.dto';
import { IsArray, IsOptional, IsInt } from 'class-validator';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
    @IsArray()
    @IsOptional()
    @IsInt({ each: true })
    stage_ids?: number[];
}