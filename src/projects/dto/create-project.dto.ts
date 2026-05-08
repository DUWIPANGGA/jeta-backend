import { IsInt, IsNotEmpty, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TeamMemberDto {
    @IsInt()
    user_id: number;
}

export class CreateProjectDto {
    @IsInt()
    @IsNotEmpty()
    custom_order_id: number;

    @IsBoolean()
    @IsOptional()
    status?: boolean; // default true di service

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TeamMemberDto)
    @IsOptional()
    team?: TeamMemberDto[]; // array of { user_id: number }
}