import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
import { IsArray, IsOptional, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class TeamMemberDto {
    @IsInt()
    user_id: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TeamMemberDto)
    @IsOptional()
    team?: TeamMemberDto[];
}