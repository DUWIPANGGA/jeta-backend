// src/work-logs/dto/update-work-log.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkLogDto } from './create-work-log.dto';

export class UpdateWorkLogDto extends PartialType(CreateWorkLogDto) {}