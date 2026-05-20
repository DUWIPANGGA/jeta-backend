import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateCustomVariantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}   