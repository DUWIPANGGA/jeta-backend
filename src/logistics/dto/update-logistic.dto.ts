// src/logistics/dto/update-logistic.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateLogisticDto } from './create-logistic.dto';

export class UpdateLogisticDto extends PartialType(CreateLogisticDto) {}