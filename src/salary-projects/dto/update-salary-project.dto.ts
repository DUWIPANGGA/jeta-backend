import { PartialType } from '@nestjs/mapped-types';
import { CreateSalaryProjectDto } from './create-salary-project.dto';

export class UpdateSalaryProjectDto extends PartialType(CreateSalaryProjectDto) { }