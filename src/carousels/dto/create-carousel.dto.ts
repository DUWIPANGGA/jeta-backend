import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateCarouselDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  video_url?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
