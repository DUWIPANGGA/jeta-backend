import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateColorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'hex_code must be a valid hex color code (e.g., #FF0000)',
  })
  hex_code?: string;
}