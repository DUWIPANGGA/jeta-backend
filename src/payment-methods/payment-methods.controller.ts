import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from '../common/decorator/roles/roles.decorator';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) { }

  @Post()
  // @Roles(1, 2)
  // @Access(6, 'create')
  create(@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(createPaymentMethodDto);
  }

  @Get()
  // @Access(6, 'read')
  findAll() {
    return this.paymentMethodsService.findAll();
  }

  @Get(':id')
  // @Access(6, 'read')
  findOne(@Param('id') id: string) {
    return this.paymentMethodsService.findOne(+id);
  }

  @Patch(':id')
  // @Roles(1, 2)
  // @Access(6, 'update')
  update(
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.update(+id, updatePaymentMethodDto);
  }

  @Delete(':id')
  // @Roles(1, 2)
  // @Access(6, 'delete')
  remove(@Param('id') id: string) {
    return this.paymentMethodsService.remove(+id);
  }
}