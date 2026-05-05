import { IsString, IsEmail, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  address: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  role_id: number;  // ← ganti dari 'role' jadi 'role_id'
}