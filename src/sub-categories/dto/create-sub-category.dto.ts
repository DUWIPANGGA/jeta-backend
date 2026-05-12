// src/sub-categories/dto/create-sub-category.dto.ts
import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubCategoryDto {
    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    category_id: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}