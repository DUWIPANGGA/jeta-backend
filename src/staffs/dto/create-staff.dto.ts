import { IsInt, IsNotEmpty, IsOptional, IsDateString, Min, IsArray, ArrayMinSize } from 'class-validator';

export class CreateStaffDto {
    @IsInt()
    @IsNotEmpty()
    user_id: number;

    @IsArray()
    @IsOptional()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    stage_ids?: number[];   // array stage id

    @IsDateString()
    @IsNotEmpty()
    tgl_masuk: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    salary?: number;
}