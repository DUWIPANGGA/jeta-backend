import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDatumDto } from './create-customer-datum.dto';

export class UpdateCustomerDatumDto extends PartialType(CreateCustomerDatumDto) {}
