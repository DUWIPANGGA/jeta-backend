import { IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateStageDto {
  @IsString()
  name: String;
}
