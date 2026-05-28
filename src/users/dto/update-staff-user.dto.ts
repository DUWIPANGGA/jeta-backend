import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffUserDto } from './create-staff-user.dto';

export class UpdateStaffUserDto extends PartialType(CreateStaffUserDto) { }
