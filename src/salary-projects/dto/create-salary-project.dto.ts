import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSalaryProjectDto {
    @IsInt()
    @IsNotEmpty()
    staff_id: number;

    @IsInt()
    @IsNotEmpty()
    project_id: number;

    @IsInt()
    @IsOptional()
    adjustment_salary?: number;
}