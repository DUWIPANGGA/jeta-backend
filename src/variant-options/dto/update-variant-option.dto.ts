import { PartialType } from '@nestjs/mapped-types';
import { CreateVariantOptionDto } from './create-variant-option.dto';

export class UpdateVariantOptionDto extends PartialType(CreateVariantOptionDto) {}