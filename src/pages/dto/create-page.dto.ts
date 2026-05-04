import { IsInt, IsString } from 'class-validator';

export class CreatePageDto {
  @IsInt()
  nomor: number;

  @IsString()
  name: string;
}
