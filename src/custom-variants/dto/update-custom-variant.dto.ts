import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomVariantDto } from './create-custom-variant.dto';

export class UpdateCustomVariantDto extends PartialType(CreateCustomVariantDto) {}