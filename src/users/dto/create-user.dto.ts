import { IsString, IsEmail, IsOptional, Min } from 'class-validator';
// import { Role } from '@prisma/client';

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
  phone: string;

  @Min(1)
  role: Number;
}