import { IsString, IsOptional, IsNotEmpty, IsInt } from 'class-validator';

export class CreatePortofolioDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsOptional()
  client?: string;

}