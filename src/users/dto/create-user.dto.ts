import { IsEmail, IsString, IsOptional, IsIn, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsIn(['admin', 'pic', 'customer'])
  role?: string;

  @MinLength(6)
  password: string;
}