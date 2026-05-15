// src/payment-methods/payment-methods.controller.ts
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
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('payment-methods')
@UseGuards(JwtAuthGuard, AccessGuard)
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) { }

  @Post()
  @Access(18, 'create')
  create(@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(createPaymentMethodDto);
  }

  @Get()
  @Access(18, 'read')
  findAll() {
    return this.paymentMethodsService.findAll();
  }

  @Get(':id')
  @Access(18, 'read')
  findOne(@Param('id') id: string) {
    return this.paymentMethodsService.findOne(+id);
  }

  @Patch(':id')
  @Access(18, 'update')
  update(
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.update(+id, updatePaymentMethodDto);
  }

  @Delete(':id')
  @Access(18, 'delete')
  remove(@Param('id') id: string) {
    return this.paymentMethodsService.remove(+id);
  }
}