import { IsString, IsInt, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PageAccessDto {
  @IsInt()
  pageId: number;

  @IsOptional()
  create?: boolean;

  @IsOptional()
  read?: boolean;

  @IsOptional()
  update?: boolean;

  @IsOptional()
  delete?: boolean;
}

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsInt()
  level: number;

  @IsString()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageAccessDto)
  accesses: PageAccessDto[];
}