// src/portofolio/dto/update-portofolio.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePortofolioDto } from './create-portofolio.dto';

export class UpdatePortofolioDto extends PartialType(CreatePortofolioDto) {}