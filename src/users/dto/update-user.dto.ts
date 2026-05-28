import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffUserDto } from './create-staff-user.dto';

export class UpdateUserDto extends PartialType(CreateStaffUserDto) { }