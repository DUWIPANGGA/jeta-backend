import { IsArray, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class PemainItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }) => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? value : num;
  })
  @IsInt()
  nomor_punggung: number;

  @Transform(({ value }) => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? value : num;
  })
  @IsInt()
  ukuran_option_id: number;
}

export class CalculatePemainDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PemainItemDto)
  pemain: PemainItemDto[];
}
