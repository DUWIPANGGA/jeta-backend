import { IsEmail, IsString, MinLength, ValidateIf } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  address: string;

  @nullable
  @IsString()
  phone?: string;
}

function nullable(target: Object, propertyKey: string | symbol): void {
  ValidateIf((obj, value) => value !== null && value !== undefined)(target, propertyKey);
}
