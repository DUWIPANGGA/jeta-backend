import { IsInt, Min, IsArray, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

export class CreateStaffUserDto extends CreateUserDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  salary?: number;

  @IsString()
  @IsOptional()
  tgl_masuk?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  @Type(() => Number)
  stage_ids?: number[];
}
